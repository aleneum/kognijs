var UI = require('./ui');

var RSB = require('kognijs-rsb');
var $ = require('jquery');
var Vue = require('vue');
var traverse = require('traverse');

function init() {
  var ui = new UI('data/tour.xml', {});
  onLoad(ui, $, Vue);
}

function createInspector(params) {
  var out = "<table class=\"inspectTable\"><tr><th>key</th><th>value</th></tr>";
  console.log(JSON.stringify(params.data));
  try {
    traverse(params.data).forEach(function (val) {
      if (this.isLeaf) {
        var modelPath = this.path.join('.');
        out += "<tr><td>"+modelPath+"</td><td>{{"+modelPath+"}}</td></tr>";
      }
    });
  } catch (e) {
    console.log(e);
  }
  out += "</table>";
  $(params.el).html(out);
  console.log("DONE!")
}

window.onload = init;
window.createInspector = createInspector;
