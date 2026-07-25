# Third-Party Notices

本プロジェクトは次の第三者ソフトウェアおよびモデルを利用します。各成果物にはリンク先のライセンス条件が適用されます。

| Component | Version | License | Source |
| --- | --- | --- | --- |
| p5.js | 1.11.11 | LGPL-2.1 | https://github.com/processing/p5.js |
| p5.toio | 0.8.0 beta | MIT | https://github.com/tetunori/p5.toio |
| MediaPipe Tasks Vision | 0.10.35 | Apache-2.0 | https://www.npmjs.com/package/@mediapipe/tasks-vision |
| MediaPipe Hand Landmarker model | float16/1 | Apache-2.0 | https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker |
| Vite | 6.4.3 | MIT | https://github.com/vitejs/vite |
| Playwright | 1.55.1 | Apache-2.0 | https://github.com/microsoft/playwright |

p5.jsとp5.toioは実行時に固定バージョンのHTTPS URLから読み込みます。MediaPipe Tasks Visionはビルド成果物へ含まれ、WASMランタイムとHand Landmarkerモデルは固定バージョンの公式配布先から読み込みます。