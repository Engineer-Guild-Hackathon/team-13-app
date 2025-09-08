# UTeach - AI-Powered Teaching Assistant

UTeachは、AIを活用した教育支援アプリケーションです。教材をアップロードして、AIが生成した質問に答えることで、効果的な学習体験を提供します。

## 🏗️ モノレポ構成

```
team-13-app/
├── frontend/          # React + Vite フロントエンド
├── backend/           # FastAPI バックエンド
├── app/              # Next.js アプリ（既存）
├── scripts/          # 開発用スクリプト
├── templates/        # テンプレートファイル
└── memory/           # プロジェクトメモリ
```

## 🚀 クイックスタート

### フロントエンド（React + Vite）

```bash
cd frontend
npm install
npm run dev
```

**アクセス**: http://localhost:5173

### バックエンド（FastAPI）

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main_simple:app --reload --port 8787 --host 0.0.0.0
```

**API ドキュメント**: http://localhost:8787/docs

## 🛠️ 技術スタック

### フロントエンド
- **React 18** - UI フレームワーク
- **Vite** - ビルドツール
- **Mantine** - UI コンポーネントライブラリ
- **TypeScript** - 型安全性
- **Axios** - HTTP クライアント

### バックエンド
- **FastAPI** - Web フレームワーク
- **Python 3.11+** - プログラミング言語
- **Google Gemini API** - AI 質問生成・評価
- **Google Cloud Firestore** - データベース
- **Auth0** - 認証システム

## 📋 主要機能

- 📄 **教材アップロード**: PDF ファイルや URL から教材を読み込み
- 🤖 **AI 質問生成**: Gemini API を使用した日本語質問生成
- 📝 **回答評価**: AI による回答の評価とフィードバック
- 💾 **ローカルストレージ**: 生成された質問の保存
- 🌐 **ネットワークアクセス**: 複数デバイスからのアクセス対応

## 🔧 環境設定

### フロントエンド環境変数

```bash
# frontend/.env
VITE_AUTH0_DOMAIN=your-auth0-domain
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=https://api.uteach
VITE_API_BASE_URL=http://localhost:8787
```

### バックエンド環境変数

```bash
# backend/.env
AUTH0_DOMAIN=your-auth0-domain
AUTH0_AUDIENCE=https://api.uteach
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
CORS_ORIGINS=http://localhost:5173,http://192.168.11.2:5173
```

## 📱 使用方法

1. **教材アップロード**: PDF ファイルまたは URL をアップロード
2. **質問生成**: AI が教材に基づいて質問を生成
3. **回答入力**: 生成された質問に回答
4. **フィードバック**: AI による回答の評価と改善提案

## 🌐 ネットワークアクセス

アプリケーションはネットワーク経由でもアクセス可能です：

- **フロントエンド**: `http://[IPアドレス]:5173`
- **バックエンド**: `http://[IPアドレス]:8787`

## 📄 ライセンス

このプロジェクトは Engineer Guild Hackathon の一部として開発されました。

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します。

---

**開発チーム**: Team 13 - Engineer Guild Hackathon