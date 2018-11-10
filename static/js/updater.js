const Easing = {
  // no easing, no acceleration
  linear: function (t) { return t },
  // accelerating from zero velocity
  easeInQuad: function (t) { return t*t },
  // decelerating to zero velocity
  easeOutQuad: function (t) { return t*(2-t) },
  // acceleration until halfway, then deceleration
  easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
  // accelerating from zero velocity
  easeInCubic: function (t) { return t*t*t },
  // decelerating to zero velocity
  easeOutCubic: function (t) { return (--t)*t*t+1 },
  // acceleration until halfway, then deceleration
  easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
  // accelerating from zero velocity
  easeInQuart: function (t) { return t*t*t*t },
  // decelerating to zero velocity
  easeOutQuart: function (t) { return 1-(--t)*t*t*t },
  // acceleration until halfway, then deceleration
  easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
  // accelerating from zero velocity
  easeInQuint: function (t) { return t*t*t*t*t },
  // decelerating to zero velocity
  easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
  // acceleration until halfway, then deceleration
  easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
};

class Updater {
  constructor(value = 0, time = 500) {
    this.value = value;
    this.time = time;
    this.setValue(value, 0);
  }

  update() {
    let elapsed = performance.now() - this._start;
    let perc = Easing.easeOutCubic(Math.min(elapsed / this.time, 1));
    this.value = this.getTween(this._beginning, this._end, perc);
  }

  getTween(b, e, i) {
    return b + (i * (e - b));
  }

  setValue(value, diff = 2) {
    let _diff = Math.abs(value - (this._end || this.value));

    if (_diff >= diff) {
      this._beginning = this.value;
      this._end = value;
      this._start = performance.now();
    }
  }
}

export default Updater;
