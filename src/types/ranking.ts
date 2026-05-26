export interface RankingCardItem {
  id: string;
  examDate: string;
  banca: string | null;
  concursoTitle: string;
  cargoTitle: string | null;
  participantCount: number;
  creatorName: string | null;
  isAdminCreated: boolean;
  status: string | null;
  localidade: string | null;
  isGeneralCard: boolean;
  watermarkImageUrl?: string | null;
}

export interface CargoCardItem {
  id: string;
  cargo: string;
  banca: string | null;
  status: string | null;
  created_at: string;
  participantCount: number;
  localidade: string | null;
  stateUf: string | null;
  watermarkImageUrl?: string | null;
}

export interface GeneralCardDetail {
  id: string;
  titulo: string;
  orgao: string | null;
  banca: string | null;
  localidades: string[] | null;
  isUnified: boolean;
  watermarkImageUrl?: string | null;
}

export type ConcursoSubjects = {
  discr?: boolean;
  case1?: boolean;
  case2?: boolean;
  case3?: boolean;
  other?: boolean;
  name_other?: string;
};

export interface ConcursoDetail {
  id: string;
  titulo: string;
  orgao: string | null;
  banca: string | null;
  cargo: string | null;
  status: string | null;
  vagas: number | null;
  created_at: string;
  localidade: string | null;
  localidades: string[] | null;
  participantCount: number;
  isAdminCreated: boolean;
  creatorName: string | null;
  exam_type?: string | null;
  disciplines?: unknown;
  subjects?: ConcursoSubjects | null;
}

/** @deprecated use RankingCardItem */
export type ConcursoListItem = RankingCardItem & { titulo?: string };

export const QUOTA_FILTERS = [
  { label: 'Todas', value: '' },
  { label: 'AC', value: 'Ampla Concorrência' },
  { label: 'PPP', value: 'PPP' },
  { label: 'PCD', value: 'PCD' },
  { label: 'Hipossuf.', value: 'Hipossuficientes' },
  { label: 'Indígenas', value: 'Indígenas' },
  { label: 'Trans', value: 'Pessoas Trans' },
] as const;
