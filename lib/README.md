# toio Radical UI Kit

`p5.toio`を使う作品の設計前に共通化できる、薄いブラウザー向け補助ライブラリです。作品内容や画面構成は持たず、次だけを担当します。

- TPH-1000C付属の簡易プレイマットと画面の座標変換
- 7列 x 5行の方眼セル判定とセル中心の取得
- マット端から安全余白を取った目標座標の補正
- Web Bluetoothによるキューブ2台の接続・停止・切断
- 2台の位置スナップショットと相互距離
- 円軌道、および円周上で対向する2台分の軌道生成

## 前提

- ChromeまたはEdgeなどWeb Bluetooth対応ブラウザー
- p5.js
- [`p5.toio`](https://github.com/tetunori/p5.toio)
- TPH-1000C x 2
- TPH-1000C付属の簡易プレイマット

提供された指定スケッチは`p5.toio` 0.5.0を使用しています。本ライブラリは、そのスケッチが利用する`P5tCube`の基本APIだけに依存します。

`p5.toio`のREADME上の公開最新版は0.8.0です。ハッカソン開始時は、まず指定スケッチと同じ0.5.0で実機確認し、0.8.0へ変更する場合は接続・位置・移動・停止を再テストしてください。

## 読み込み

指定スケッチの`index.html`で、`p5.toio`の後に追加します。

```html
<script src="https://cdn.jsdelivr.net/npm/p5@1.11.11/lib/p5.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5@1.11.11/lib/addons/p5.sound.min.js"></script>
<script src="https://tetunori.github.io/p5.toio/dist/0.5.0/p5.toio.min.js"></script>
<script src="lib/toio-radical-ui.js"></script>
```

p5.js Web Editorで使う場合は、[toio-radical-ui.js](toio-radical-ui.js)の内容をプロジェクトへ追加し、そのファイルを読み込みます。

## 最小セットアップ

Web Bluetoothのデバイス選択は、ブラウザーの制約によりクリックなどのユーザー操作から呼ぶ必要があります。

```javascript
const { DualCubeSession, SIMPLE_TILE_MAT } = ToioRadicalUI;
const session = new DualCubeSession({ mat: SIMPLE_TILE_MAT });

async function connectNextCube() {
  if (!session.isFull) {
    await session.connectOne();
  }
}
```

ボタンへ接続する例:

```javascript
function setup() {
  createCanvas(800, 600);
  const connectButton = createButton("toioを接続");
  connectButton.mousePressed(connectNextCube);
}
```

## 座標変換

```javascript
const canvasMat = { x: 80, y: 70, width: 608, height: 432 };

function draw() {
  for (const state of session.snapshots()) {
    if (!state.hasPosition) continue;

    const screen = SIMPLE_TILE_MAT.toCanvas(state, canvasMat);
    circle(screen.x, screen.y, 20);
  }
}
```

クリック位置をマット座標へ変換し、安全余白内へ補正する例:

```javascript
function mousePressed() {
  if (session.count === 0) return;

  const target = SIMPLE_TILE_MAT.toMat(
    { x: mouseX, y: mouseY },
    canvasMat,
    true,
  );
  session.moveTo(0, target, 60);
}
```

## 方眼セル

```javascript
const cell = SIMPLE_TILE_MAT.cellAt({ x: cube.x, y: cube.y });
const target = SIMPLE_TILE_MAT.cellCenter(2, 3);
session.moveTo(0, target, 50);
```

行・列はどちらも0始まりです。標準定義では行が`0..4`、列が`0..6`です。

## 円の幾何

1台分の円軌道:

```javascript
const path = ToioRadicalUI.createCirclePath({
  radius: 70,
  segments: 20,
  clockwise: true,
});
```

円周上で常に反対側から始まる2台分の軌道:

```javascript
const [pathA, pathB] = ToioRadicalUI.createOpposedCirclePaths({
  radius: 70,
  segments: 20,
});
```

生成するのは座標列だけです。実行間隔、同期方法、円が作品内で意味するものは設計側で決めます。`draw()`から毎フレーム`moveTo()`を送らず、到達判定やタイマーで命令頻度を制御してください。

## マッピング用紙が標準と異なる場合

配布された紙がTPH-1000C付属の簡易プレイマットと異なる場合、四隅付近で実測した座標から`MatGrid`を作ります。

```javascript
const mappedPaper = new ToioRadicalUI.MatGrid({
  minX: 100,
  minY: 140,
  maxX: 400,
  maxY: 360,
  rows: 5,
  columns: 7,
  safetyMargin: 16,
});

const session = new ToioRadicalUI.DualCubeSession({ mat: mappedPaper });
```

紙の見た目の線ではなく、キューブが実際に通知するX/Y座標を使って設定します。四隅ぎりぎりは読み取り外れや落下の原因になるため、安全余白を残します。

## 緊急停止

```javascript
function keyPressed() {
  if (key === " ") {
    session.stopAll();
    return false;
  }
}

window.addEventListener("beforeunload", () => session.stopAll());
```

ページを閉じるときの停止は保証されないため、画面上にも停止ボタンを用意してください。

## API一覧

### `MatGrid`

- `contains(point, includeSafetyMargin)`
- `clamp(point, includeSafetyMargin)`
- `toCanvas(point, rect)`
- `toMat(point, rect, clampToSafeArea)`
- `cellAt(point)`
- `cellCenter(row, column)`

### `DualCubeSession`

- `connectOne()`
- `cube(index)`
- `snapshots()`
- `distanceBetweenCubes()`
- `moveTo(index, target, speed)`
- `moveBoth(targets, speed)`
- `stopAll()`
- `disconnectAll()`

### 幾何関数

- `createCirclePath(options)`
- `createOpposedCirclePaths(options)`
- `distance(first, second)`
- `normalizeAngle(angle)`

## 検証

外部パッケージは不要です。

```powershell
npm test
npm run check
```

Node.jsテストは座標変換、境界セル、安全余白、円軌道、2台接続上限、停止・切断を検証します。Web Bluetoothと実機動作はChrome/Edgeと配布機で別途確認が必要です。