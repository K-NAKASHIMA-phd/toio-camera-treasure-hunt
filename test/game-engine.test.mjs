import assert from "node:assert/strict";
import test from "node:test";

import { GameEngine, getDistanceBand } from "../src/game/game-engine.mjs";

test("distance bands progress from red to blue", () => {
  assert.equal(getDistanceBand(20).name, "red");
  assert.equal(getDistanceBand(70).name, "yellow");
  assert.equal(getDistanceBand(120).name, "green");
  assert.equal(getDistanceBand(180).name, "cyan");
  assert.equal(getDistanceBand(250).name, "blue");
});

test("GameEngine scores once and starts a new hidden round", () => {
  const targets = [{ x: 200, y: 200 }, { x: 300, y: 300 }];
  const engine = new GameEngine({ targetFactory: () => targets.shift() });

  engine.start(1_000);
  const events = engine.updatePosition({ x: 205, y: 200 }, 2_000);

  assert.equal(engine.score, 1);
  assert.equal(engine.targetVisible, true);
  assert.equal(events.at(-1).type, "scored");
  assert.deepEqual(engine.updatePosition({ x: 205, y: 200 }, 2_100), []);

  assert.deepEqual(engine.tick(2_600), [{ type: "round-started" }]);
  assert.deepEqual(engine.target, { x: 300, y: 300 });
  assert.equal(engine.targetVisible, false);
});

test("GameEngine reports approach and retreat transitions", () => {
  const engine = new GameEngine({ targetFactory: () => ({ x: 250, y: 250 }) });
  engine.start(0);

  const far = engine.updatePosition({ x: 0, y: 250 }, 100);
  const near = engine.updatePosition({ x: 130, y: 250 }, 200);
  const retreat = engine.updatePosition({ x: 0, y: 250 }, 300);

  assert.equal(far[0].band.name, "blue");
  assert.equal(near[0].direction, 1);
  assert.equal(retreat[0].direction, -1);
});

test("GameEngine finishes after sixty seconds", () => {
  const engine = new GameEngine({ targetFactory: () => ({ x: 250, y: 250 }) });
  engine.start(5_000);

  assert.equal(engine.tick(64_999).length, 0);
  assert.equal(engine.tick(65_000)[0].type, "game-finished");
  assert.equal(engine.phase, "finished");
  assert.equal(engine.remainingMs(90_000), 0);
});

test("GameEngine supplies the initial position to round factories", () => {
  let receivedPosition;
  const engine = new GameEngine({
    targetFactory: ({ position }) => {
      receivedPosition = position;
      return { x: 300, y: 300 };
    },
  });

  engine.start(0, { x: 140, y: 180 });
  assert.deepEqual(receivedPosition, { x: 140, y: 180 });
});

test("GameEngine restarts an active game and prioritizes its deadline", () => {
  const engine = new GameEngine({ targetFactory: () => ({ x: 250, y: 250 }) });
  engine.start(0, { x: 100, y: 100 });
  engine.updatePosition({ x: 250, y: 250 }, 500);
  assert.equal(engine.score, 1);

  engine.start(1_000, { x: 120, y: 120 });
  assert.equal(engine.score, 0);
  assert.equal(engine.remainingMs(1_000), 60_000);

  engine.updatePosition({ x: 250, y: 250 }, 60_900);
  const events = engine.tick(61_000);
  assert.equal(events[0].type, "game-finished");
  assert.equal(engine.phase, "finished");
});