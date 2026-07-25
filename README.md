# SIGNAL//SEEK

内蔵Webカメラで検出した手の上下左右をマット上の絶対方向へ変換し、toioコアキューブ1台を操作する60秒の対戦探索ゲームです。プレイヤーは画面上の自動操縦NPCと共有ターゲットを競います。見えないターゲットへ近づくほどLEDと探査音が変わり、仮想壁は衝突した時に初めて画面へ現れます。

公開URL: https://k-nakashima-phd.github.io/toio-camera-treasure-hunt/

## ゲーム仕様

- ターゲットは探索中は非表示、到達時だけ約600ms表示
- プレイヤーと弱めの自動操縦NPCが同じターゲットを探索し、先着した側が1点
- NPCは低速で、推定位置の誤差、判断待ち、迷走を含む
- LEDは近い順に赤、黄、緑、シアン、青
- 緑、黄、赤では近いほど周期が短い探査音を再生
- 距離帯を近づく方向へ跨ぐと上昇音、遠ざかると下降音
- 得点時は白色LEDと得点音、その後ターゲットと壁を再配置
- 仮想壁は必ず迂回可能な配置とし、衝突時に壁全体を開示
- 制限時間は60秒。終了時にスコアを比較して勝敗を表示

## 対応環境

実機モードはWeb Bluetoothに対応する最新版のGoogle ChromeまたはMicrosoft Edgeを使用してください。カメラとWeb Bluetoothのため、公開環境ではHTTPSが必要です。iOS/iPadOSの通常ブラウザとFirefoxは実機モードの対象外です。

必要な機材:

- toioコアキューブ TPH-1000C 1台
- TPH-1000C付属の簡易プレイマット
- BluetoothとWebカメラを搭載したPC

公開URLは実機なしでもシミュレーションモードで動作します。

## 操作

1. `カメラ開始`を押してカメラを許可します。
2. 手をカメラ中央に置き、`中央を校正`を押します。
3. 実機では`toioに接続`を押して対象キューブを選びます。
4. `探索を開始`を押します。
5. 手を上下左右へ動かしてマット上の対応方向へ進みます。

方向パッドまたは矢印キーでも操作できます。画面の赤い停止ボタン、Space、Escapeは緊急停止です。緊急停止後は自動再発進せず、`探索を開始`で新しいゲームを開始します。

## ローカル開発

Node.js 18以上が必要です。

```powershell
npm install
npm run dev
```

表示されたlocalhostのURLをChromeまたはEdgeで開きます。Web Bluetoothのデバイス選択は必ずボタン操作から開始する必要があります。

## 検証

```powershell
npm test
npm run check
npm run build
npm run test:e2e
```

単体テストは距離帯、得点、時間終了、壁の到達可能性、衝突余裕、絶対方向制御、手入力判定を検証します。Playwrightはシミュレーションの移動、緊急停止ラッチ、キャンバス描画、モバイル表示を検証します。

Web Bluetooth、Position ID、LED、内蔵音、カメラ推論の実機動作はWindows版Chrome/Edgeと実機で確認してください。

チームメイトによる実機検証は[実機テスト引継ぎ資料](docs/REAL_DEVICE_TEST_HANDOFF.md)に従ってください。合否基準、停止条件、証跡、結果記入欄をまとめています。

## 公開

`main`へpushすると[Pages workflow](.github/workflows/pages.yml)がテストとビルドを実行し、GitHub Pagesへ配置します。リポジトリのSettings > Pages > Build and deploymentでSourceを`GitHub Actions`に設定してください。

## 構成

- `src/game`: ゲーム状態、ターゲット、仮想壁
- `src/control`: マット絶対方向から左右車輪への変換
- `src/input`: MediaPipe Hand Landmarkerと方向判定
- `src/hardware`: p5.toio実機アダプターとシミュレーター
- `src/ui`: p5.jsによるマップ描画
- `lib`: 先行調査で作成されたマット座標補助ライブラリ

第三者ソフトウェアとモデルの情報は[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)を参照してください。