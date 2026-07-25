export class DirectionClassifier {
  constructor({ enterThreshold = 0.105, exitThreshold = 0.07, axisBias = 1.15 } = {}) {
    this.enterThreshold = enterThreshold;
    this.exitThreshold = exitThreshold;
    this.axisBias = axisBias;
    this.origin = null;
    this.direction = "neutral";
  }

  calibrate(point) {
    this.origin = { x: point.x, y: point.y };
    this.direction = "neutral";
  }

  classify(point, confidence = 1) {
    if (!this.origin || !point || confidence < 0.6) {
      this.direction = "neutral";
      return this.direction;
    }

    const deltaX = point.x - this.origin.x;
    const deltaY = point.y - this.origin.y;
    const magnitude = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    const threshold = this.direction === "neutral" ? this.enterThreshold : this.exitThreshold;
    if (magnitude < threshold) {
      this.direction = "neutral";
      return this.direction;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY) * this.axisBias) {
      this.direction = deltaX < 0 ? "left" : "right";
    } else if (Math.abs(deltaY) > Math.abs(deltaX) * this.axisBias) {
      this.direction = deltaY < 0 ? "up" : "down";
    }

    return this.direction;
  }
}

export function palmCenter(landmarks) {
  const indices = [0, 5, 9, 13, 17];
  const points = indices.map((index) => landmarks?.[index]).filter(Boolean);
  if (points.length !== indices.length) return null;
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}