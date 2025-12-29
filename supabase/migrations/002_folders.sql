-- Folders table for organizing content
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#6B7280',
  icon VARCHAR(10) DEFAULT '📁',
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folder contents junction table
CREATE TABLE IF NOT EXISTS folder_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  sort_order INTEGER DEFAULT 0,
  UNIQUE(folder_id, content_id)
);

-- Indexes
CREATE INDEX idx_folders_user ON folders(user_id);
CREATE INDEX idx_folder_contents_folder ON folder_contents(folder_id);
CREATE INDEX idx_folder_contents_content ON folder_contents(content_id);

-- RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_contents ENABLE ROW LEVEL SECURITY;
