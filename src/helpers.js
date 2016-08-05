// params id, key
exports.macros = function(obj) {
  return new Helper(obj);
};

function Helper(obj) {
  this.o = obj;
}

Helper.prototype.mangleScope = function(scope) {
  if (scope[0] != '/') {
    var prefix =  this.o.config.has('rsb.prefix') ? this.o.config.get('rsb.prefix') : "";
    scope = prefix + "/" +  scope;
  }
  return scope;
};

// http://stackoverflow.com/questions/1366127/instantiate-a-javascript-object-using-a-string-to-define-the-class-name
exports.stringToFunction = function(str) {
  var arr = str.split(".");

  var fn = (window || this);
  for (var i = 0, len = arr.length; i < len; i++) {
    fn = fn[arr[i]];
  }

  if (typeof fn !== "function") {
    throw new Error("function not found");
  }

  return  fn;
};
