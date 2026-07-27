/**
 * Shared TypeScript types and interfaces
 * Used by both frontend (apps/web) and backend (apps/api)
 */

export interface ApiResponse<T = unknown> {
  status: 'ok' | 'error'
  data?: T
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}
