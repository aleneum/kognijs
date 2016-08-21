var traverse = require('traverse');
var PointingOverlay = require('./pointing');
var macros = require('./helpers').macros;
var RSB = require('kognijs-rsb');
var KogniConfig = require('./config');
var Animate;

try {
  Animate = require('kognijs-animate');
} catch (e) {
  console.log('KogniJS-Animate has not been found.');
  Animate = null;
}


function KogniUI(configPath, model) {
  this.configPath = configPath || undefined;
  this.model = model || undefined;
  this.pointingEnabled = false;
  this.modelObservers = [];
  this.widgetDefinitions = {};
}


KogniUI.Config = KogniConfig;

KogniUI.prototype.init = function(callback) {
  this.config = new KogniConfig(this.configPath);
  this.rsb = new RSB();
  var _this = this;
  this.config.init(function(err) {
    if (err) {return callback(err);}
    if (Animate) {
      if (_this.config.has('projection')) {
        _this.projection = Animate.createProjection(_this.config.get('projection'), _this.model);
        _this.projection.init();
      }
    }

    var wuri = _this.config.has('rsb.host') ? _this.config.get('rsb.host') : undefined;
    if (! wuri) {
      console.log('No connection in configuration. skip RSB bindings');
      return callback();
    }
    _this.rsb.connect(wuri, function(err) {
      if (err) {return callback(err);}
      try {
        if (_this.config.has('rsb.pointing.path')) {
          _this.usePointing();
        }

        if (_this.config.has('rsb.canvasList.canvas')) {
          var canvasList = _this.config.get('rsb.canvasList.canvas');
          if (!(canvasList instanceof Array)) {
            var tmp = [];
            tmp.push(canvasList);
            canvasList = tmp;
          }

          canvasList.forEach(function (ob) {
            _this.enableRemoteCanvas(ob);
          })
        }

        if (_this.config.has('rsb.contentList.content')) {
          var contentList = _this.config.get('rsb.contentList.content');
          if (!(contentList instanceof Array)) {
            var tmp = [];
            tmp.push(contentList);
            contentList = tmp;
          }
          contentList.forEach(function (ob) {
            _this.enableRemoteContent(ob);
          });
        }

        if (_this.projection && _this.config.has('widgetList.widget')) {
          _this._loadWidgets();
        }

        if (_this.model) {
          _this.modelObservers = _this.bindModelToRSB(_this.model);
        }
      } catch(e) {
        err = e;
      }
      callback(err);
    }
    );
  });
};

KogniUI.prototype.usePointing = function() {
  this.rsb.createListener({
    scope: macros(this).mangleScope(this.config.get('rsb.pointing.path')),
    type: this.config.get('rsb.pointing.type'),
    callback: function(pos) {
      KogniUI.clickSim(pos.x * window.innerWidth, pos.y * window.innerHeight);
    },
  });
  this.pointingEnabled = true;
};

// componentId as in '#foo
KogniUI.prototype.enableRemoteContent = function(componentId) {
  var component = document.getElementById(componentId);
  if (! component) {
    throw(new Error("KogniUI.prototype.enableRemoteContent: no component found with id " + componentId));
  }

  this.rsb.createListener({
    scope: macros(this).mangleScope(componentId + "/html"),
    type: RSB.STRING,
    callback: function(content) {
      component.innerHTML = content;
    },
  });
};

KogniUI.prototype.enableRemoteCanvas =  function(componentId) {
  var parent = document.getElementById(componentId);
  if (!parent) {
    throw(new Error("KogniUI.prototype.enableRemoteCanvas: no component found with id " + componentId));
  }

  var w = parent.offsetWidth,
      h = parent.offsetHeight,
      pl = parent.offsetLeft,
      pt = parent.offsetTop;

  var template = document.createElement('template');
  template.innerHTML = CANVAS_TEMPLATE.format(componentId, w, h, pl, pt);

  parent.appendChild(template.content.firstChild);
  var canvas = document.getElementById(componentId + "_canvas");
  var ctx = canvas.getContext("2d");

  this.rsb.createListener({
    scope: macros(this).mangleScope(componentId + "/canvas"),
    type: RSB.STRING,
    callback: function(string) {
      var context = ctx;
      eval(string); // jshint ignore:line
    },
  });
};

KogniUI.prototype.enablePointing = function (componentId, callback) {
  var component = document.getElementById(componentId);
  if (!component) {
    throw new Error("KogniUI.prototype.enablePointing: no component found with id " + componentId);
  }

  if (!this.pointingEnabled) {
    this.usePointing();
  }
  component.pointing = new PointingOverlay(component, callback);

  component.addEventListener('click', function(event) {
    component.pointing.trigger();
  });
};

KogniUI.prototype.bindModelToRSB = function (model) {
  var observers = [];
  if (!this.config.has('rsb.viewmodel')) {
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

//TODO: allow callback if all widgets are loaded
KogniUI.prototype._loadWidgets = function () {
  // projection check happened in init();
  // if (! this.projection) {
  //   throw new Error('Projection has not been initialized. Widgets cannot be loaded.');
  // }

  //TODO: detach ID from Scope to allow multiple widgets on the same scope
  var _this = this;
  var widgets = this.config.get('widgetList.widget');
  widgets.forEach(function (w) {
    try {
      if (w.type.endsWith('.xml')) {
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        var escapedId = w.scope.replace(/\//g, '_');
        Animate.createWidget(w.type, {id: escapedId, projection: _this.projection}, function (err, widget) {
          if (err) {throw err;}
          widget.timeoutTime = w.timeout;
          widget.useObjectReference = w.useObjectReference;
          _this.projection.widgets[w.scope] = widget;
          _this.rsb.createListener({
            scope: macros(_this).mangleScope(w.scope),
            type: w.value,
            callback: function (val) {
              widget.update(val);
            },
          })
        });
      } else {
        if (w.type in _this.widgetDefinitions) {
          var widget = new _this.widgetDefinitions[w.type](_this.projection);
          widget.timeoutTime = w.timeout;
          _this.projection.widgets[w.scope] = widget;
          _this.rsb.createListener({
            scope: macros(_this).mangleScope(w.scope),
            type: w.value,
            callback: function (val) {
              widget.update(val);
            },
          });
        }
      }
    } catch (err) {
      console.log('Error during loadWidgets:', w.type, err);
    }
  });
};

KogniUI.clickSim = function(x,y){
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

var CANVAS_TEMPLATE = "<canvas id=\"{0}_canvas\" width=\"{1}px\" height=\"{2}px\" " +
          "style=\"position: absolute; left: {3}px; top: {4}px;\"></canvas>"
