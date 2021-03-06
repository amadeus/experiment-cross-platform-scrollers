export type ManualSpringCallback = (currentValue: number, abort: () => void) => unknown;

export interface ManualSpringProps {
  callback: ManualSpringCallback;
  tension?: number;
  friction?: number;
  mass?: number;
  threshold?: number;
  maxVelocity?: number;
  clamp?: boolean;
  getNodeWindow?: () => Window | null;
}

export interface ManualSpringToProps {
  to: number;
  from?: number;
  animate?: boolean;
  callback?: () => unknown;
}

export type ManualSpringRestCallback = () => unknown;

// Physics are being calculated at 240 times a second - which will mean
// probably almost never needing to do multiple frames of interpolation
const FRAME = 1 / 240;

export default class ManualSpring {
  private tension: number;
  private friction: number;
  private threshold: number;
  private mass: number;
  private maxVelocity: number;
  private clamp: boolean;

  private callback: ManualSpringCallback;

  private accumulator: number = 0;
  private from: number = 0;
  private target: number = 0;
  private vel: number = 0;

  animating: boolean = false;
  private last: number | null = null;
  private nextTick: number = -1;
  private getNodeWindow: () => Window | null;
  private nodeWindow: Window | null = null;

  private callbacks: ManualSpringRestCallback[] = [];

  constructor({
    callback,
    tension = 160,
    friction = 22,
    mass = 1,
    threshold = 0.001,
    clamp = false,
    maxVelocity = Infinity,
    getNodeWindow = () => window,
  }: ManualSpringProps) {
    this.callback = callback;
    this.from = 0;
    this.tension = tension;
    this.friction = friction;
    this.mass = mass;
    this.maxVelocity = maxVelocity;
    this.threshold = threshold;
    this.clamp = clamp;
    this.getNodeWindow = getNodeWindow;
  }

  to({to, from, animate = false, callback}: ManualSpringToProps) {
    this.target = to;
    if (callback != null) {
      this.callbacks.push(callback);
    }

    if (from || from === 0) {
      this.from = from;
    }

    if (!animate) {
      this.stop(to);
      return;
    }

    if (this.animating) {
      return this;
    }

    this.start();
    return this;
  }

  cancel() {
    this.stop(this.from);
    return this;
  }

  abort = () => {
    this.animating = false;
  };

  private start() {
    this.animating = true;
    this.vel = 0;
    this.last = null;
    this.nodeWindow = this.getNodeWindow();
    this.nextTick = this.nodeWindow?.requestAnimationFrame(this.update) || -1;
  }

  private getUpdates(vel: number, from: number) {
    // NOTE(amadeus): Algo is a copy of React Spring, for consistency
    const force = -this.tension * (from - this.target);
    const damping = -this.friction * vel;
    const accel = (force + damping) / this.mass;
    vel += accel * FRAME;
    if (Math.abs(vel) > this.maxVelocity) {
      vel = this.maxVelocity * (vel > 0 ? 1 : -1);
    }
    from += vel * FRAME;
    return {from, vel, accel};
  }

  private update = (timestamp: number) => {
    if (!this.last) {
      this.last = timestamp;
      this.nextTick = this.nodeWindow?.requestAnimationFrame(this.update) || -1;
      return;
    }

    const now = timestamp;
    // NOTE(amadeus): Never add more than 2 seconds worth of time... it
    // probably means something has gone horribly wrong...
    this.accumulator = Math.min((now - this.last) / 1000 + this.accumulator, 2);

    // Physics are de-coupled from framerate.  We calculate them in a set
    // interval of 1/240 of a second.  Any remainder gets manually interpolated
    // at the end
    while (this.accumulator > FRAME) {
      this.accumulator -= FRAME;
      const {vel, from, accel} = this.getUpdates(this.vel, this.from);
      this.vel = vel;
      if (
        this.clamp &&
        (from === this.target ||
          (from < this.target && this.from > this.target) ||
          (from > this.target && this.from < this.target))
      ) {
        this.stop(this.target);
        return;
      }
      if (Math.abs(accel * FRAME) < this.threshold) {
        this.stop(this.target);
        return;
      }
      this.from = from;
    }
    let {from} = this;
    // Interpolate the render based on the remainder which is always less than
    // a frame
    if (this.accumulator > 0) {
      const {from: _from} = this.getUpdates(this.vel, from);
      const increment = (_from - from) * (this.accumulator / FRAME);
      from += increment;
    }
    this.callback(from, this.abort);
    if (this.animating) {
      this.last = now;
      this.nextTick = this.nodeWindow?.requestAnimationFrame(this.update) || -1;
    }
  };

  private stop(value: number) {
    this.nodeWindow?.cancelAnimationFrame(this.nextTick);
    this.animating = false;
    this.accumulator = 0;
    if (value != null) {
      this.target = this.from = value;
      this.callback(value, this.abort);
    }
    if (this.callbacks.length) {
      this.callbacks.forEach((callback) => callback());
      this.callbacks.length = 0;
    }
  }
}
