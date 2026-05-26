import type { ConcursoSubjects } from '@/types/ranking';

export type ExamBooklet = {
  id: string;
  name: string;
  display_order?: number;
};

export type HasCotaConfig = {
  ppp?: boolean;
  pcd?: boolean;
  ind?: boolean;
  hip?: boolean;
  tra?: boolean;
  min_cota?: number;
};

export type QuotaOption =
  | 'Ampla Concorrência'
  | 'PPP'
  | 'PCD'
  | 'Hipossuficientes'
  | 'Indígenas'
  | 'Pessoas Trans';

export type ConcursoParticipationDetail = {
  id: string;
  titulo: string;
  exam_type?: string | null;
  disciplines?: unknown;
  subjects?: ConcursoSubjects | null;
  has_cota?: HasCotaConfig | null;
  exam_booklets?: ExamBooklet[] | null;
  official_answers?: Record<string, unknown> | null;
};

export type ParticipationLimitsResult = {
  allowed: boolean;
  reason?: string;
  is_pro?: boolean;
  is_creator?: boolean;
  current_count?: number;
  max_allowed?: number;
  message?: string;
  requires_upgrade?: boolean;
};

export type ParticipateResult = {
  success: boolean;
  ranking_key?: string;
  error?: string;
  requires_upgrade?: boolean;
};

export type ExistingAnswersPayload = {
  answers: Record<number, string>;
  subjectives: Record<string, number>;
  selectedBookletId: string | null;
  editCount: number;
  reservationType: string | null;
};
