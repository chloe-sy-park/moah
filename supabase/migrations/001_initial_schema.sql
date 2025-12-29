-- moah Database Schema v1.0

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id TEXT UNIQUE,
  telegram_username TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platforms
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT,
  color_bg TEXT NOT NULL,
  color_text TEXT NOT NULL
);

-- Contents
CREATE TABLE contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES platforms(id),
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  creator_name TEXT,
  creator_url TEXT,
  memo TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content-Tags
CREATE TABLE content_tags (
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (content_id, tag_id)
);

-- Indexes
CREATE INDEX idx_contents_user_id ON contents(user_id);
CREATE INDEX idx_contents_platform_id ON contents(platform_id);
CREATE INDEX idx_contents_saved_at ON contents(saved_at DESC);
CREATE INDEX idx_content_tags_tag_id ON content_tags(tag_id);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- Seed platforms
INSERT INTO platforms (name, display_name, icon, color_bg, color_text) VALUES
  ('instagram', 'Instagram', '📷', '#E4405F', '#FFFFFF'),
  ('youtube', 'YouTube', '🎬', '#FF0000', '#FFFFFF'),
  ('tiktok', 'TikTok', '🎵', '#000000', '#FFFFFF'),
  ('twitter', 'X (Twitter)', '🐦', '#1DA1F2', '#FFFFFF'),
  ('web', 'Web', '🌐', '#6B7280', '#FFFFFF');
