import type { Platform, ContentWithRelations } from '@/types/database';
import type { ExtractedMetadata } from '@/lib/og-parser';
import type { GeneratedTag } from '@/lib/tagging';

export interface CreateContentInput {
  userId: string;
  url: string;
  metadata: ExtractedMetadata;
  tags?: GeneratedTag[];
  memo?: string;
}

export interface UpdateContentInput {
  title?: string;
  description?: string;
  memo?: string;
  tags?: string[];
}

export interface ContentFilters {
  platform?: Platform;
  tags?: string[];
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'saved_at' | 'created_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; };
}

export interface ContentWithDetails extends ContentWithRelations {
  platformInfo: { name: Platform; displayName: string; icon: string; colorBg: string; colorText: string; };
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface SaveContentFlowInput {
  url: string;
  telegramUserId?: string;
  userId?: string;
  memo?: string;
}

export interface SaveContentFlowResult {
  success: boolean;
  content?: ContentWithDetails;
  metadata?: ExtractedMetadata;
  tags?: GeneratedTag[];
  error?: string;
  step?: 'validation' | 'metadata' | 'tagging' | 'save';
}
