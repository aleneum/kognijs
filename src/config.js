var parseString = require('xml2js').parseString;
var traverse = require('traverse');

function KogniConfig(inp) {
  if (typeof inp === 'string' || inp instanceof String) {
    this.url = inp;
  } else {
    this.json = inp;
  }
}

KogniConfig.prototype.init = function(params, callback) {
  if (typeof params === "function") {
    callback = params;
    params = {}
  } else {
    params = params || {}
  }

  if (this.url || params.url) {
    params.url = params.url || this.url;
    params.checkTagConsistency = true;
    params.explicitArray = ['widget'];
    var _this = this;
    params.callback = function(err, res) {
      if (err) {
        callback(err);
      } else {
        _this.json = res.config;
        callback();
      }
    };
    KogniConfig.loadXMLasJSON(params);
  } else if (this.json) {
    callback();
  } else {
    callback(Error('Neither a URL nor a json configuration have been passed!'));
  }
};

KogniConfig.loadXMLasJSON = function(params) {
  var params = params || {},
    url = params.url || 'data/config.xml',
    trim = params.trim || true,
    checkTagConsistency = params.checkTagConsistency || false,
    explicitArray = ((! params.explicitArray) || Array.isArray(params.explicitArray)) ? false : params.explicitArray,
    arrayTags = (Array.isArray(params.explicitArray)) ? params.explicitArray : [],
    xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (xhttp.readyState==4) {
      if (xhttp.status==200) {
        parseString(xhttp.responseText, {trim: trim, explicitArray: explicitArray, attrkey: 'attr'},
          function(err, res) {
            if (err) {params.callback(err)};
            if (checkTagConsistency) {KogniConfig._unify(res)};
            if (arrayTags.length > 0) {
              _makeArray(res, arrayTags);
            }
            params.callback(undefined, res);
          }
        );
      } else {
        params.callback(Error("File loading error:", xhttp.status));
      }
    }};

  xhttp.open("GET",url,true);
  xhttp.send();
};

KogniConfig._unify = function(json) {
  var arrs = [];
  traverse(json).forEach(function(val){
    if (arrs.indexOf(this.key) !== -1) return;
    if (Array.isArray(val)) arrs.push(this.key);
  });

  _makeArray(json, arrs);
};

function _makeArray(json, arrs) {
  traverse(json).forEach(function(val){
    if (arrs.indexOf(this.key) !== -1) {
      if (! Array.isArray(val)) {
        this.update([val]);
        _makeArray(val, arrs);
      }
    }
  });
}

KogniConfig.prototype.get = function(path) {
  var elems = path.split('.');
  var value = traverse(this.json).get(elems);
  if (value === undefined) {throw Error('Configuration does not contain an element named ' + path)}
  return value;
};

KogniConfig.prototype.has = function(path) {
  var elems = path.split('.');
  return traverse(this.json).has(elems);
};

KogniConfig.prototype.set = function(path, value) {
  var elems = path.split('.');
  traverse(this.json).set(elems, value);
};

module.exports = KogniConfig;
