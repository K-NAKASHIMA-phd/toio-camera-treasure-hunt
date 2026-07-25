function overlaps(first, second, padding = 0) {
  return !(
    first.x + first.width + padding < second.x ||
    second.x + second.width + padding < first.x ||
    first.y + first.height + padding < second.y ||
    second.y + second.height + padding < first.y
  );
}

export function pointInsideWall(point, wall, padding = 0) {
  return (
    point.x >= wall.x - padding &&
    point.x <= wall.x + wall.width + padding &&
    point.y >= wall.y - padding &&
    point.y <= wall.y + wall.height + padding
  );
}

export function segmentHitsWall(start, end, wall, padding = 0) {
  const expanded = {
    x: wall.x - padding,
    y: wall.y - padding,
    width: wall.width + padding * 2,
    height: wall.height + padding * 2,
  };
  let minimum = 0;
  let maximum = 1;

  for (const [origin, delta, low, high] of [
    [start.x, end.x - start.x, expanded.x, expanded.x + expanded.width],
    [start.y, end.y - start.y, expanded.y, expanded.y + expanded.height],
  ]) {
    if (Math.abs(delta) < 1e-9) {
      if (origin < low || origin > high) return false;
      continue;
    }

    const first = (low - origin) / delta;
    const second = (high - origin) / delta;
    minimum = Math.max(minimum, Math.min(first, second));
    maximum = Math.min(maximum, Math.max(first, second));
    if (minimum > maximum) return false;
  }

  return true;
}

export function pathExists({ bounds, start, target, walls, cellSize = 18, padding = 18 }) {
  const columns = Math.max(2, Math.floor((bounds.maxX - bounds.minX) / cellSize) + 1);
  const rows = Math.max(2, Math.floor((bounds.maxY - bounds.minY) / cellSize) + 1);
  const toCell = (point) => ({
    column: Math.max(0, Math.min(columns - 1, Math.round((point.x - bounds.minX) / cellSize))),
    row: Math.max(0, Math.min(rows - 1, Math.round((point.y - bounds.minY) / cellSize))),
  });
  const toPoint = ({ column, row }) => ({
    x: Math.min(bounds.maxX, bounds.minX + column * cellSize),
    y: Math.min(bounds.maxY, bounds.minY + row * cellSize),
  });
  const startCell = toCell(start);
  const targetCell = toCell(target);
  const key = ({ column, row }) => `${column}:${row}`;
  const queue = [startCell];
  const visited = new Set([key(startCell)]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.column === targetCell.column && current.row === targetCell.row) return true;

    for (const [columnOffset, rowOffset] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { column: current.column + columnOffset, row: current.row + rowOffset };
      if (next.column < 0 || next.column >= columns || next.row < 0 || next.row >= rows) continue;
      if (visited.has(key(next))) continue;
      if (walls.some((wall) => pointInsideWall(toPoint(next), wall, padding))) continue;
      visited.add(key(next));
      queue.push(next);
    }
  }

  return false;
}

export function generateWalls({
  bounds,
  start,
  target,
  random = Math.random,
  minimum = 1,
  maximum = 3,
  clearance = 34,
} = {}) {
  const desired = minimum + Math.floor(random() * (maximum - minimum + 1));
  const walls = [];

  for (let attempt = 0; attempt < 120 && walls.length < desired; attempt += 1) {
    const horizontal = random() >= 0.5;
    const length = 55 + random() * 55;
    const thickness = 10 + random() * 6;
    const width = horizontal ? length : thickness;
    const height = horizontal ? thickness : length;
    const candidate = {
      id: `wall-${walls.length + 1}`,
      x: bounds.minX + random() * Math.max(1, bounds.maxX - bounds.minX - width),
      y: bounds.minY + random() * Math.max(1, bounds.maxY - bounds.minY - height),
      width,
      height,
      revealed: false,
    };

    if (pointInsideWall(start, candidate, clearance) || pointInsideWall(target, candidate, clearance)) continue;
    if (walls.some((wall) => overlaps(candidate, wall, 18))) continue;
    if (!pathExists({ bounds, start, target, walls: [...walls, candidate] })) continue;
    walls.push(candidate);
  }

  return walls;
}

export function firstWallCollision(start, end, walls, padding = 20) {
  return walls.find((wall) => segmentHitsWall(start, end, wall, padding));
}