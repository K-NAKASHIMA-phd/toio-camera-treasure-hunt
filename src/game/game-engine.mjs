const DEFAULT_DISTANCE_BANDS = Object.freeze([
  Object.freeze({ name: "red", maximum: 50, color: [255, 50, 50], pulseMs: 350 }),
  Object.freeze({ name: "yellow", maximum: 90, color: [255, 205, 45], pulseMs: 700 }),
  Object.freeze({ name: "green", maximum: 140, color: [55, 210, 110], pulseMs: 1200 }),
  Object.freeze({ name: "cyan", maximum: 210, color: [35, 205, 220], pulseMs: null }),
  Object.freeze({ name: "blue", maximum: Infinity, color: [55, 110, 255], pulseMs: null }),
]);

export function distanceBetween(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function getDistanceBand(distance, bands = DEFAULT_DISTANCE_BANDS) {
  if (!Number.isFinite(distance) || distance < 0) {
    throw new RangeError("distance must be a non-negative finite number");
  }

  const index = bands.findIndex((band) => distance <= band.maximum);
  if (index < 0) {
    throw new RangeError("distance bands do not cover the supplied distance");
  }

  return { ...bands[index], index };
}

export class GameEngine {
  constructor({
    durationMs = 60_000,
    scoreRadius = 18,
    scorePauseMs = 600,
    targetFactory,
    wallFactory = () => [],
    distanceBands = DEFAULT_DISTANCE_BANDS,
  } = {}) {
    if (typeof targetFactory !== "function") {
      throw new TypeError("targetFactory is required");
    }

    this.durationMs = durationMs;
    this.scoreRadius = scoreRadius;
    this.scorePauseMs = scorePauseMs;
    this.targetFactory = targetFactory;
    this.wallFactory = wallFactory;
    this.distanceBands = distanceBands;
    this.reset();
  }

  reset() {
    this.phase = "ready";
    this.score = 0;
    this.rivalScore = 0;
    this.startedAt = null;
    this.finishedAt = null;
    this.scorePauseUntil = null;
    this.position = null;
    this.target = null;
    this.walls = [];
    this.distance = null;
    this.band = null;
    this.lastPulseAt = null;
  }

  start(now = performance.now(), position = null) {
    this.reset();
    this.phase = "running";
    this.startedAt = now;
    this.position = position ? { x: position.x, y: position.y } : null;
    this.#placeRound();
    return [{ type: "game-started" }, { type: "round-started" }];
  }

  stop(now = performance.now()) {
    if (this.phase === "finished") return [];
    this.phase = "finished";
    this.finishedAt = now;
    return [{ type: "game-finished", score: this.score }];
  }

  tick(now = performance.now()) {
    if ((this.phase === "running" || this.phase === "score-pause") && this.remainingMs(now) <= 0) {
      return this.stop(now);
    }

    if (this.phase === "score-pause" && now >= this.scorePauseUntil) {
      this.phase = "running";
      this.scorePauseUntil = null;
      this.#placeRound();
      return [{ type: "round-started" }];
    }

    if (this.phase !== "running" || !this.band?.pulseMs) return [];
    if (this.lastPulseAt !== null && now - this.lastPulseAt < this.band.pulseMs) return [];

    this.lastPulseAt = now;
    return [{ type: "proximity-pulse", band: this.band }];
  }

  updatePosition(position, now = performance.now()) {
    if (this.phase !== "running") return [];

    this.position = { x: position.x, y: position.y };
    this.distance = distanceBetween(this.position, this.target);
    const nextBand = getDistanceBand(this.distance, this.distanceBands);
    const events = [];

    if (nextBand.name !== this.band?.name) {
      const direction = this.band ? Math.sign(this.band.index - nextBand.index) : 0;
      this.band = nextBand;
      this.lastPulseAt = null;
      events.push({ type: "distance-band-changed", band: nextBand, direction });
    }

    if (this.distance <= this.scoreRadius) {
      this.score += 1;
      this.#pauseAfterScore(now);
      events.push({
        type: "scored",
        actor: "player",
        score: this.score,
        rivalScore: this.rivalScore,
        target: this.target,
      });
    }

    return events;
  }

  updateRivalPosition(position, now = performance.now()) {
    if (this.phase !== "running") return [];
    const distance = distanceBetween(position, this.target);
    if (distance > this.scoreRadius) return [];

    this.rivalScore += 1;
    this.#pauseAfterScore(now);
    return [{
      type: "rival-scored",
      actor: "rival",
      score: this.score,
      rivalScore: this.rivalScore,
      target: this.target,
    }];
  }

  remainingMs(now = performance.now()) {
    if (this.startedAt === null) return this.durationMs;
    const endpoint = this.finishedAt ?? now;
    return Math.max(0, this.durationMs - (endpoint - this.startedAt));
  }

  get targetVisible() {
    return this.phase === "score-pause";
  }

  #pauseAfterScore(now) {
    this.phase = "score-pause";
    this.scorePauseUntil = now + this.scorePauseMs;
  }

  #placeRound() {
    this.target = this.targetFactory({ position: this.position });
    this.walls = this.wallFactory({ position: this.position, target: this.target });
    this.distance = null;
    this.band = null;
    this.lastPulseAt = null;
  }
}

export { DEFAULT_DISTANCE_BANDS };