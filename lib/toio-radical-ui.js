(function attachToioRadicalUI(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.ToioRadicalUI = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createApi() {
  "use strict";

  function requireFinite(value, name) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${name} must be a finite number`);
    }
  }

  function requirePositiveInteger(value, name) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new TypeError(`${name} must be a positive integer`);
    }
  }

  function normalizeRect(rect) {
    if (!rect) {
      throw new TypeError("rect is required");
    }

    const normalized = {
      x: rect.x ?? 0,
      y: rect.y ?? 0,
      width: rect.width,
      height: rect.height,
    };

    requireFinite(normalized.x, "rect.x");
    requireFinite(normalized.y, "rect.y");
    requireFinite(normalized.width, "rect.width");
    requireFinite(normalized.height, "rect.height");

    if (normalized.width <= 0 || normalized.height <= 0) {
      throw new RangeError("rect width and height must be greater than zero");
    }

    return normalized;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function normalizeAngle(angle) {
    requireFinite(angle, "angle");
    const fullTurn = Math.PI * 2;
    let normalized = angle % fullTurn;

    if (normalized < -Math.PI) {
      normalized += fullTurn;
    } else if (normalized > Math.PI) {
      normalized -= fullTurn;
    }

    return normalized;
  }

  function distance(first, second) {
    requireFinite(first?.x, "first.x");
    requireFinite(first?.y, "first.y");
    requireFinite(second?.x, "second.x");
    requireFinite(second?.y, "second.y");
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  class MatGrid {
    constructor({ minX, minY, maxX, maxY, rows = 5, columns = 7, safetyMargin = 0 }) {
      requireFinite(minX, "minX");
      requireFinite(minY, "minY");
      requireFinite(maxX, "maxX");
      requireFinite(maxY, "maxY");
      requireFinite(safetyMargin, "safetyMargin");
      requirePositiveInteger(rows, "rows");
      requirePositiveInteger(columns, "columns");

      if (maxX <= minX || maxY <= minY) {
        throw new RangeError("max values must be greater than min values");
      }

      if (safetyMargin < 0 || safetyMargin * 2 >= Math.min(maxX - minX, maxY - minY)) {
        throw new RangeError("safetyMargin is outside the usable mat area");
      }

      this.minX = minX;
      this.minY = minY;
      this.maxX = maxX;
      this.maxY = maxY;
      this.rows = rows;
      this.columns = columns;
      this.safetyMargin = safetyMargin;
    }

    get width() {
      return this.maxX - this.minX;
    }

    get height() {
      return this.maxY - this.minY;
    }

    get center() {
      return {
        x: (this.minX + this.maxX) / 2,
        y: (this.minY + this.maxY) / 2,
      };
    }

    get safeBounds() {
      return {
        minX: this.minX + this.safetyMargin,
        minY: this.minY + this.safetyMargin,
        maxX: this.maxX - this.safetyMargin,
        maxY: this.maxY - this.safetyMargin,
      };
    }

    contains(point, includeSafetyMargin = true) {
      if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) {
        return false;
      }

      const bounds = includeSafetyMargin
        ? this.safeBounds
        : { minX: this.minX, minY: this.minY, maxX: this.maxX, maxY: this.maxY };

      return (
        point.x >= bounds.minX &&
        point.x <= bounds.maxX &&
        point.y >= bounds.minY &&
        point.y <= bounds.maxY
      );
    }

    clamp(point, includeSafetyMargin = true) {
      requireFinite(point?.x, "point.x");
      requireFinite(point?.y, "point.y");
      const bounds = includeSafetyMargin
        ? this.safeBounds
        : { minX: this.minX, minY: this.minY, maxX: this.maxX, maxY: this.maxY };

      return {
        ...point,
        x: clamp(point.x, bounds.minX, bounds.maxX),
        y: clamp(point.y, bounds.minY, bounds.maxY),
      };
    }

    toCanvas(point, rect) {
      requireFinite(point?.x, "point.x");
      requireFinite(point?.y, "point.y");
      const target = normalizeRect(rect);

      return {
        x: target.x + ((point.x - this.minX) / this.width) * target.width,
        y: target.y + ((point.y - this.minY) / this.height) * target.height,
      };
    }

    toMat(point, rect, clampToSafeArea = false) {
      requireFinite(point?.x, "point.x");
      requireFinite(point?.y, "point.y");
      const source = normalizeRect(rect);
      const mapped = {
        x: this.minX + ((point.x - source.x) / source.width) * this.width,
        y: this.minY + ((point.y - source.y) / source.height) * this.height,
      };

      return clampToSafeArea ? this.clamp(mapped) : mapped;
    }

    cellAt(point) {
      if (!this.contains(point, false)) {
        return undefined;
      }

      const column = Math.min(
        this.columns - 1,
        Math.floor(((point.x - this.minX) / this.width) * this.columns),
      );
      const row = Math.min(
        this.rows - 1,
        Math.floor(((point.y - this.minY) / this.height) * this.rows),
      );

      return { row, column };
    }

    cellCenter(row, column) {
      this.requireCell(row, column);
      return {
        x: this.minX + ((column + 0.5) / this.columns) * this.width,
        y: this.minY + ((row + 0.5) / this.rows) * this.height,
      };
    }

    requireCell(row, column) {
      if (
        !Number.isInteger(row) ||
        !Number.isInteger(column) ||
        row < 0 ||
        row >= this.rows ||
        column < 0 ||
        column >= this.columns
      ) {
        throw new RangeError(`cell (${row}, ${column}) is outside the grid`);
      }
    }
  }

  const SIMPLE_TILE_MAT = new MatGrid({
    minX: 98,
    minY: 142,
    maxX: 402,
    maxY: 358,
    rows: 5,
    columns: 7,
    safetyMargin: 16,
  });

  function createCirclePath({
    mat = SIMPLE_TILE_MAT,
    center = mat.center,
    radius,
    segments = 24,
    startAngle = 0,
    clockwise = true,
    tangentAngle = true,
  }) {
    if (!(mat instanceof MatGrid)) {
      throw new TypeError("mat must be a MatGrid");
    }

    requireFinite(center?.x, "center.x");
    requireFinite(center?.y, "center.y");
    requireFinite(radius, "radius");
    requireFinite(startAngle, "startAngle");
    requirePositiveInteger(segments, "segments");

    if (segments < 3) {
      throw new RangeError("segments must be at least 3");
    }

    const bounds = mat.safeBounds;
    const maximumRadius = Math.min(
      center.x - bounds.minX,
      bounds.maxX - center.x,
      center.y - bounds.minY,
      bounds.maxY - center.y,
    );

    if (radius <= 0 || radius > maximumRadius) {
      throw new RangeError(`radius must be greater than 0 and at most ${maximumRadius}`);
    }

    const direction = clockwise ? 1 : -1;
    const path = [];

    for (let index = 0; index < segments; index += 1) {
      const radialAngle = startAngle + direction * ((Math.PI * 2 * index) / segments);
      const point = {
        x: center.x + Math.cos(radialAngle) * radius,
        y: center.y + Math.sin(radialAngle) * radius,
      };

      if (tangentAngle) {
        point.angle = normalizeAngle(radialAngle + direction * (Math.PI / 2));
      }

      path.push(point);
    }

    return path;
  }

  function createOpposedCirclePaths(options) {
    const first = createCirclePath(options);
    const second = createCirclePath({
      ...options,
      startAngle: (options?.startAngle ?? 0) + Math.PI,
    });
    return [first, second];
  }

  class DualCubeSession {
    constructor({
      connector,
      mat = SIMPLE_TILE_MAT,
      maxCubes = 2,
      frameRate = 15,
      colors = ["#007f8b", "#d1495b"],
    } = {}) {
      requirePositiveInteger(maxCubes, "maxCubes");
      requireFinite(frameRate, "frameRate");

      if (maxCubes !== 2) {
        throw new RangeError("DualCubeSession supports exactly two cubes");
      }

      if (!(mat instanceof MatGrid)) {
        throw new TypeError("mat must be a MatGrid");
      }

      this.connector = connector;
      this.mat = mat;
      this.maxCubes = maxCubes;
      this.frameRate = frameRate;
      this.colors = colors;
      this.cubes = [];
    }

    static isWebBluetoothAvailable() {
      return Boolean(globalThis.navigator?.bluetooth);
    }

    get count() {
      return this.cubes.length;
    }

    get isFull() {
      return this.count >= this.maxCubes;
    }

    resolveConnector() {
      if (this.connector) {
        return this.connector;
      }

      if (typeof globalThis.P5tCube?.connectNewP5tCube === "function") {
        return () => globalThis.P5tCube.connectNewP5tCube();
      }

      throw new Error("p5.toio is not loaded and no connector was provided");
    }

    async connectOne() {
      if (this.isFull) {
        throw new RangeError("two cubes are already connected");
      }

      const cube = await this.resolveConnector()();

      if (!cube) {
        throw new Error("connector did not return a cube");
      }

      cube.setFrameRate?.(this.frameRate);
      cube.turnLightOn?.(this.colors[this.count] ?? "white");
      this.cubes.push(cube);
      return cube;
    }

    cube(index) {
      if (!Number.isInteger(index) || index < 0 || index >= this.count) {
        throw new RangeError(`cube ${index} is not connected`);
      }

      return this.cubes[index];
    }

    snapshots(mat = this.mat) {
      return this.cubes.map((cube, index) => {
        const hasPosition = Number.isFinite(cube.x) && Number.isFinite(cube.y);
        const position = hasPosition ? { x: cube.x, y: cube.y } : undefined;

        return {
          index,
          cube,
          x: cube.x,
          y: cube.y,
          angle: cube.angle,
          batteryLevel: cube.batteryLevel,
          hasPosition,
          onMat: hasPosition && mat.contains(position, false),
          cell: hasPosition ? mat.cellAt(position) : undefined,
        };
      });
    }

    distanceBetweenCubes() {
      if (this.count !== 2) {
        return undefined;
      }

      const [first, second] = this.cubes;
      if (![first.x, first.y, second.x, second.y].every(Number.isFinite)) {
        return undefined;
      }

      return distance(first, second);
    }

    moveTo(index, target, speed = 60) {
      const cube = this.cube(index);
      const safeTarget = this.mat.clamp(target);
      return cube.moveTo(safeTarget, speed);
    }

    moveBoth(targets, speed = 60) {
      if (!Array.isArray(targets) || targets.length !== 2) {
        throw new TypeError("targets must contain exactly two positions");
      }

      return targets.map((target, index) => this.moveTo(index, target, speed));
    }

    stopAll() {
      for (const cube of this.cubes) {
        cube.stop?.();
      }
    }

    disconnectAll() {
      this.stopAll();
      for (const cube of this.cubes) {
        cube.disconnect?.();
      }
      this.cubes.length = 0;
    }
  }

  return Object.freeze({
    DualCubeSession,
    MatGrid,
    SIMPLE_TILE_MAT,
    createCirclePath,
    createOpposedCirclePaths,
    distance,
    normalizeAngle,
  });
});