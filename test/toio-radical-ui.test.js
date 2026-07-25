"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  DualCubeSession,
  MatGrid,
  SIMPLE_TILE_MAT,
  createCirclePath,
  createOpposedCirclePaths,
} = require("../lib/toio-radical-ui.js");

test("MatGrid converts between mat and canvas coordinates", () => {
  const canvasRect = { x: 50, y: 20, width: 608, height: 432 };
  const canvasPoint = SIMPLE_TILE_MAT.toCanvas(SIMPLE_TILE_MAT.center, canvasRect);
  const matPoint = SIMPLE_TILE_MAT.toMat(canvasPoint, canvasRect);

  assert.deepEqual(canvasPoint, { x: 354, y: 236 });
  assert.deepEqual(matPoint, SIMPLE_TILE_MAT.center);
});

test("MatGrid assigns inclusive maximum coordinates to the last cell", () => {
  assert.deepEqual(SIMPLE_TILE_MAT.cellAt({ x: 98, y: 142 }), { row: 0, column: 0 });
  assert.deepEqual(SIMPLE_TILE_MAT.cellAt({ x: 402, y: 358 }), { row: 4, column: 6 });
  assert.equal(SIMPLE_TILE_MAT.cellAt({ x: 403, y: 358 }), undefined);
});

test("MatGrid clamps targets to its safety margin", () => {
  assert.deepEqual(SIMPLE_TILE_MAT.clamp({ x: -100, y: 999 }), { x: 114, y: 342 });
});

test("createCirclePath stays inside the safe mat area", () => {
  const path = createCirclePath({ radius: 80, segments: 16 });

  assert.equal(path.length, 16);
  for (const point of path) {
    assert.equal(SIMPLE_TILE_MAT.contains(point), true);
    assert.equal(Number.isFinite(point.angle), true);
  }
  assert.throws(() => createCirclePath({ radius: 1000, segments: 16 }), RangeError);
});

test("createOpposedCirclePaths keeps two cubes on opposite sides", () => {
  const [first, second] = createOpposedCirclePaths({ radius: 60, segments: 12 });

  assert.equal(first.length, 12);
  assert.equal(second.length, 12);
  for (let index = 0; index < first.length; index += 1) {
    assert.ok(Math.abs(Math.hypot(first[index].x - second[index].x, first[index].y - second[index].y) - 120) < 1e-9);
  }
});

test("DualCubeSession manages exactly two cubes", async () => {
  const calls = [];
  const createdCubes = [];
  const connector = async () => {
    const cube = {
      x: 250,
      y: 250,
      angle: 0,
      setFrameRate: (value) => calls.push(["frameRate", value]),
      turnLightOn: (value) => calls.push(["light", value]),
      moveTo: (target, speed) => calls.push(["moveTo", target, speed]),
      stop: () => calls.push(["stop"]),
      disconnect: () => calls.push(["disconnect"]),
    };
    createdCubes.push(cube);
    return cube;
  };
  const session = new DualCubeSession({ connector });

  await session.connectOne();
  await session.connectOne();

  assert.equal(session.count, 2);
  assert.equal(session.isFull, true);
  assert.equal(session.distanceBetweenCubes(), 0);
  assert.deepEqual(session.snapshots()[0].cell, { row: 2, column: 3 });
  await assert.rejects(() => session.connectOne(), /already connected/);

  session.moveTo(0, { x: 0, y: 999 }, 50);
  assert.deepEqual(calls.at(-1), ["moveTo", { x: 114, y: 342 }, 50]);

  session.disconnectAll();
  assert.equal(session.count, 0);
  assert.equal(calls.filter(([name]) => name === "stop").length, 2);
  assert.equal(calls.filter(([name]) => name === "disconnect").length, 2);
  assert.equal(createdCubes.length, 2);
});

test("DualCubeSession accepts a custom mapped grid", async () => {
  const mat = new MatGrid({ minX: 0, minY: 0, maxX: 100, maxY: 100, rows: 2, columns: 2 });
  let target;
  const session = new DualCubeSession({
    mat,
    connector: async () => ({
      moveTo: (nextTarget) => {
        target = nextTarget;
      },
    }),
  });

  await session.connectOne();
  session.moveTo(0, { x: 150, y: -50, angle: Math.PI });
  assert.deepEqual(target, { x: 100, y: 0, angle: Math.PI });
});