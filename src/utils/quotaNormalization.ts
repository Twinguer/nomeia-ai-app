/**
 * Utilitários para normalização de tipos de reserva (cotas)
 * 
 * Este módulo garante consistência entre códigos e nomes completos de cotas,
 * normalizando valores do banco de dados para exibição correta.
 */

/**
 * Mapeamento de códigos para nomes completos de cotas
 * Usado para normalizar valores antigos do banco de dados
 */
const CODE_TO_FULL_NAME: Record<string, string> = {
  // Códigos antigos -> Nomes completos corretos
  'PPI': 'PPP', // PPI (código antigo) -> PPP (nome completo)
  'PC': 'Hipossuficientes', // PC (código) -> Hipossuficientes (nome completo)
  'PD': 'Pessoas Trans', // PD (código) -> Pessoas Trans (nome completo)
  'AC': 'Ampla Concorrência', // AC (código) -> Ampla Concorrência (nome completo)
  
  // Nomes completos já corretos (mapeamento identidade)
  'PPP': 'PPP',
  'PCD': 'PCD',
  'Hipossuficientes': 'Hipossuficientes',
  'Indígenas': 'Indígenas',
  'Pessoas Trans': 'Pessoas Trans',
  'Ampla Concorrência': 'Ampla Concorrência',
  
  // Variações comuns
  'Ampla': 'Ampla Concorrência',
  'Pessoas Pretas e Pardas (PPP)': 'PPP',
  'Pessoas Pretas e Pardas': 'PPP',
  'Pretos/Pardos/Indígenas': 'PPP',
};

/**
 * Mapeamento de nomes completos para abreviações de exibição
 * Usado para gerar badges e labels
 */
const FULL_NAME_TO_ABBREVIATION: Record<string, string> = {
  'Ampla Concorrência': 'AC',
  'PPP': 'PPP',
  'PCD': 'PCD',
  'Hipossuficientes': 'Hip',
  'Indígenas': 'Ind',
  'Pessoas Trans': 'Tra',
};

/**
 * Normaliza um tipo de reserva (cota) para o nome completo correto
 * 
 * @param reservationType - Tipo de reserva (pode ser código ou nome completo)
 * @returns Nome completo normalizado ou 'Ampla Concorrência' como fallback
 * 
 * @example
 * normalizeReservationType('PPI') // retorna 'PPP'
 * normalizeReservationType('PPP') // retorna 'PPP'
 * normalizeReservationType('PC') // retorna 'Hipossuficientes'
 */
export function normalizeReservationType(reservationType: string | null | undefined): string {
  if (!reservationType || reservationType.trim() === '') {
    return 'Ampla Concorrência';
  }

  const trimmed = reservationType.trim();
  const normalized = CODE_TO_FULL_NAME[trimmed] || trimmed;

  // Se ainda não encontrou, tentar case-insensitive
  if (normalized === trimmed) {
    const upper = trimmed.toUpperCase();
    const lower = trimmed.toLowerCase();
    
    // Tentar encontrar por case-insensitive
    for (const [code, fullName] of Object.entries(CODE_TO_FULL_NAME)) {
      if (code.toUpperCase() === upper || code.toLowerCase() === lower) {
        return fullName;
      }
    }
  }

  return normalized || 'Ampla Concorrência';
}

/**
 * Obtém a abreviação para exibição de um tipo de reserva
 * 
 * @param reservationType - Tipo de reserva (pode ser código ou nome completo)
 * @returns Abreviação para exibição ou string vazia para Ampla Concorrência
 * 
 * @example
 * getReservationAbbreviation('PPP') // retorna 'PPP'
 * getReservationAbbreviation('PPI') // retorna 'PPP' (normaliza primeiro)
 * getReservationAbbreviation('Hipossuficientes') // retorna 'Hip'
 */
export function getReservationAbbreviation(reservationType: string | null | undefined): string {
  if (!reservationType || reservationType.trim() === '') {
    return '';
  }

  // Normalizar primeiro para garantir nome completo
  const normalized = normalizeReservationType(reservationType);

  // Se for Ampla Concorrência, retornar string vazia (sem badge)
  if (normalized === 'Ampla Concorrência') {
    return '';
  }

  // Retornar abreviação
  return FULL_NAME_TO_ABBREVIATION[normalized] || normalized.substring(0, 3).toUpperCase();
}

/**
 * Lista de tipos de reserva válidos (nomes completos)
 */
export const VALID_RESERVATION_TYPES = [
  'Ampla Concorrência',
  'PPP',
  'PCD',
  'Hipossuficientes',
  'Indígenas',
  'Pessoas Trans',
] as const;

export type ValidReservationType = typeof VALID_RESERVATION_TYPES[number];

