# MOAH 📚

> AI-powered content curation app - Save links from Telegram, auto-tag with AI, organize in folders

[![CI/CD](https://github.com/chloe-sy-park/moah/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/chloe-sy-park/moah/actions/workflows/ci-cd.yml)

## ✨ Features

- **Telegram Bot Integration** - Save links directly from Telegram
- **AI Auto-Tagging** - Claude/OpenAI powered smart tagging
- **OG Metadata Extraction** - Automatic title, description, thumbnail
- **Folder Organization** - Organize content into collections
- **Smart Search** - Full-text search with filters
- **Platform Detection** - YouTube, Instagram, TikTok, etc.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude API, OpenAI API
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest (424 tests)
- **CI/CD**: GitHub Actions → Vercel

## 🚀 Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 📋 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint check
npm run format       # Prettier format
npm run test:run     # Vitest tests
```

## 📄 License

MIT
