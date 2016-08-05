var parseString = require('xml2js').parseString;
var traverse = require('traverse');

function KogniConfig(inp) {
  if (typeof inp === 'string' || inp instanceof String) {
    this.url = inp;
  } else {
    this.json = inp;
  }
}

KogniConfig.prototype.init = function(callback) {
  if (this.url) {
    var _this = this;
    KogniConfig.loadXMLasJSON({
      url: this.url,
      callback: function(json) {
        _this.json = json.config;
        callback();
      },
    });
  } else {
      callback();
  }
};

KogniConfig.loadXMLasJSON = function(params) {
  var opts = params || {},
      url = params.url || 'data/config.xml',
      trim = opts.trim || true,
      explicitArray = opts.explicitArray || false,
      unifyArray = (explicitArray == 'unify'),
      xhttp = new XMLHttpRequest();

  if (unifyArray) explicitArray = false;

  xhttp.onreadystatechange = function() {
  if (xhttp.readyState==4 && xhttp.status==200) {
    parseString(xhttp.responseText, {trim: trim, explicitArray: explicitArray, attrkey: 'attr'},
      function(err, res) {
        //console.log(xhttp.responseText)
        if (unifyArray) KogniConfig._unify(res);
        params.callback(res);
      }
  );}};
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
  return traverse(this.json).get(elems);
};

KogniConfig.prototype.has = function(path) {
	var elems = path.split('.');
  return traverse(this.json).has(elems);
};

KogniConfig.prototype.set = function(path, value) {
  traverse(this.json).set(path, value);
};

module.exports = KogniConfig;
