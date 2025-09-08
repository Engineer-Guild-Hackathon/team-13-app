# UTeach Frontend

UTeachは「教える体験で学びを深める」をコンセプトにしたウェブアプリケーションです。ユーザーが先生役、AIが生徒役となり、PDFやURLから生成された質問に答えることで学習効果を高めます。

## 技術スタック

- **Frontend**: React + TypeScript + Vite
- **UI Library**: Mantine
- **Authentication**: Auth0
- **Routing**: React Router
- **HTTP Client**: Axios
- **Backend**: FastAPI (Python)

## セットアップ

### 1. 依存関係のインストール

```bash
cd frontend
npm install
# または
pnpm install
```

### 2. 環境変数の設定

```bash
cp env.example .env
```

`.env`ファイルを編集して、以下の値を設定してください：

```env
VITE_AUTH0_DOMAIN=your-tenant.eu.auth0.com
VITE_AUTH0_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AUTH0_AUDIENCE=https://api.uteach
VITE_API_BASE_URL=http://localhost:8787
```

### 3. 開発サーバーの起動

```bash
npm run dev
# または
pnpm dev
```

アプリケーションは `http://localhost:5173` で起動します。

## 機能

### ページ構成

- **Dashboard**: メインページ、最近の教材とセッション履歴
- **Upload**: PDF/URLのアップロード、質問レベル設定
- **Teach**: AI生徒の質問に回答、フィードバック確認
- **History**: 過去のセッション一覧・再開

### 主要機能

1. **教材アップロード**
   - PDFファイルのアップロード
   - URLからのコンテンツ取得
   - 質問レベル設定（初級/中級/上級）

2. **AI質問生成**
   - Gemini APIを使用した質問生成
   - レベルに応じた質問の難易度調整

3. **回答・フィードバック**
   - 質問への回答入力
   - AIによる回答評価（スコア、強み、改善提案）
   - 模範解答の表示

4. **認証・セキュリティ**
   - Auth0による認証
   - JWT トークンによるAPI認証
   - ユーザー別データ分離

## SpecKit要件の実装

- ✅ Mantine UI の全面採用
- ✅ Auth0 Bearer トークンによるAPI認証
- ✅ `useApi()` フックによるAPI呼び出し
- ✅ ローカルステート管理（Redux/Query未使用）
- ✅ `localStorage` への質問保存（`questions:{session_id}`）
- ✅ 最小限のコンポーネント構成

## バックエンド連携

このフロントエンドは、FastAPIバックエンドと連携することを前提としています。バックエンドの起動方法については、プロジェクトルートのREADMEを参照してください。

## ビルド

```bash
npm run build
# または
pnpm build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。
