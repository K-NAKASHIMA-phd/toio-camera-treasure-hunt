import assert from "node:assert/strict";
import test from "node:test";

import { projectedPoint, wheelCommandForDirection } from "../src/control/absolute-motion-controller.mjs";
import { DirectionClassifier, palmCenter } from "../src/input/direction-classifier.mjs";
import { generateWalls, pathExists, segmentHitsWall } from "../src/game/walls.mjs";

const bounds = { minX: 114, minY: 158, maxX: 386, maxY: 342 };

test("generated walls leave a route between start and target", () => {
  let seed = 42;
  const random = () => {
    seed = (seed * 16_807) % 2_147_483_647;
    return (seed - 1) / 2_147_483_646;
  };
  const start = { x: 130, y: 170 };
  const target = { x: 370, y: 325 };
  const walls = generateWalls({ bounds, start, target, random, minimum: 3, maximum: 3 });

  assert.equal(walls.length, 3);
  assert.equal(pathExists({ bounds, start, target, walls }), true);
  assert.equal(walls.every((wall) => wall.revealed === false), true);
});

test("wall collision accounts for cube clearance", () => {
  const wall = { x: 200, y: 200, width: 70, height: 12 };
  assert.equal(segmentHitsWall({ x: 220, y: 160 }, { x: 220, y: 180 }, wall, 20), true);
  assert.equal(segmentHitsWall({ x: 120, y: 160 }, { x: 120, y: 180 }, wall, 20), false);
});

test("absolute directions rotate before driving", () => {
  assert.deepEqual(wheelCommandForDirection("right", 0), { left: 42, right: 42, duration: 140 });
  assert.deepEqual(wheelCommandForDirection("down", 0), { left: 34, right: -34, duration: 140 });
  assert.deepEqual(wheelCommandForDirection("neutral", 0), { left: 0, right: 0, duration: 140 });
  assert.deepEqual(projectedPoint({ x: 100, y: 100 }, "left", 20), { x: 80, y: 100 });
});

test("hand direction uses calibration, dead zone, and confidence", () => {
  const classifier = new DirectionClassifier();
  classifier.calibrate({ x: 0.5, y: 0.5 });

  assert.equal(classifier.classify({ x: 0.52, y: 0.51 }), "neutral");
  assert.equal(classifier.classify({ x: 0.5, y: 0.35 }), "up");
  assert.equal(classifier.classify({ x: 0.35, y: 0.49 }), "left");
  assert.equal(classifier.classify({ x: 0.8, y: 0.5 }, 0.2), "neutral");
});

test("palm center averages wrist and MCP landmarks", () => {
  const landmarks = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
  for (const index of [0, 5, 9, 13, 17]) landmarks[index] = { x: 0.5, y: 0.25 };
  assert.deepEqual(palmCenter(landmarks), { x: 0.5, y: 0.25 });
});