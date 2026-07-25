import { firstWallCollision } from "./walls.mjs";

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y);
  if (length < 1e-9) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

export class RivalNpc {
  constructor({
    bounds,
    random = Math.random,
    speed = 18,
    thinkingIntervalMs = 900,
    targetError = 58,
    idleChance = 0.22,
  } = {}) {
    this.bounds = bounds;
    this.random = random;
    this.speed = speed;
    this.thinkingIntervalMs = thinkingIntervalMs;
    this.targetError = targetError;
    this.idleChance = idleChance;
    this.reset();
  }

  reset(position = { x: this.bounds.maxX - 24, y: this.bounds.minY + 24 }) {
    this.position = { x: position.x, y: position.y };
    this.heading = Math.PI;
    this.velocity = { x: 0, y: 0 };
    this.nextDecisionAt = 0;
    this.estimatedTarget = null;
  }

  update({ now, deltaMs, target, walls = [], active = true }) {
    if (!active || !target) {
      this.velocity = { x: 0, y: 0 };
      return this.snapshot();
    }

    if (now >= this.nextDecisionAt || !this.estimatedTarget) {
      this.#chooseDirection(now, target);
    }

    const seconds = Math.min(deltaMs, 50) / 1000;
    const next = {
      x: this.position.x + this.velocity.x * seconds,
      y: this.position.y + this.velocity.y * seconds,
    };
    const wall = firstWallCollision(this.position, next, walls, 15);

    if (wall) {
      const previousX = this.velocity.x;
      this.velocity = normalize({ x: -this.velocity.y, y: previousX });
      this.velocity.x *= this.speed;
      this.velocity.y *= this.speed;
      this.nextDecisionAt = now + this.thinkingIntervalMs / 2;
    } else {
      this.position.x = clamp(next.x, this.bounds.minX, this.bounds.maxX);
      this.position.y = clamp(next.y, this.bounds.minY, this.bounds.maxY);
    }

    if (Math.hypot(this.velocity.x, this.velocity.y) > 0) {
      this.heading = Math.atan2(this.velocity.y, this.velocity.x);
    }
    return this.snapshot();
  }

  snapshot() {
    return {
      x: this.position.x,
      y: this.position.y,
      angle: this.heading,
      estimatedTarget: this.estimatedTarget,
      moving: Math.hypot(this.velocity.x, this.velocity.y) > 0,
    };
  }

  #chooseDirection(now, target) {
    this.nextDecisionAt = now + this.thinkingIntervalMs * (0.7 + this.random() * 0.8);
    if (this.random() < this.idleChance) {
      this.velocity = { x: 0, y: 0 };
      return;
    }

    this.estimatedTarget = {
      x: target.x + (this.random() * 2 - 1) * this.targetError,
      y: target.y + (this.random() * 2 - 1) * this.targetError,
    };
    const direction = normalize({
      x: this.estimatedTarget.x - this.position.x,
      y: this.estimatedTarget.y - this.position.y,
    });
    this.velocity = { x: direction.x * this.speed, y: direction.y * this.speed };
  }
}