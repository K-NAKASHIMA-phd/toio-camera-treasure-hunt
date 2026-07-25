export class ToioController {
  constructor({ frameRate = 30 } = {}) {
    this.frameRate = frameRate;
    this.cube = null;
    this.light = [255, 255, 255];
  }

  get connected() {
    return Boolean(this.cube);
  }

  async connect() {
    if (typeof globalThis.P5tCube?.connectNewP5tCube !== "function") {
      throw new Error("p5.toioを読み込めませんでした");
    }

    this.cube = await globalThis.P5tCube.connectNewP5tCube();
    this.cube.setFrameRate?.(this.frameRate);
    this.setLight(255, 255, 255);
    return this.snapshot();
  }

  snapshot() {
    if (!this.cube) return { connected: false, hasPosition: false };
    const hasPosition = Number.isFinite(this.cube.x) && Number.isFinite(this.cube.y);
    return {
      connected: true,
      hasPosition,
      x: this.cube.x,
      y: this.cube.y,
      angle: this.cube.angle,
      batteryLevel: this.cube.batteryLevel,
      light: this.light,
    };
  }

  move(left, right, duration = 140) {
    this.cube?.move?.(left, right, duration);
  }

  stop() {
    this.cube?.stop?.();
  }

  setLight(red, green, blue, duration = 0) {
    this.light = [red, green, blue];
    this.cube?.turnLightOnRGB?.(red, green, blue, duration);
  }

  playNote(note, duration = 100) {
    this.cube?.playSingleNote?.(note, duration);
  }

  playScore() {
    const effect = globalThis.P5tCube?.seId?.get3 ?? 8;
    this.cube?.playSE?.(effect);
  }

  disconnect() {
    this.stop();
    this.cube?.disconnect?.();
    this.cube = null;
  }
}