import { wheelCommandForDirection, projectedPoint } from "./control/absolute-motion-controller.mjs";
import { GameEngine } from "./game/game-engine.mjs";
import { RivalNpc } from "./game/rival-npc.mjs";
import { firstWallCollision, generateWalls } from "./game/walls.mjs";
import { SimulatedCube } from "./hardware/simulated-cube.mjs";
import { ToioController } from "./hardware/toio-controller.mjs";
import { HandController } from "./input/hand-controller.mjs";
import { createExplorerSketch } from "./ui/sketch.mjs";

const SAFE_BOUNDS = Object.freeze({ minX: 114, minY: 158, maxX: 386, maxY: 342 });
const elements = Object.fromEntries([
  "score", "rival-score", "time", "signal", "signal-swatch", "mode-chip", "field-message", "position-readout", "rival-readout",
  "camera", "camera-dot", "hand-direction", "camera-button", "calibrate-button", "cube-dot",
  "connect-button", "simulation-button", "connection-label", "battery-label", "start-button", "stop-button",
].map((id) => [id, document.getElementById(id)]));

class AudioFeedback {
  constructor() {
    this.context = null;
  }

  unlock() {
    this.context ??= new AudioContext();
    this.context.resume();
  }

  beep(frequency, duration = 0.08, volume = 0.045) {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
}

const audio = new AudioFeedback();
const hand = new HandController();
const rival = new RivalNpc({ bounds: SAFE_BOUNDS });
let controller = new SimulatedCube({ bounds: SAFE_BOUNDS });
let inputDirection = "neutral";
let pointerDirection = "neutral";
let keyboardDirection = "neutral";
let collisionPoint = null;
let lastFrameAt = performance.now();
let lastCommandAt = -Infinity;
let message = "SYSTEM READY";
let motionArmed = false;

function randomTarget({ position }) {
  const rivalPosition = rival.snapshot();
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const target = {
      x: SAFE_BOUNDS.minX + 24 + Math.random() * (SAFE_BOUNDS.maxX - SAFE_BOUNDS.minX - 48),
      y: SAFE_BOUNDS.minY + 24 + Math.random() * (SAFE_BOUNDS.maxY - SAFE_BOUNDS.minY - 48),
    };
    const farFromPlayer = !position || Math.hypot(target.x - position.x, target.y - position.y) >= 85;
    const farFromRival = Math.hypot(target.x - rivalPosition.x, target.y - rivalPosition.y) >= 60;
    if (farFromPlayer && farFromRival) return target;
  }
  return { x: SAFE_BOUNDS.maxX - 28, y: SAFE_BOUNDS.maxY - 28 };
}

const engine = new GameEngine({
  targetFactory: randomTarget,
  wallFactory: ({ position, target }) => generateWalls({
    bounds: SAFE_BOUNDS,
    start: position ?? { x: 250, y: 250 },
    target,
  }),
});

function setMessage(nextMessage) {
  message = nextMessage;
  elements["field-message"].textContent = message;
}

function stopMotion(nextMessage) {
  motionArmed = false;
  inputDirection = "neutral";
  controller.stop();
  if (nextMessage) setMessage(nextMessage);
}

function handleEvents(events) {
  for (const event of events) {
    if (event.type === "distance-band-changed") {
      controller.setLight(...event.band.color);
      if (event.direction > 0) {
        controller.playNote(74, 90);
        audio.beep(740);
      } else if (event.direction < 0) {
        controller.playNote(55, 110);
        audio.beep(330, 0.1);
      }
    }
    if (event.type === "proximity-pulse") {
      const notes = { green: [64, 520], yellow: [72, 660], red: [81, 880] };
      const [note, frequency] = notes[event.band.name];
      controller.playNote(note, 70);
      audio.beep(frequency, 0.055, 0.035);
    }
    if (event.type === "scored") {
      controller.stop();
      controller.setLight(255, 255, 255, 600);
      controller.playScore();
      audio.beep(1040, 0.18, 0.06);
      collisionPoint = null;
      setMessage("YOU CAPTURED THE SIGNAL");
    }
    if (event.type === "rival-scored") {
      controller.stop();
      controller.setLight(255, 90, 35, 600);
      controller.playNote(45, 180);
      audio.beep(185, 0.2, 0.06);
      collisionPoint = null;
      setMessage("RIVAL CAPTURED THE SIGNAL");
    }
    if (event.type === "round-started") {
      collisionPoint = null;
      setMessage("NEW SIGNAL DETECTED");
    }
    if (event.type === "game-finished") {
      const result = engine.score === engine.rivalScore
        ? "DRAW"
        : engine.score > engine.rivalScore ? "YOU WIN" : "RIVAL WINS";
      stopMotion(`EXPLORATION COMPLETE / ${result}`);
    }
  }
}

function resolveDirection(handState) {
  if (pointerDirection !== "neutral") return pointerDirection;
  if (keyboardDirection !== "neutral") return keyboardDirection;
  if (handState.active && handState.calibrated) return handState.direction;
  return "neutral";
}

function updateGame(now, deltaMs) {
  const handState = hand.update(now);
  elements["hand-direction"].textContent = handState.direction.toUpperCase();
  elements["camera-dot"].classList.toggle("active", handState.active);
  elements["calibrate-button"].disabled = !handState.center;
  inputDirection = resolveDirection(handState);

  controller.update?.(deltaMs, now);
  const snapshot = controller.snapshot();
  handleEvents(engine.tick(now));

  if (engine.phase === "running" && snapshot.hasPosition && motionArmed) {
    const nextPoint = projectedPoint(snapshot, inputDirection, 28);
    const outside = nextPoint.x < SAFE_BOUNDS.minX || nextPoint.x > SAFE_BOUNDS.maxX ||
      nextPoint.y < SAFE_BOUNDS.minY || nextPoint.y > SAFE_BOUNDS.maxY;
    const wall = inputDirection === "neutral"
      ? null
      : firstWallCollision(snapshot, nextPoint, engine.walls, 19);

    if (wall) {
      wall.revealed = true;
      collisionPoint = nextPoint;
      controller.stop();
      setMessage("VIRTUAL WALL FOUND");
    } else if (outside) {
      controller.stop();
      setMessage("FIELD EDGE");
    } else if (now - lastCommandAt >= 100) {
      const command = wheelCommandForDirection(inputDirection, snapshot.angle);
      controller.move(command.left, command.right, command.duration);
      lastCommandAt = now;
    }

    handleEvents(engine.updatePosition(snapshot, now));
  } else {
    controller.stop();
  }

  const rivalActive = engine.phase === "running" && snapshot.hasPosition && motionArmed;
  const rivalSnapshot = rival.update({
    now,
    deltaMs,
    target: engine.target,
    walls: engine.walls,
    active: rivalActive,
  });
  if (rivalActive) handleEvents(engine.updateRivalPosition(rivalSnapshot, now));

  return { snapshot, rivalSnapshot, handState };
}

function updateReadouts(now, snapshot, rivalSnapshot) {
  elements.score.textContent = String(engine.score).padStart(2, "0");
  elements["rival-score"].textContent = String(engine.rivalScore).padStart(2, "0");
  elements.time.textContent = (engine.remainingMs(now) / 1000).toFixed(1);
  elements.signal.textContent = engine.band?.name.toUpperCase() ?? "--";
  elements["signal-swatch"].style.backgroundColor = engine.band
    ? `rgb(${engine.band.color.join(",")})`
    : "transparent";
  elements["position-readout"].textContent = snapshot.hasPosition
    ? `X ${Math.round(snapshot.x)} / Y ${Math.round(snapshot.y)} / A ${Math.round((snapshot.angle ?? 0) * 180 / Math.PI)}`
    : "POSITION LOST";
  elements["rival-readout"].textContent = `RIVAL X ${Math.round(rivalSnapshot.x)} / Y ${Math.round(rivalSnapshot.y)}`;
  elements["battery-label"].textContent = Number.isFinite(snapshot.batteryLevel)
    ? `BAT ${snapshot.batteryLevel}%`
    : "BAT --";
}

const viewState = {
  cube: controller.snapshot(),
  rival: rival.snapshot(),
  walls: [],
  target: null,
  targetVisible: false,
  wallCount: 0,
  revealedCount: 0,
  collisionPoint: null,
};

createExplorerSketch(document.getElementById("canvas-host"), () => viewState);

function frame(now) {
  const deltaMs = now - lastFrameAt;
  lastFrameAt = now;
  const { snapshot, rivalSnapshot } = updateGame(now, deltaMs);
  Object.assign(viewState, {
    cube: snapshot,
    rival: rivalSnapshot,
    walls: engine.walls,
    target: engine.target,
    targetVisible: engine.targetVisible,
    wallCount: engine.walls.length,
    revealedCount: engine.walls.filter((wall) => wall.revealed).length,
    collisionPoint,
  });
  updateReadouts(now, snapshot, rivalSnapshot);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

elements["camera-button"].addEventListener("click", async () => {
  try {
    elements["camera-button"].disabled = true;
    setMessage("LOADING VISION MODEL");
    await hand.start(elements.camera);
    elements["camera-button"].textContent = "カメラ接続済み";
    setMessage("HAND DETECTED / CALIBRATE");
  } catch (error) {
    elements["camera-button"].disabled = false;
    setMessage(`CAMERA ERROR: ${error.message}`);
  }
});

elements["calibrate-button"].addEventListener("click", () => {
  try {
    hand.calibrate();
    setMessage("HAND CENTER CALIBRATED");
  } catch (error) {
    setMessage(error.message);
  }
});

elements["connect-button"].addEventListener("click", async () => {
  try {
    stopMotion("SELECT TOIO DEVICE");
    const realController = new ToioController();
    await realController.connect();
    controller.disconnect();
    controller = realController;
    elements["simulation-button"].classList.remove("selected");
    elements["mode-chip"].textContent = "PHYSICAL CUBE";
    elements["connection-label"].textContent = "toio接続済み";
    elements["cube-dot"].classList.add("active");
    setMessage("TOIO CONNECTED");
  } catch (error) {
    setMessage(`TOIO ERROR: ${error.message}`);
  }
});

elements["simulation-button"].addEventListener("click", () => {
  controller.disconnect();
  controller = new SimulatedCube({ bounds: SAFE_BOUNDS });
  elements["simulation-button"].classList.add("selected");
  elements["mode-chip"].textContent = "SIMULATION";
  elements["connection-label"].textContent = "仮想toio";
  elements["cube-dot"].classList.add("active");
  setMessage("SIMULATION READY");
});

elements["start-button"].addEventListener("click", () => {
  audio.unlock();
  const snapshot = controller.snapshot();
  if (!snapshot.hasPosition) {
    setMessage("PLACE TOIO ON MAT");
    return;
  }
  motionArmed = true;
  rival.reset();
  handleEvents(engine.start(performance.now(), snapshot));
  elements["start-button"].textContent = "再スタート";
});

elements["stop-button"].addEventListener("click", () => stopMotion("EMERGENCY STOP"));

for (const button of document.querySelectorAll("[data-direction]")) {
  const direction = button.dataset.direction;
  const press = (event) => {
    event.preventDefault();
    pointerDirection = direction;
    button.classList.add("pressed");
    if (direction === "neutral") stopMotion("MANUAL STOP");
  };
  const release = () => {
    pointerDirection = "neutral";
    button.classList.remove("pressed");
  };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
}

const keyDirections = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
window.addEventListener("keydown", (event) => {
  if (keyDirections[event.key]) {
    event.preventDefault();
    keyboardDirection = keyDirections[event.key];
  }
  if (event.key === " " || event.key === "Escape") {
    event.preventDefault();
    stopMotion("EMERGENCY STOP");
  }
});
window.addEventListener("keyup", (event) => {
  if (keyDirections[event.key] === keyboardDirection) keyboardDirection = "neutral";
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopMotion("PAUSED: WINDOW HIDDEN");
});
window.addEventListener("beforeunload", () => controller.stop());