// Database Types for moah

export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'web';

export interface User {
  id: string;
  telegram_id: string | null;
  telegram_username: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformInfo {
  id: string;
  name: Platform;
  display_name: string;
  icon: string;
  color_bg: string;
  color_text: string;
}

export interface Content {
  id: string;
  user_id: string;
  platform_id: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  creator_name: string | null;
  creator_url: string | null;
  memo: string | null;
  saved_at: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface ContentTag {
  content_id: string;
  tag_id: string;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FolderContent {
  folder_id: string;
  content_id: string;
  added_at: string;
  sort_order: number;
}

export interface FolderWithStats extends Folder {
  content_count: number;
  latest_added_at: string | null;
}

export interface FolderWithContents extends FolderWithStats {
  contents: ContentWithRelations[];
}

export interface ContentWithRelations extends Content {
  platform: PlatformInfo;
  tags: Tag[];
  folders?: Folder[];
}

export interface SaveContentRequest {
  url: string;
  telegram_user_id?: string;
  folder_id?: string;
}

export interface SaveContentResponse {
  success: boolean;
  content?: ContentWithRelations;
  error?: string;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
}

export interface AddToFolderRequest {
  content_ids: string[];
}

export interface RemoveFromFolderRequest {
  content_ids: string[];
}

export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<User, 'id'>>; };
      platforms: { Row: PlatformInfo; Insert: Omit<PlatformInfo, 'id'>; Update: Partial<Omit<PlatformInfo, 'id'>>; };
      contents: { Row: Content; Insert: Omit<Content, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Content, 'id'>>; };
      tags: { Row: Tag; Insert: Omit<Tag, 'id' | 'created_at'>; Update: Partial<Omit<Tag, 'id'>>; };
      content_tags: { Row: ContentTag; Insert: Omit<ContentTag, 'created_at'>; Update: never; };
      folders: { Row: Folder; Insert: Omit<Folder, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Folder, 'id' | 'user_id' | 'is_default'>>; };
      folder_contents: { Row: FolderContent; Insert: Omit<FolderContent, 'added_at'>; Update: Partial<Pick<FolderContent, 'sort_order'>>; };
    };
  };
}
