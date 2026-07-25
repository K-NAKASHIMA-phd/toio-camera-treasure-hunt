export interface Point {
  x: number;
  y: number;
  angle?: number;
  [key: string]: unknown;
}

export interface Rect {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

export interface Cell {
  row: number;
  column: number;
}

export interface MatGridOptions {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  rows?: number;
  columns?: number;
  safetyMargin?: number;
}

export class MatGrid {
  constructor(options: MatGridOptions);
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
  readonly rows: number;
  readonly columns: number;
  readonly safetyMargin: number;
  readonly width: number;
  readonly height: number;
  readonly center: Point;
  readonly safeBounds: { minX: number; minY: number; maxX: number; maxY: number };
  contains(point: Point, includeSafetyMargin?: boolean): boolean;
  clamp<T extends Point>(point: T, includeSafetyMargin?: boolean): T;
  toCanvas(point: Point, rect: Rect): Point;
  toMat(point: Point, rect: Rect, clampToSafeArea?: boolean): Point;
  cellAt(point: Point): Cell | undefined;
  cellCenter(row: number, column: number): Point;
  requireCell(row: number, column: number): void;
}

export interface CirclePathOptions {
  mat?: MatGrid;
  center?: Point;
  radius: number;
  segments?: number;
  startAngle?: number;
  clockwise?: boolean;
  tangentAngle?: boolean;
}

export interface P5ToioCubeLike {
  x?: number;
  y?: number;
  angle?: number;
  batteryLevel?: number;
  setFrameRate?(frameRate: number): void;
  turnLightOn?(color: string): void;
  moveTo?(target: Point, speed: number): unknown;
  stop?(): unknown;
  disconnect?(): void;
  addEventListener?(type: string, listener: (...args: unknown[]) => void): void;
}

export interface CubeSnapshot {
  index: number;
  cube: P5ToioCubeLike;
  x?: number;
  y?: number;
  angle?: number;
  batteryLevel?: number;
  hasPosition: boolean;
  onMat: boolean;
  cell?: Cell;
}

export interface DualCubeSessionOptions {
  connector?: () => Promise<P5ToioCubeLike>;
  mat?: MatGrid;
  maxCubes?: 2;
  frameRate?: number;
  colors?: string[];
}

export class DualCubeSession {
  constructor(options?: DualCubeSessionOptions);
  static isWebBluetoothAvailable(): boolean;
  readonly connector?: () => Promise<P5ToioCubeLike>;
  readonly mat: MatGrid;
  readonly maxCubes: 2;
  readonly frameRate: number;
  readonly colors: string[];
  readonly cubes: P5ToioCubeLike[];
  readonly count: number;
  readonly isFull: boolean;
  connectOne(): Promise<P5ToioCubeLike>;
  cube(index: number): P5ToioCubeLike;
  snapshots(mat?: MatGrid): CubeSnapshot[];
  distanceBetweenCubes(): number | undefined;
  moveTo(index: number, target: Point, speed?: number): unknown;
  moveBoth(targets: [Point, Point], speed?: number): unknown[];
  stopAll(): void;
  disconnectAll(): void;
}

export const SIMPLE_TILE_MAT: MatGrid;

export function createCirclePath(options: CirclePathOptions): Point[];
export function createOpposedCirclePaths(options: CirclePathOptions): [Point[], Point[]];
export function distance(first: Point, second: Point): number;
export function normalizeAngle(angle: number): number;