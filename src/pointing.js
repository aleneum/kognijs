/**
 * Description
 * @method PointingOverlay
 * @param {} target
 * @param {} callback
 * @return 
 */
function PointingOverlay(target, callback) {
  this.state = 0; // 0 Unitialized; 1 Running;
  this.target = target;
  this.id = target.attr('id')
  this.callback = callback;
  this.rad = 0;
  this.isDone = false;
}

/**
 * Description
 * @method trigger
 * @return 
 */
PointingOverlay.prototype.trigger = function () {
  if (this.state == 0) {
    this.setup()
    this.interval = setInterval((function(self) {
        return function() {
           self.tick();
        }})(this), 100);
    this.state = 1;
  } else {
    this.timeout = 5;
    return;
  }
}

/**
 * Description
 * @method setup
 * @return 
 */
PointingOverlay.prototype.setup = function () {
  this.rad = 0;
  this.w = this.target.outerWidth();
  this.h = this.target.outerHeight();
  this.pl = this.target.position().left
  this.pt = this.target.position().top;
  this.target.append( PointingOverlay.template.format(
  this.id, this.w, this.h, this.pl, this.pt));
  this.canvas = $("#timer_"+this.id)[0];
  this.ctx = this.canvas.getContext('2d');
}

/**
 * Description
 * @method tick
 * @return 
 */
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
