const DIRECTION_ANGLES = Object.freeze({
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
});

export function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function wheelCommandForDirection(direction, angle, {
  driveSpeed = 42,
  turnSpeed = 34,
  turnThreshold = Math.PI / 7,
  correctionGain = 24,
  duration = 140,
} = {}) {
  if (direction === "neutral" || !(direction in DIRECTION_ANGLES) || !Number.isFinite(angle)) {
    return { left: 0, right: 0, duration };
  }

  const error = normalizeAngle(DIRECTION_ANGLES[direction] - angle);
  if (Math.abs(error) > turnThreshold) {
    const signedSpeed = Math.sign(error) * turnSpeed;
    return { left: signedSpeed, right: -signedSpeed, duration };
  }

  const correction = Math.max(-driveSpeed / 2, Math.min(driveSpeed / 2, error * correctionGain));
  return {
    left: Math.round(driveSpeed + correction),
    right: Math.round(driveSpeed - correction),
    duration,
  };
}

export function projectedPoint(position, direction, distance = 26) {
  const angle = DIRECTION_ANGLES[direction];
  if (angle === undefined) return { ...position };
  return {
    x: position.x + Math.cos(angle) * distance,
    y: position.y + Math.sin(angle) * distance,
  };
}

export { DIRECTION_ANGLES };