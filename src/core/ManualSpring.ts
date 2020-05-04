interface ManualSpringProps {
  callback: Callback;
  tension?: number;
  friction?: number;
  mass?: number;
  threshold?: number;
  maxVelocity?: number;
  clamp?: boolean;
}

interface ToProps {
  to: number;
  from?: number;
  animate?: boolean;
  callback?: () => void;
}

type Callback = (currentValue: number, abort: () => void) => void;

type AnimationCallback = () => any;

const FRAME = 1 / 240;

export default class ManualSpring {
  private tension: number;
  private friction: number;
  private threshold: number;
  private mass: number;
  private maxVelocity: number;
  private clamp: boolean;

  private callback: Callback;

  private accumulatedTime: number = 0;
  private from: number = 0;
  private target: number = 0;
  private vel: number = 0;

  animating: boolean = false;
  private last: number | null = null;
  private nextTick: number = -1;

  private callbacks: AnimationCallback[] = [];

  constructor({
    callback,
    tension = 160,
    friction = 22,
    mass = 1,
    threshold = 0.03,
    clamp = false,
    maxVelocity = Infinity,
  }: ManualSpringProps) {
    this.callback = callback;
    this.from = 0;
    this.tension = tension;
    this.friction = friction;
    this.mass = mass;
    this.maxVelocity = maxVelocity;
    this.threshold = threshold;
    this.clamp = clamp;
  }

  to({to, from, animate = true, callback}: ToProps) {
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
    this.nextTick = window.requestAnimationFrame(this.update);
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
      this.nextTick = window.requestAnimationFrame(this.update);
      return;
    }

    const now = timestamp;
    this.accumulatedTime = Math.min((now - this.last) / 1000 + this.accumulatedTime, 2);

    // Replay frames if we skipped em
    while (this.accumulatedTime > FRAME) {
      this.accumulatedTime -= FRAME;
      const {vel, from, accel} = this.getUpdates(this.vel, this.from);
      this.vel = vel;
      this.from = from;
      if (this.clamp && ((this.vel > 0 && this.target < this.from) || (this.vel < 0 && this.target > this.from))) {
        console.log('stopping due to clamp');
        this.stop(this.target);
        return;
      }
      if (Math.abs(accel * FRAME) < this.threshold) {
        console.log('stopping due to threshold');
        this.stop(this.target);
        return;
      }
    }
    let {from} = this;
    if (this.accumulatedTime > 0) {
      const {from: _from} = this.getUpdates(this.vel, from);
      const increment = (_from - from) * (this.accumulatedTime / FRAME);
      from += increment;
    }
    this.callback(from, this.abort);
    if (this.animating) {
      this.last = now;
      this.nextTick = window.requestAnimationFrame(this.update);
    }
  };

  private stop(value: number) {
    window.cancelAnimationFrame(this.nextTick);
    this.animating = false;
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
