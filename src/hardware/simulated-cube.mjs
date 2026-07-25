function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export class SimulatedCube {
  constructor({ bounds, x, y, angle = 0 } = {}) {
    this.bounds = bounds;
    this.x = x ?? (bounds.minX + bounds.maxX) / 2;
    this.y = y ?? (bounds.minY + bounds.maxY) / 2;
    this.angle = angle;
    this.left = 0;
    this.right = 0;
    this.commandUntil = 0;
    this.light = [55, 110, 255];
  }

  get connected() {
    return true;
  }

  async connect() {
    return this.snapshot();
  }

  snapshot() {
    return {
      connected: true,
      hasPosition: true,
      x: this.x,
      y: this.y,
      angle: this.angle,
      batteryLevel: 100,
      light: this.light,
    };
  }

  move(left, right, duration = 140) {
    this.left = left;
    this.right = right;
    this.commandUntil = performance.now() + duration;
  }

  update(deltaMs, now = performance.now()) {
    if (now >= this.commandUntil) this.stop();
    const seconds = Math.min(deltaMs, 50) / 1000;
    const speedScale = 1.15;
    const wheelBase = 32;
    const leftSpeed = this.left * speedScale;
    const rightSpeed = this.right * speedScale;
    const forward = (leftSpeed + rightSpeed) / 2;
    const angular = (leftSpeed - rightSpeed) / wheelBase;
    this.angle = Math.atan2(Math.sin(this.angle + angular * seconds), Math.cos(this.angle + angular * seconds));
    this.x = clamp(this.x + Math.cos(this.angle) * forward * seconds, this.bounds.minX, this.bounds.maxX);
    this.y = clamp(this.y + Math.sin(this.angle) * forward * seconds, this.bounds.minY, this.bounds.maxY);
  }

  stop() {
    this.left = 0;
    this.right = 0;
  }

  setLight(red, green, blue) {
    this.light = [red, green, blue];
  }

  playNote() {}

  playScore() {}

  disconnect() {
    this.stop();
  }
}