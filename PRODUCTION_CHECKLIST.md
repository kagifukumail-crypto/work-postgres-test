# 本番デプロイ前チェックリスト

## 1. 認証情報の扱い

- リポジトリにコミットされていた DB パスワードは**ローテーション（変更）**することを強く推奨します（履歴に残っている可能性があります）。
- 本番の `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` は **Firebase Console → Functions → getData → 構成 → 環境変数**、または Google Cloud Console の Cloud Functions 環境変数で設定してください。
- `functions/.env` はデプロイ対象外（`firebase.json` の `ignore`）です。ローカル・エミュレータ用のみにしてください。

## 2. ネットワーク（最重要）

- PostgreSQL が **社内プライベート IP（例: 192.168.x.x）のみ**で公開されている場合、**インターネット上の Cloud Functions からは直接接続できません**。
- 対応例:
  - **Cloud SQL** 等クラウド上の DB に移行し、承認済みネットワークまたはプライベート IP + VPC 接続。
  - **Serverless VPC Access** + **VPC コネクタ** + **VPN / Cloud VPN / ハイブリッド接続**でオンプレ DB に到達させる。
  - 検証用のみ: **Cloudflare Tunnel / ngrok** 等で TCP を安全に中継（運用ポリシーに合わせて選定）。

接続できない場合は Functions のログに「データベースエラー」や接続タイムアウトが出ます。

## 3. セキュリティ上の注意（現在の構成）

- `getData` は **認証なしの HTTPS** で、クエリパラメータから DB にアクセスできる状態です。**関数 URL を知っている人は誰でも呼び出せます**。
- 本番で要件が許せば次を検討してください:
  - Firebase Authentication と Callable Functions、またはバックエンドでのセッション検証。
  - Cloud Armor、レート制限、許可 IP の制限（固定エグレスが必要な場合あり）。
  - SQL プレビュー系は特に権限・データ露出リスクが高いです。

## 4. デプロイ手順（例）

```bash
cd functions && npm install && cd ..
firebase login
firebase use work-postgres-test   # .firebaserc のプロジェクト
firebase deploy --only functions,hosting
```

デプロイ後、Hosting の URL（例: `https://<project>.web.app`）からアプリを開くと、`BASE_URL` は自動的に同一オリジンの `/getData` を指します。

## 5. ローカルエミュレータ

- `functions/.env.example` を `functions/.env` にコピーし、値を埋めてください。
- `npx firebase-tools emulators:start --only hosting,functions` で、`public` は 5000、Functions は従来どおりエミュレータ URL を使用します。
