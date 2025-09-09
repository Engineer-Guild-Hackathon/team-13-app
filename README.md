# UTeach - AI生徒との学習アプリ

AI生徒に教えることで学習効果を高める教育アプリです。ユーザーが先生役となり、AI生徒の質問に答えることで、教える側の理解を深めることができます。

## 🏗️ アーキテクチャ

- **フロントエンド**: React + Vite + Mantine UI
- **バックエンド**: FastAPI (Python) + Google Gemini AI
- **認証**: Auth0
- **データベース**: Firestore

## 🚀 起動方法

### 前提条件
- Node.js 18+
- Python 3.8+
- npm

### 1. 依存関係のインストール
```bash
npm run install:all
```

### 2. 環境変数の設定
`backend/.env`ファイルを作成し、以下の環境変数を設定：
```env
GEMINI_API_KEY=your_gemini_api_key
AUTH0_DOMAIN=your_auth0_domain
AUTH0_AUDIENCE=your_auth0_audience
GOOGLE_APPLICATION_CREDENTIALS=path_to_firestore_credentials.json
```

### 3. 開発サーバーの起動
```bash
# フロントエンドとバックエンドを同時起動
npm run dev

# または個別に起動
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:8000
```

## 📁 プロジェクト構造

```
team-13-app/
├── frontend/          # React + Vite フロントエンド
│   ├── src/
│   │   ├── pages/     # ページコンポーネント
│   │   ├── components/ # 共通コンポーネント
│   │   ├── contexts/  # React Context
│   │   └── lib/       # API クライアント
│   ├── package.json
│   └── vite.config.ts
├── backend/           # FastAPI バックエンド
│   ├── main_simple.py # メインAPI
│   ├── requirements.txt
│   └── .env
├── package.json       # モノレポ管理
└── README.md
```

## 🎯 主な機能

- **教材アップロード**: PDFファイルやURLから教材をアップロード
- **AI質問生成**: 教材からAIが自動で質問を生成
- **学習セッション**: AI生徒の質問に回答し、フィードバックを受信
- **学習履歴**: 過去の学習セッションを確認・再開
- **認証機能**: Auth0による安全なユーザー認証

## 🛠️ 開発

### フロントエンド開発
```bash
cd frontend
npm run dev
```

### バックエンド開発
```bash
cd backend
python3 main_simple.py
```

### ビルド
```bash
npm run build
```

## 📝 ライセンス

MIT License