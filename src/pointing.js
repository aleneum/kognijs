"use strict";

function PointingOverlay(target, callback) {
  this.state = 0; // 0 Unitialized; 1 Running;
  this.target = target;
  this.id = target.getAttribute('id');
  this.callback = callback;
  this.rad = 0;
  this.isDone = false;
}


PointingOverlay.prototype.trigger = function () {
  if (this.state == 0) {
    this.setup()
    this.interval = setInterval((function(self) {
        return function() {
           self.tick();
        }})(this), 100);
    this.state = 1;
  }
  this.timeout = 5;
}


PointingOverlay.prototype.setup = function () {
  this.rad = 0;
  this.w = this.target.offsetWidth;
  this.h = this.target.offsetHeight;
  this.pl = this.target.offsetLeft;
  this.pt = this.target.offsetTop;

  var template = document.createElement('template');
  template.innerHTML = PointingOverlay.template.format(this.id, this.w, this.h, this.pl, this.pt);
  this.target.appendChild(template.content.firstChild);
  this.canvas = document.getElementById("timer_"+this.id);
  this.ctx = this.canvas.getContext('2d');
}


PointingOverlay.prototype.tick = function () {
  if (! this.isDone) {
    this.ctx.clearRect(0,0,this.w, this.h);
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 30;
    this.ctx.beginPath();
    this.ctx.arc(this.w/2,this.h/2, this.h/3, 0, this.rad * Math.PI * 2);
    this.ctx.stroke();
    this.rad += 0.05;
    if (this.rad > 1.04) {
      this.callback();
      this.isDone = true;
    }
  }
  this.timeout -= 1;
  if (this.timeout < 0) {
    this.canvas.remove();
    this.canvas = 0;
    this.ctx = 0;
    this.isDone = false;
    this.state = 0;
    clearInterval(this.interval);
  }
}


PointingOverlay.template = "<canvas id=\"timer_{0}\" width=\"{1}px\" height=\"{2}px\" " +
      "class=\"choiceTimer\" style=\"position: absolute; left: {3}px; top:{4}px;\"></canvas>";

module.exports = PointingOverlay;
