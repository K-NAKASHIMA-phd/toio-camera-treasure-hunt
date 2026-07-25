import { DirectionClassifier, palmCenter } from "./direction-classifier.mjs";

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export class HandController {
  constructor({ inferenceIntervalMs = 60 } = {}) {
    this.inferenceIntervalMs = inferenceIntervalMs;
    this.classifier = new DirectionClassifier();
    this.landmarker = null;
    this.stream = null;
    this.video = null;
    this.lastInferenceAt = -Infinity;
    this.lastVideoTime = -1;
    this.center = null;
    this.landmarks = null;
    this.direction = "neutral";
    this.confidence = 0;
  }

  get active() {
    return Boolean(this.stream && this.landmarker);
  }

  get calibrated() {
    return Boolean(this.classifier.origin);
  }

  async start(video) {
    this.video = video;
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 24 } },
      audio: false,
    });
    video.srcObject = this.stream;
    await video.play();

    const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.55,
    });
  }

  calibrate() {
    if (!this.center) throw new Error("手をカメラ中央に映してください");
    this.classifier.calibrate(this.center);
    this.direction = "neutral";
  }

  update(now = performance.now()) {
    if (!this.active || this.video.readyState < 2) return this.snapshot();
    if (now - this.lastInferenceAt < this.inferenceIntervalMs) return this.snapshot();
    if (this.video.currentTime === this.lastVideoTime) return this.snapshot();

    this.lastInferenceAt = now;
    this.lastVideoTime = this.video.currentTime;
    const result = this.landmarker.detectForVideo(this.video, now);
    this.landmarks = result.landmarks?.[0] ?? null;
    this.center = palmCenter(this.landmarks);
    this.confidence = result.handedness?.[0]?.[0]?.score ?? (this.center ? 1 : 0);
    this.direction = this.center
      ? this.classifier.classify(this.center, this.confidence)
      : this.classifier.classify(null, 0);
    return this.snapshot();
  }

  snapshot() {
    return {
      active: this.active,
      calibrated: this.calibrated,
      center: this.center,
      landmarks: this.landmarks,
      confidence: this.confidence,
      direction: this.direction,
    };
  }

  stop() {
    for (const track of this.stream?.getTracks?.() ?? []) track.stop();
    this.landmarker?.close?.();
    this.stream = null;
    this.landmarker = null;
    this.direction = "neutral";
  }
}