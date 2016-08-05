var $ = require('jquery');
var traverse = require('traverse');
var PointingOverlay = require('./pointing');
var macros = require('./helpers').macros;
var RSB = require('kognijs-rsb');
var Animate = require('kognijs-animate');
var Projection = Animate.Projection;
var KogniConfig = require('./config');

function KogniUI(configPath, model) {
  this.configPath = configPath || undefined;
  this.model = model || undefined;
  this.pointingEnabled = false;
  this.modelObservers = [];
}

KogniUI.Config = KogniConfig;

KogniUI.prototype.init = function(callback) {
  this.config = new KogniConfig(this.configPath);
  this.rsb = new RSB();
  this.animate = new Animate(this.model);

  var _this = this;
  this.config.init(function() {


    if (_this.config.has('projection')) {
      (_this.model.detection) ? (_this.model.detection.objects) ? '' : _this.model.detection.objects = [] : _this.model.detection = {objects: []}
      _this.projection = new Projection(_this.config.get('projection'), _this.model);
    }


    var wuri = _this.config.has('rsb.host') ? _this.config.get('rsb.host') : undefined;
    if (! wuri) {
      console.log('no connection in configuration. skip RSB bindings');
      callback();
      return;
    }
    _this.rsb.connect(wuri, function() {
      if (_this.config.has('rsb.pointing.path')) {
        _this.usePointing();
      }

      if (_this.config.has('rsb.canvasList.canvas')) {
        var canvasList = _this.config.get('rsb.canvasList.canvas');
        if (! (canvasList instanceof Array)) {
          var tmp = [];
          tmp.push(canvasList);
          canvasList = tmp;
        }

        canvasList.forEach(function(ob) {
          _this.enableRemoteCanvas(ob);
        })
      }

      if (_this.config.has('rsb.contentList.content')) {
        var contentList = _this.config.get('rsb.contentList.content');
        if (! (contentList instanceof Array)) {
          var tmp = [];
          tmp.push(contentList);
          contentList = tmp;
        }
        contentList.forEach(function(ob) {
          _this.enableRemoteContent(ob);
        });
      }

      if (_this.model) {
        _this.modelObservers = _this.bindModelToRSB(_this.model);
      }

      callback();
    }
    );
  });
};

KogniUI.prototype.usePointing = function() {
  this.rsb.createListener({
    scope: macros(this).mangleScope(this.config.get('rsb.pointing.path')),
    type: this.config.get('rsb.pointing.type'),
    callback: function(pos) {
      clickSim(pos.x * window.innerWidth, pos.y * window.innerHeight);
    },
  });
  this.pointingEnabled = true;
};

// componentId as in '#foo
KogniUI.prototype.enableRemoteContent = function(componentId) {
  var component = $(componentId);
  if (component.length < 1) {
    console.log("KogniUI.prototype.enableRemoteContent: no component found with id", componentId);
    return;
  }

  this.rsb.createListener({
    scope: macros(this).mangleScope(componentId.slice(1) + "/html"),
    type: RSB.STRING,
    callback: function(content) {
      component.html(content);
    },
  });
};

KogniUI.prototype.enableRemoteCanvas =  function(componentId) {
  var parent = $(componentId);
  if (parent.length < 1) {
    console.log("KogniUI.prototype.enableRemoteCanvas: no component found with id", componentId);
    return;
  }

  console.log('trying to create canvas...');
  var w = parent.outerWidth(),
      h = parent.outerHeight(),
      pl = parent.position().left,
      pt = parent.position().top,
      c = "<canvas id=\"{0}_canvas\" width=\"{1}px\" height=\"{2}px\" " +
          "style=\"position: absolute; left: {3}px; top: {4}px;\"></canvas>";

  parent.append(c.format(parent[0].id, w, h, pl, pt));

  var canvas = document.getElementById(parent[0].id + "_canvas");
  var ctx = canvas.getContext("2d");
  console.log('canvas created... initialize listener');
  this.rsb.createListener({
    scope: macros(this).mangleScope(componentId.slice(1) + "/canvas"),
    type: RSB.STRING,
    callback: function(string) {
      var context = ctx;
      eval(string); // jshint ignore:line
    },
  });
};

KogniUI.prototype.enablePointing = function (componentId, callback) {
  var component = $("#"+componentId);
  if (component.length < 1) {
    console.log("KogniUI.prototype.enablePointing: no component found with id", componentId);
    return;
  }

  if (!this.pointingEnabled) {
    this.usePointing();
  }
  component.pointing = new PointingOverlay(component, callback);
  component.on('pointing', function(event) {
    component.pointing.trigger();
  });
  //this(this, component, callback);
};

KogniUI.prototype.bindModelToRSB = function (model) {
  var observers = [];
  if (!this.config.has('rsb.viewmodel')) {
      console.log("WARNING: config has no viewmodel mapping");
      return observers;
  }
  var mapping = this.config.get('rsb.viewmodel');
  var _this = this;
  traverse(mapping).forEach(function(val){
      // We check for attributes here. This should be the leaf node in XML
      if (this.key == 'attr') {
        // Remove attr from path.
        var modelPath = this.path.slice(0,-1),
            scope = modelPath.join('/'),
            outgoing = false;
        if (val.scope) {
          scope = val.scope;
        } else {
          scope = 'model/' + scope;
        }
        if (val.bidirectional) {
          if (val.bidirectional === 'true') {
            outgoing = scope;
          } else {
            outgoing = val.bidirectional;
          }
        }
        var cb;
        if(outgoing) {
          var pub = _this.rsb.createInformer({
            scope: macros(_this).mangleScope(outgoing),
            type: val.type,
          });
          observers.push({target: modelPath, informer: pub});
          cb = function(x) {
            pub.block = true;
            traverse(model).set(modelPath, x);
            //console.log(traverse(model).get(modelPath));
            //console.log("DONE!");
          };
        } else {
          cb = function(x) {
            //console.log(traverse(model).get(modelPath), ' -> ', x);
            traverse(model).set(modelPath, x);
          };
        }

        if (!traverse(model).has(modelPath)) {
          traverse(model).set(modelPath, RSB.getDefault(val.type));
        }

        _this.rsb.createListener({
          scope: macros(_this).mangleScope(scope),
          type: val.type,
          callback: cb,
        });

    }
  });
  return observers;
};

KogniUI.prototype.addWidgetDefinitions = function(definitions) {
  for (var def in definitions) {
    this.projection.WidgetDefs[def] = definitions[def];
  }
};

KogniUI.prototype.loadWidgets = function () {
  var _this = this;
  var widgets = this.config.get('widgetList.widget');
  widgets.forEach(function(w) {
    try{
      if (w.type.endsWith('.xml')) {
        console.log(_this.animate);
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('id', w.id.replace('/','_'));
        _this.projection.overlay.appendChild(svg);
        _this.animate.loadElement(w.type, {parent: w.id.replace('/','_')}, function(animation) {
          var widget = new AnimationWidget(animation, _this.projection);
          widget.timeoutTime = w.timeout;
          widget.useObjectReference = w.useObjectReference;
          _this.projection.widgets[w.id] = widget;
          _this.rsb.createListener({
            scope: macros(_this).mangleScope(w.id),
            type: w.value,
            callback: function(val) {
              widget.update(val);
            },
          })
        });
      } else {
        var widget = _this.projection.loadWidget(w.type, w.id);
        widget.timeoutTime = w.timeout;
        _this.rsb.createListener({
          scope: macros(_this).mangleScope(w.id),
          type: w.value,
          callback: function(val) {
             widget.update(val);
          },
        });
      }
    } catch(err) {
      console.log('Error during loadWidgets:', w.type, err);
    }
  });
};

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}

function AnimationWidget(animation, projection) {
  this.animation = animation;
  this.projection = projection;
  this.timeout = null;
  this.timeoutTime = null;
  this.useObjectReference = false;
  this.reset()
}

AnimationWidget.prototype.reset = function() {
  this.animation._element.attr({style:"visibility: hidden;"});
  if (this.timeout) {clearTimeout(this.timeout)}
  this.update = function(value) {
    this.animation._model = undefined;
    this.animation._element.attr({style:""});
    this.update = this._update;
    this.update(value);
  }
};

AnimationWidget.prototype._update = function(value) {
  clearTimeout(this.timeout);
  var oldModel = this.animation._model;
  this.animation._model = traverse(value).clone();
  if ((this.useObjectReference) && (value.hasOwnProperty('object_reference'))) {
    this.animation._model.object_reference = this.projection.resolveObjectReference(value.object_reference, true);
    //this.animation.moveTo(this.animation._model.object_reference.left-this.animation._s.attr("width")/2,
    //                      this.animation._model.object_reference.top-this.animation._s.attr("height")/2);
  }

  for (var prop in value) {
    var oldVal = (oldModel) ? oldModel[prop] : undefined;
    this.animation.set(prop, value[prop], oldVal);
  }

  if (this.timeoutTime) {
    var _this = this;
    this.timeout = setTimeout(function(){_this.update(value)}, this.timeoutTime);
  }
};

function clickSim(x,y){
    var el = document.elementFromPoint(x,y);
    if (el) {
      var rect = el.getBoundingClientRect();
      var params = {
        bubbles: true, cancelable: true, view: window, isTrusted: true,
        clientX: x, clientY: y, offsetX: x - rect.left, offsetY: y - rect.top
      };

      var down = new MouseEvent('mousedown', params);
      el.dispatchEvent(down);
      var up = new MouseEvent('mouseup', params);
      el.dispatchEvent(up);
      var click = new MouseEvent('click', params);
      el.dispatchEvent(click);
    }
}

module.exports = KogniUI;
