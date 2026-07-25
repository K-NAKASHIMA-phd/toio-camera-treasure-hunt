# SIGNAL//SEEK 実機テスト引継ぎ資料

## 1. 目的

カメラ、Web Bluetooth、toioコアキューブ、簡易プレイマットを使う実機経路を、カメラが利用可能なチームメイトのPCで確認するための手順です。

実装済みの自動検証では、ゲームロジック20件とブラウザE2E 3件が成功しています。実機でしか確認できない項目は、カメラ推論の操作感、Position ID、車輪方向、LED、内蔵音、BLE切断時の停止です。

公開URL:

https://k-nakashima-phd.github.io/toio-camera-treasure-hunt/

公開リポジトリ:

https://github.com/K-NAKASHIMA-phd/toio-camera-treasure-hunt

## 2. 準備

### 機材

- Windows PC 1台。内蔵またはUSB WebカメラとBluetoothが動作すること
- 最新版Google ChromeまたはMicrosoft Edge
- toioコアキューブ TPH-1000C 1台。十分に充電すること
- TPH-1000C付属の簡易プレイマット
- キューブがマット外へ落ちない広さの平らな机
- 動画撮影用のスマートフォン。画面とtoioを同時に写せると望ましい

### 配置

1. マットを机へ平らに固定します。反り、段差、強い反射を避けます。
2. toioをマット中央付近へ置き、進行方向に十分な余裕を取ります。
3. カメラに上半身と片手が映り、手を上下左右へ15cm程度動かせる位置にPCを置きます。
4. 他のカメラアプリ、toio接続アプリ、Bluetoothを占有し得るアプリを終了します。

## 3. 安全上の注意

- 最初はtoioへ手を添えられる状態で、低い机または床上で確認してください。
- 想定外の動きをしたら、画面右下の赤い停止ボタン、`Space`、`Escape`のいずれかを直ちに使用します。
- マット端へ向かって停止しない場合は、その時点で実機テストを中断してください。
- ページを閉じる操作だけを停止手段にしないでください。
- 緊急停止後は自動再発進しません。再開には`探索を開始`が必要です。

## 4. 推奨テスト順序

### A. 公開ページとシミュレーション

| ID | 操作 | 期待結果 | 証跡 |
| --- | --- | --- | --- |
| PUB-01 | Chromeのシークレットウィンドウで公開URLを開く | GitHubへのログインなしで画面が開き、HTTPSの鍵表示がある | URLを含むスクリーンショット |
| SIM-01 | `探索を開始`を押し、矢印キー4方向を順に押す | 仮想toioがマップ絶対方向へ移動し、残り時間が減る | 画面録画 |
| SIM-02 | 赤い停止ボタンを押した後、矢印キーを押す | 仮想toioが再発進しない | 画面録画 |
| SIM-03 | 壁へ向かって移動する | 衝突直前に停止し、黒と赤の壁および衝突点が現れる | スクリーンショット |
| NPC-01 | `探索を開始`後、橙色のRIVALを観察する | 右上付近から低速かつ不正確に探索を開始する | 画面録画 |
| NPC-02 | NPCを操作せずに待つ | NPCが共有ターゲットへ先着するとRIVALスコアが1増える | 画面録画 |
| NPC-03 | プレイヤーが先着する | YOUスコアだけが1増え、同じターゲットで二重得点しない | 画面録画 |

PUB-01が失敗する場合は実機テストへ進まず、URLとHTTPステータスを記録してください。

### B. カメラと手入力

| ID | 操作 | 期待結果 | 証跡 |
| --- | --- | --- | --- |
| CAM-01 | `カメラ開始`を押し、ブラウザで許可する | カメラ映像が鏡像表示され、エラー表示がない | スクリーンショット |
| CAM-02 | 手を中央枠へ置く | `中央を校正`が押せるようになる | スクリーンショット |
| CAM-03 | `中央を校正`後、手を上、下、左、右へ動かす | 表示がそれぞれ`UP`、`DOWN`、`LEFT`、`RIGHT`になる | 4方向を含む動画 |
| CAM-04 | 手を中央へ戻し、次に画面外へ出す | 表示が`NEUTRAL`へ戻る | 動画 |

合格基準は、通常の照明下で意図した4方向が各3回中3回認識され、中央または手の消失時に1秒以内で`NEUTRAL`へ戻ることです。

### C. toio接続と位置

| ID | 操作 | 期待結果 | 証跡 |
| --- | --- | --- | --- |
| BLE-01 | toioの電源を入れ、`toioに接続`から対象を選ぶ | 表示が`PHYSICAL CUBE`と`toio接続済み`になる | スクリーンショット |
| POS-01 | toioをマット中央と四隅寄りへ手で移動する | 画面上のキューブとX/Yが同じ方向へ追従する | 5地点を含む動画 |
| POS-02 | toioをマットから持ち上げる | `POSITION LOST`となり、モーターが停止する | 動画 |
| POS-03 | マットへ戻す | 座標表示が復帰する | 動画 |

## 5. 最重要: 方向と停止の確認

実機の角度正方向と左右車輪の符号は環境・ライブラリ版を含めて最初に確認します。以下は必ず1方向ずつ実施してください。

| ID | 操作 | 期待結果 |
| --- | --- | --- |
| MOT-01 | toioを中央へ置き、開始後に手を右へ短時間動かす | 必要ならその場旋回した後、マット右方向へ進む |
| MOT-02 | 手を下へ短時間動かす | マット下方向へ進む |
| MOT-03 | 手を左へ短時間動かす | マット左方向へ進む |
| MOT-04 | 手を上へ短時間動かす | マット上方向へ進む |
| SAFE-01 | 移動中に手を中央へ戻す | 約0.3秒以内に停止する |
| SAFE-02 | 移動中に手をカメラ外へ出す | 約1秒以内に停止する |
| SAFE-03 | 移動中に赤い停止ボタンを押す | 直ちに停止し、その後手を動かしても再発進しない |
| SAFE-04 | 再度`探索を開始`を押す | 新しい60秒ゲームとして再開できる |
| SAFE-05 | マット端へ向けて操作する | 安全領域内で停止し、`FIELD EDGE`が表示される |
| SAFE-06 | 動作中にtoioの接続を切る、または電源を切る | 暴走せず停止し、再接続が必要になる |

### 方向が逆の場合

テストを中断し、次を記録してください。推測でコードを直さないでください。

- 操作した方向
- 実際に進んだ方向
- 操作開始時の画面上の角度`A`
- 旋回が時計回りか反時計回りか
- Chrome/Edge、OS、p5.toio読込成否
- 動画ファイル名

この情報があれば`src/control/absolute-motion-controller.mjs`の方位または車輪符号を局所修正できます。

## 6. LED、音、得点、壁

| ID | 確認内容 | 期待結果 |
| --- | --- | --- |
| LED-01 | ターゲットから遠い状態 | toio底面LEDと画面のSIGNALが青 |
| LED-02 | ターゲットへ近づく | 青、シアン、緑、黄、赤の順に変わる |
| SND-01 | 青またはシアン | 周期音なし |
| SND-02 | 緑、黄、赤 | 近いほど周期音が速い |
| SND-03 | 距離帯を近づく方向へ跨ぐ | 上昇音が1回鳴る |
| SND-04 | 距離帯を遠ざかる方向へ跨ぐ | 下降音が1回鳴る |
| SCORE-01 | 赤のさらに内側へ到達する | スコアが1増え、LEDが白、得点音、ターゲットが約0.6秒だけ表示される |
| SCORE-02 | 得点演出後 | ターゲットと壁が再配置され、ターゲットは再び非表示になる |
| WALL-01 | 非表示の壁へ進む | 衝突前に停止し、当たった壁だけが表示される |
| WALL-02 | 表示された壁の端を回る | 壁を迂回して探索を継続できる |

底面LEDは見えにくいため、動画では画面右上のSIGNAL色も同時に写してください。LED色の厳密な発色差より、5段階の順序と得点時の白を合否基準にします。

## 7. 60秒通しテスト

1. カメラとtoioを接続します。
2. 手の中央を校正します。
3. 動画撮影を開始します。
4. `探索を開始`から60秒間プレイします。
5. 最低1回の壁発見と、プレイヤーまたはNPCによる1回の得点を確認します。
6. 0秒でtoioとNPCが停止し、`YOU WIN`、`RIVAL WINS`、`DRAW`のいずれかが表示されることを確認します。
7. `再スタート`でスコア0、残り60秒へ戻ることを確認します。

通しテスト中に、ブラウザコンソールへ赤いエラーが出ていないことも確認してください。

## 8. 障害切り分け

| 症状 | 最初に確認すること |
| --- | --- |
| カメラ許可が出ない | HTTPS URLか、サイト設定でカメラが拒否されていないか、他アプリが占有していないか |
| 手が認識されない | 手全体が映るか、逆光でないか、モデル読込中表示が終わったか |
| toio候補が出ない | Chrome/Edgeか、PCのBluetoothが有効か、他アプリへ接続中でないか |
| 接続したが座標がない | 簡易プレイマット上か、マットの印刷面とキューブ底面が汚れていないか |
| toioが逆方向へ進む | MOT-01からMOT-04を中断し、「方向が逆の場合」の情報を記録する |
| LEDまたは音だけ出ない | p5.toio 0.8.0の読込エラー、toioのバッテリー、ブラウザコンソールを確認する |
| 公開ページだけ失敗する | CDNのp5.js/p5.toio、MediaPipe WASM・モデルURLへの社内ネットワーク制限を確認する |
| BLEが切れる | toioとの距離、バッテリー、周辺BLE機器、USB Bluetoothアダプターを確認する |

## 9. 結果記録

以下を埋めてチームへ共有してください。

```text
実施日時:
実施者:
PC機種:
OSとバージョン:
ブラウザとバージョン:
内蔵/USBカメラ:
toio識別名:
toioバッテリー表示:
公開URL / localhost:

PUB-01: PASS / FAIL / BLOCKED
SIM-01: PASS / FAIL / BLOCKED
SIM-02: PASS / FAIL / BLOCKED
SIM-03: PASS / FAIL / BLOCKED
NPC-01: PASS / FAIL / BLOCKED
NPC-02: PASS / FAIL / BLOCKED
NPC-03: PASS / FAIL / BLOCKED
CAM-01: PASS / FAIL / BLOCKED
CAM-02: PASS / FAIL / BLOCKED
CAM-03: PASS / FAIL / BLOCKED
CAM-04: PASS / FAIL / BLOCKED
BLE-01: PASS / FAIL / BLOCKED
POS-01: PASS / FAIL / BLOCKED
POS-02: PASS / FAIL / BLOCKED
POS-03: PASS / FAIL / BLOCKED
MOT-01: PASS / FAIL / BLOCKED
MOT-02: PASS / FAIL / BLOCKED
MOT-03: PASS / FAIL / BLOCKED
MOT-04: PASS / FAIL / BLOCKED
SAFE-01: PASS / FAIL / BLOCKED
SAFE-02: PASS / FAIL / BLOCKED
SAFE-03: PASS / FAIL / BLOCKED
SAFE-04: PASS / FAIL / BLOCKED
SAFE-05: PASS / FAIL / BLOCKED
SAFE-06: PASS / FAIL / BLOCKED
LED-01: PASS / FAIL / BLOCKED
LED-02: PASS / FAIL / BLOCKED
SND-01: PASS / FAIL / BLOCKED
SND-02: PASS / FAIL / BLOCKED
SND-03: PASS / FAIL / BLOCKED
SND-04: PASS / FAIL / BLOCKED
SCORE-01: PASS / FAIL / BLOCKED
SCORE-02: PASS / FAIL / BLOCKED
WALL-01: PASS / FAIL / BLOCKED
WALL-02: PASS / FAIL / BLOCKED
60秒通しテスト: PASS / FAIL / BLOCKED

最終スコア:
発見した壁の数:
発生したエラー:
ブラウザコンソールログ:
スクリーンショット/動画の保存場所:
再現手順:
補足:
```

## 10. ローカルでの再検証

公開URLで問題がある場合は、同期済みフォルダの`ai_hackerthon`で次を実行します。

```powershell
npm install
npm test
npm run check
npm run build
npm run dev
```

表示されたlocalhost URLをChromeまたはEdgeで開きます。自動ブラウザ検証を再実行する場合は、初回のみ`npx playwright install chromium`を実行した後、`npm run test:e2e`を使用します。