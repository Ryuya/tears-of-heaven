# 天国の涙 — Tears of Heaven

インクリメンタルタワーディフェンスゲーム

## Vercelへのデプロイ手順

### 方法1: GitHubリポジトリ経由（推奨）

1. このフォルダをGitHubリポジトリにpush
2. [vercel.com](https://vercel.com) にログイン
3. 「Add New Project」→ GitHubリポジトリを選択
4. Framework Preset: **Vite** を選択
5. 「Deploy」をクリック

### 方法2: Vercel CLI

```bash
npm install -g vercel
cd tears-of-heaven
npm install
vercel
```

## ローカル開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

`dist/` フォルダに静的ファイルが生成されます。
