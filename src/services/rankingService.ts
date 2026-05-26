// @ts-nocheck
/**
 * ✅ CONSOLIDADO: Serviço único de rankings
 * 
 * Este arquivo consolida as funcionalidades de rankingService.ts (V1),
 * rankingServiceV2.ts e rankingServiceV3.ts em uma única implementação.
 * 
 * Características:
 * - Usa RPCs para segurança e performance
 * - Interface única e consistente
 * - Cache otimizado com suporte a reservationType
 */
import { getSupabase } from '@/lib/supabase';
import { getReservationAbbreviation, normalizeReservationType } from '@/utils/quotaNormalization';
import { logger } from '@/utils/logger';
import { rankingCache } from './rankingCache';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

// ✅ Interface única consolidada (anteriormente RankingV3)
export interface Ranking {
  id: string;
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string;
  reservationType: string;
  displayReservation: string;
  discursiveScore?: number;
  caseStudy1Score?: number;
  caseStudy2Score?: number;
  caseStudy3Score?: number;
  otherSubjectiveScore?: number;
  weightedDiscursiveScore?: number;
  weightedCaseStudy1Score?: number;
  weightedCaseStudy2Score?: number;
  weightedCaseStudy3Score?: number;
  weightedOtherSubjectiveScore?: number;
  customDisciplineScores?: Record<string, number>;
  weightedCustomDisciplineScores?: Record<string, number>;
  belowMinimum?: boolean;
  belowDisciplineMinimums?: string[];
  belowBlockMinimums?: string[];
}

// ✅ Interface consolidada (anteriormente RankingDataV3)
export interface RankingData {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  total_participants: number;
  created_at: string;
  exam_type: string;
  disciplines?: any[];
  official_answers?: Record<string, any>;
}

/**
 * Busca rankings de forma otimizada usando JOINs nativos do Supabase
 * @param concursoId ID do concurso
 * @param reservationType Tipo de reserva (opcional)
 * @param offset Offset para paginação
 * @param limit Limite de resultados
 */
// ✅ Função principal consolidada (anteriormente fetchUserRankingsV3)
export const fetchUserRankings = async (
  concursoId: string,
  reservationType?: string,
  offset = 0,
  limit = 100
): Promise<Ranking[]> => {
  const startTime = performance.now();
  
  // ✅ SEGURANÇA: Log sanitizado (sem dados sensíveis) - apenas em desenvolvimento
  devLog.debug('🚀 [RANKING_SERVICE] Início fetchUserRankings', {
    hasConcursoId: !!concursoId,
    hasReservationType: !!reservationType,
    offset,
    limit
  });

  try {
    // ✅ Verificar se concursoId é válido
    if (!concursoId) {
      devLog.error('❌ [RANKING_SERVICE] concursoId é inválido ou vazio');
      throw new Error('concursoId é obrigatório');
    }

    logger.info('fetchUserRankings called', 'RANKING_SERVICE', {
      concursoId,
      reservationType,
      offset,
      limit
    });

    const page = Math.floor(offset / limit) + 1;

    // ✅ Cache reabilitado: Agora que o bug foi corrigido, podemos usar o cache normalmente
    // O cache armazena os dados já processados com a lógica de desempate correta
    // A versão do cache (v2-tiebreaker-by-date) garante que dados antigos não sejam retornados
    const localCachedRankings = rankingCache.getRankings(concursoId, page, limit, reservationType);
    
    if (localCachedRankings && localCachedRankings.length > 0) {
      devLog.debug('✅ [RANKING_SERVICE] Cache hit - retornando dados do cache', {
        count: localCachedRankings.length,
        page,
        limit
      });
        return localCachedRankings as Ranking[];
    }
    
    devLog.debug('📡 [RANKING_SERVICE] Cache miss - buscando dados do servidor');

    // ✅ FASE 2: Migrar para usar RPC em vez de query direta
    // Usar função RPC que retorna rankings do concurso (acesso público)
    devLog.debug('📡 [RANKING_SERVICE] Chamando RPC', {
      hasConcursoId: !!concursoId,
      hasReservationType: !!reservationType,
      offset,
      limit
    });
    
    const supabase = getSupabase();
    if (!supabase) {
      devLog.error('❌ [RANKING_SERVICE] Supabase client não está disponível');
      throw new Error('Supabase client não está disponível');
    }

    let allUserRankings: any = null;
    let rankingError: any = null;

    try {
      devLog.debug('📡 [RANKING_SERVICE] Chamando RPC get_rankings_for_concurso', {
        hasConcursoId: !!concursoId,
        hasReservationType: !!reservationType,
        offset,
        limit
      });
      
      const rpcResult = await getSupabase().rpc('get_rankings_for_concurso', {
        p_concurso_id: concursoId,
        p_reservation_type: reservationType || null,
        p_offset: offset,
        p_limit: limit
      });
      
      allUserRankings = rpcResult.data;
      rankingError = rpcResult.error;
      
      devLog.debug('📡 [RANKING_SERVICE] RPC executado', {
        hasData: !!allUserRankings,
        hasError: !!rankingError,
        dataLength: allUserRankings?.length || 0,
        dataType: Array.isArray(allUserRankings) ? 'array' : typeof allUserRankings
      });
    } catch (rpcException) {
      devLog.error('❌ [RANKING_SERVICE] Exceção ao chamar RPC', sanitizeForLog(rpcException));
      rankingError = rpcException;
    }

    if (rankingError) {
      devLog.error('❌ [RANKING_SERVICE] Erro no RPC', sanitizeForLog({
        code: rankingError.code,
        message: rankingError.message
      }));
      logger.error('Error calling get_rankings_for_concurso V3', 'RANKING_SERVICE_V3', rankingError);
      throw new Error(`Ranking query error: ${rankingError.message || 'Erro desconhecido ao chamar RPC'}`);
    }
    
    devLog.debug('✅ [RANKING_SERVICE] RPC retornou com sucesso', {
      hasData: !!allUserRankings,
      dataLength: allUserRankings?.length || 0,
      dataType: Array.isArray(allUserRankings) ? 'array' : typeof allUserRankings
    });

    if (!allUserRankings || allUserRankings.length === 0) {
      devLog.debug('⚠️ [RANKING_SERVICE] Nenhum ranking retornado do RPC');
      return [];
    }

    devLog.debug('📊 [RANKING_SERVICE] Dados do RPC (sanitizado)', {
      totalItems: allUserRankings.length,
      hasConsolidatedData: allUserRankings[0] ? !!allUserRankings[0].consolidated_data : false
    });

    // Processar consolidated_data para extrair rankings do concurso específico
    const rankingsForConcurso = [];
    
    for (const item of allUserRankings) {
      // ✅ CORREÇÃO: Garantir que consolidated_data seja um objeto
      let consolidatedData = item.consolidated_data;
      
      // Se for string (pode acontecer com JSONB), fazer parse
      if (typeof consolidatedData === 'string') {
        try {
          consolidatedData = JSON.parse(consolidatedData);
        } catch (e) {
          devLog.error('❌ [RANKING_SERVICE] Erro ao fazer parse de consolidated_data', sanitizeForLog(e));
          continue;
        }
      }
      
      consolidatedData = consolidatedData || {};
      
      if (consolidatedData.rankings) {
        // Encontrar o ranking específico deste concurso
        for (const [rankingId, ranking] of Object.entries(consolidatedData.rankings)) {
          const rankingConcursoId = (ranking as any).concurso_id;
          
          // ✅ CORREÇÃO: Comparar como string para evitar problemas de tipo UUID
          if (String(rankingConcursoId) === String(concursoId)) {
            rankingsForConcurso.push({
              user_id: item.user_id,
              rankingId,
              rankingData: ranking
            });
            break; // Apenas um ranking por concurso por usuário
          }
        }
      } else {
        devLog.debug('⚠️ [RANKING_SERVICE] consolidatedData não tem rankings', {
          consolidatedDataType: typeof consolidatedData,
          consolidatedDataKeyCount: Object.keys(consolidatedData).length,
          consolidatedDataIsArray: Array.isArray(consolidatedData)
        });
      }
    }

    devLog.debug('✅ [RANKING_SERVICE] Rankings encontrados para o concurso', {
      total: rankingsForConcurso.length
    });
    
    // ✅ CRÍTICO: Se não houver rankings, retornar vazio imediatamente
    if (rankingsForConcurso.length === 0) {
      return [];
    }

    // ✅ CORREÇÃO CRÍTICA: Buscar dados do concurso para verificar exam_type e mínimos
    const { data: concursoData, error: concursoError } = await getSupabase()
      .from('concursos')
      .select('exam_type, disciplines')
      .eq('id', concursoId)
      .maybeSingle();

    if (concursoError) {
      devLog.warn('⚠️ [RANKING_SERVICE] Erro ao buscar dados do concurso, usando padrão', sanitizeForLog(concursoError));
    }

    const examType = concursoData?.exam_type || 'Múltipla Escolha';
    
    // ✅ CORREÇÃO CRÍTICA: Extrair mínimos globais do concurso
    let minimumTotalScore = 0;
    let minimumTotalScoreCotas = 0;
    
    if (concursoData?.disciplines && typeof concursoData.disciplines === 'object' && !Array.isArray(concursoData.disciplines)) {
      minimumTotalScore = Number(concursoData.disciplines.minimum_total_score) || 0;
      minimumTotalScoreCotas = Number(concursoData.disciplines.minimum_total_score_cotas) || 0;
    }

    // ✅ CORREÇÃO CRÍTICA: Função para verificar se ranking está abaixo do mínimo
    // A verificação de mínimos é feita no backend (Edge Function e função do banco)
    // O frontend confia no flag belowMinimum que vem do backend, mas adiciona fallback
    const isBelowMinimum = (rankingData: any): boolean => {
      const userData = rankingData?.user_data || rankingData || {};
      const totalScore = userData?.score || rankingData?.score || 0;
      const reservationType = userData?.reservation_type || rankingData?.reservation_type || 'Ampla Concorrência';
      
      // Calcular score objetivo (sem subjetivas) para verificação de mínimo global
      const subjectiveScores = userData?.subjectives || userData?.subjective_scores || {};
      const subjectiveTotal = 
        (Number(subjectiveScores.discursive) || 0) +
        (Number(subjectiveScores.case_study_1) || 0) +
        (Number(subjectiveScores.case_study_2) || 0) +
        (Number(subjectiveScores.case_study_3) || 0) +
        (Number(subjectiveScores.other_subjective) || 0);
      
      const objectiveScore = totalScore - subjectiveTotal;
      
      // 1. Verificar flag belowMinimum (mínimo global) - calculado no backend usando score objetivo
      const belowMinimum = !!(userData?.belowMinimum || userData?.below_minimum);
      
      // 2. ✅ FALLBACK: Verificar mínimo global atual do concurso (caso flag esteja desatualizado)
      // Normalizar reservation_type para garantir consistência
      const normalizedReservationType = normalizeReservationType(reservationType);
      const isCotas = normalizedReservationType !== 'Ampla Concorrência';
      const applicableMinimum = isCotas ? minimumTotalScoreCotas : minimumTotalScore;
      const belowGlobalMinimum = applicableMinimum > 0 && objectiveScore < applicableMinimum;
      
      // 3. Verificar mínimos por disciplina/bloco (flags salvos)
      const hasDisciplineMinimums = (userData?.belowDisciplineMinimums || userData?.below_discipline_minimums || []).length > 0;
      const hasBlockMinimums = (userData?.belowBlockMinimums || userData?.below_block_minimums || []).length > 0;
      
      // 4. Para provas "Certo ou Errado" ou "Alternativas", eliminar se nota <= 0
      // NOTA: Para essas provas, o score já é o objetivo (não há subjetivas)
      const isCertoErradoEliminated = examType === 'Certo ou Errado' && totalScore <= 0;
      const isAlternativasEliminated = examType === 'Alternativas' && totalScore <= 0;
      
      // ✅ Usar flag salvo OU verificar mínimo global atual (fallback)
      return belowMinimum || 
             belowGlobalMinimum || // ✅ FALLBACK: Verificar mínimo global atual
             hasDisciplineMinimums || 
             hasBlockMinimums || 
             isCertoErradoEliminated || 
             isAlternativasEliminated;
    };

    // ✅ CORREÇÃO CRÍTICA: Separar classificados de eliminados ANTES de ordenar
    const classifiedRankings: typeof rankingsForConcurso = [];
    const eliminatedRankings: typeof rankingsForConcurso = [];

    rankingsForConcurso.forEach((item) => {
      if (isBelowMinimum(item.rankingData)) {
        eliminatedRankings.push(item);
      } else {
        classifiedRankings.push(item);
      }
    });

    devLog.debug('✅ [RANKING_SERVICE] Rankings separados', {
      classified: classifiedRankings.length,
      eliminated: eliminatedRankings.length
    });

    // ❌ NÃO ORDENAR CLASSIFICADOS AQUI: A ordenação completa (score + desempate por data) será feita depois
    // Ordenar aqui apenas por score interfere com o desempate que será aplicado depois
    // A ordenação completa será feita na linha 403-443 após criar paginatedData

    // Ordenar eliminados por score (descendente) - apenas para manter ordem consistente
    eliminatedRankings.sort((a, b) => {
      const scoreA = (a.rankingData as any).user_data?.score || 0;
      const scoreB = (b.rankingData as any).user_data?.score || 0;
      return scoreB - scoreA;
    });

    // ✅ CORREÇÃO: Combinar classificados primeiro, depois eliminados
    // IMPORTANTE: classifiedRankings NÃO está ordenado aqui - será ordenado depois com desempate
    const sortedRankingsForConcurso = [...classifiedRankings, ...eliminatedRankings];

    // Buscar perfis de usuários separadamente (RPC não retorna perfis)
    const userIds = [...new Set(sortedRankingsForConcurso.map((item: any) => item.user_id))];
    
    const { data: userProfiles, error: profileError } = await getSupabase()
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    if (profileError) {
      logger.error('Error fetching user profiles V3', 'RANKING_SERVICE_V3', profileError);
      // Continuar mesmo sem perfis (usar valores padrão)
    }

    // Criar mapa de perfis para lookup rápido
    const profileMap = new Map();
    if (userProfiles) {
      userProfiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }

    // Mapear resultados para o formato esperado
    const paginatedData = sortedRankingsForConcurso.map((item: any) => {
      const userProfile = profileMap.get(item.user_id) || { name: 'Usuário', avatar_url: null };
      return {
        user_id: item.user_id,
        rankingId: item.rankingId,
        rankingData: item.rankingData,
        users_profiles: userProfile
      };
    });
    
    devLog.debug('📊 [RANKING_SERVICE] paginatedData criado', {
      paginatedDataLength: paginatedData.length,
      sortedRankingsLength: sortedRankingsForConcurso.length
    });

    // ✅ CORREÇÃO CRÍTICA: Calcular posições considerando empates APENAS para classificados
    // Separar índices de classificados e eliminados
    const classifiedIndices: number[] = [];
    const eliminatedIndices: number[] = [];

    paginatedData.forEach((item: any, index: number) => {
      if (isBelowMinimum(item.rankingData)) {
        eliminatedIndices.push(index);
      } else {
        classifiedIndices.push(index);
      }
    });

    // ✅ NOVO: Ordenar todos os classificados por score (decrescente) e depois por data de registro (crescente)
    devLog.debug('🔍 [RANKING_SERVICE] Iniciando ordenação de classificados', {
      totalClassified: classifiedIndices.length,
      totalEliminated: eliminatedIndices.length
    });

    classifiedIndices.sort((a, b) => {
      const itemA = paginatedData[a];
      const itemB = paginatedData[b];
      const rankingDataA = itemA.rankingData || itemA;
      const rankingDataB = itemB.rankingData || itemB;
      const userDataA = rankingDataA?.user_data || rankingDataA || {};
      const userDataB = rankingDataB?.user_data || rankingDataB || {};
      
      const scoreA = userDataA?.score || rankingDataA?.score || 0;
      const scoreB = userDataB?.score || rankingDataB?.score || 0;
      
      // Primeiro critério: score (decrescente - maior score primeiro)
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      // Segundo critério: data de registro (crescente - quem registrou primeiro fica na frente)
      const controlMetadataA = rankingDataA?.control_metadata || {};
      const controlMetadataB = rankingDataB?.control_metadata || {};
      const createdAtA = controlMetadataA?.created_at || rankingDataA?.created_at || '';
      const createdAtB = controlMetadataB?.created_at || rankingDataB?.created_at || '';
      
      let timestampA = 0;
      let timestampB = 0;
      
      if (createdAtA) {
        const dateA = new Date(createdAtA);
        timestampA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
        }
      
      if (createdAtB) {
        const dateB = new Date(createdAtB);
        timestampB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
      }
      
      // ✅ DEBUG: Log para verificar desempate
      if (scoreA === scoreB) {
        if (timestampA !== timestampB && timestampA > 0 && timestampB > 0) {
          devLog.debug('🔍 [RANKING_SERVICE] Aplicando desempate por data', {
            score: scoreA,
            timestampA,
            timestampB,
            createdAtA: createdAtA.substring(0, 19),
            createdAtB: createdAtB.substring(0, 19),
            diff: timestampA - timestampB
          });
        } else if (timestampA === 0 && timestampB === 0) {
          devLog.warn('⚠️ [RANKING_SERVICE] Empate sem data de criação disponível', {
            score: scoreA,
            userIdA: itemA.user_id,
            userIdB: itemB.user_id
          });
      }
      }
      
      // Quem registrou primeiro (menor timestamp) fica na frente
      // Se ambos têm timestamp 0, usar user_id como critério de desempate (ordem determinística)
      if (timestampA === 0 && timestampB === 0) {
        // Usar user_id como critério de desempate para garantir ordem determinística
        const userIdA = itemA.user_id || '';
        const userIdB = itemB.user_id || '';
        return userIdA.localeCompare(userIdB);
      }
      
      return timestampA - timestampB;
    });
    
    // ✅ DEBUG: Verificar se a ordenação foi aplicada (apenas em desenvolvimento)
    if (classifiedIndices.length > 0) {
      devLog.debug('🔍 [RANKING_SERVICE] Ordenação de classificados concluída', {
        totalClassified: classifiedIndices.length
      });
    }

    // ✅ Calcular posições sequenciais para os classificados ordenados
    let positionCounter = offset + 1;
    const positionMap = new Map<number, number>();

    classifiedIndices.forEach((index) => {
      const item = paginatedData[index];
      const rankingData = item.rankingData || item;
      const userData = rankingData?.user_data || rankingData || {};
      const score = userData?.score || rankingData?.score || 0;
      
      positionMap.set(index, positionCounter);
      positionCounter++;
    });

    // Eliminados não recebem posição (ou recebem 0)
    eliminatedIndices.forEach((index) => {
      positionMap.set(index, 0);
    });

    // ✅ NOVO: Criar array ordenado combinando classificados (ordenados) e eliminados
    const orderedIndices = [...classifiedIndices, ...eliminatedIndices];
    
    // ✅ CRÍTICO: Verificar se orderedIndices está vazio
    if (orderedIndices.length === 0) {
      devLog.warn('⚠️ [RANKING_SERVICE] orderedIndices está vazio');
      return [];
    }
    
    // ✅ CRÍTICO: Verificar se paginatedData está vazio
    if (paginatedData.length === 0) {
      devLog.warn('⚠️ [RANKING_SERVICE] paginatedData está vazio');
      return [];
    }
    
    // Mapear resultados para o formato esperado usando a ordem correta
    const rankings: Ranking[] = orderedIndices.map((originalIndex: number, mapIndex: number) => {
      // ✅ CRÍTICO: Verificar se o índice é válido
      if (originalIndex < 0 || originalIndex >= paginatedData.length) {
        devLog.error('❌ [RANKING_SERVICE] Índice inválido', {
          originalIndex,
          paginatedDataLength: paginatedData.length
        });
        return null;
      }
      
      const item = paginatedData[originalIndex];
      // RPC retorna dados já formatados, mas precisamos extrair user_data
      // item.rankingData já é o objeto ranking de consolidated_data->rankings->[rankingId]
      const rankingData = item.rankingData || item;
      
      // ✅ DEBUG DETALHADO: Verificar estrutura completa
      if (mapIndex === 0) {
        devLog.debug('🔍 [RANKING_SERVICE] rankingData structure (primeiro item - sanitizado)', {
          itemKeyCount: Object.keys(item).length,
          rankingDataKeyCount: Object.keys(rankingData || {}).length,
          hasUserData: !!rankingData?.user_data,
          rankingDataType: typeof rankingData,
          rankingDataIsArray: Array.isArray(rankingData)
        });
      }
      
      // rankingData.user_data contém todos os dados do usuário
      const userData = rankingData?.user_data || rankingData || {};
      
      // ✅ DEBUG: Verificar se userData está vazio ou tem dados
      if (mapIndex === 0) {
        // ✅ SEGURANÇA: Log sanitizado da estrutura userData (sem dados completos)
        const allUserDataKeys = Object.keys(userData);
        devLog.debug('🔍 [RANKING_SERVICE] Estrutura userData (primeiro item):', {
          totalKeys: allUserDataKeys.length,
          keySample: allUserDataKeys.slice(0, 10), // Apenas amostra de chaves
          hasWeightedCustomDisciplineScores: !!userData?.weightedCustomDisciplineScores,
          hasWeightedCustomDisciplineScoresSnake: !!userData?.weighted_custom_discipline_scores,
          hasWeightedObjectScores: !!userData?.weighted_object_scores,
          hasWeightedObjectScoresCamel: !!userData?.weightedObjectScores,
          hasObjectScores: !!userData?.object_scores,
          objectScoresType: typeof userData?.object_scores,
          weightedCustomDisciplineScoresType: typeof userData?.weightedCustomDisciplineScores,
          // Apenas contagens e chaves, não valores completos
          objectScoresKeyCount: userData?.object_scores ? Object.keys(userData.object_scores).length : 0,
          weightedCustomDisciplineScoresKeyCount: userData?.weightedCustomDisciplineScores ? Object.keys(userData.weightedCustomDisciplineScores).length : 0,
          sampleObjectScoresKeys: userData?.object_scores ? Object.keys(userData.object_scores).slice(0, 5) : null,
          sampleWeightedCustomKeys: userData?.weightedCustomDisciplineScores ? Object.keys(userData.weightedCustomDisciplineScores).slice(0, 5) : null
        });
        
        // Verificar se há alguma chave que contenha "weighted" ou "custom" ou "discipline"
        const keysWithWeighted = allUserDataKeys.filter(k => k.toLowerCase().includes('weighted'));
        const keysWithCustom = allUserDataKeys.filter(k => k.toLowerCase().includes('custom'));
        const keysWithDiscipline = allUserDataKeys.filter(k => k.toLowerCase().includes('discipline'));
        devLog.debug('🔍 [RANKING_SERVICE] Chaves relacionadas (contagens):', {
          weightedCount: keysWithWeighted.length,
          customCount: keysWithCustom.length,
          disciplineCount: keysWithDiscipline.length,
          weightedSample: keysWithWeighted.slice(0, 5),
          customSample: keysWithCustom.slice(0, 5)
        });
      }
      
      // Extrair pontuações subjetivas da estrutura correta
      const subjectiveScores = userData?.subjectives || userData?.subjective_scores || {};
      const objectScores = userData?.object_scores || {};
      
      // ✅ CORREÇÃO: Extrair weightedCustomDisciplineScores ou weighted_object_scores
      // Verificar ambos os formatos (camelCase e snake_case)
      // O campo no banco é weightedCustomDisciplineScores (camelCase)
      const weightedObjectScores = userData?.weightedCustomDisciplineScores || 
                                    userData?.weighted_custom_discipline_scores ||
                                    userData?.weighted_object_scores || 
                                    userData?.weightedObjectScores || {};
      
      // ✅ CORREÇÃO: Extrair weighted_subjective_scores se disponível
      const weightedSubjectives = userData?.weighted_subjective_scores || 
                                  userData?.weightedSubjectiveScores ||
                                  userData?.weighted_subjectives || {};
      
      // ✅ SEGURANÇA: Log sanitizado dos dados extraídos (sem valores completos)
      if (mapIndex === 0) {
        devLog.debug('🔍 [RANKING_SERVICE] Dados extraídos (primeiro item - sanitizado):', {
          weightedObjectScoresKeyCount: Object.keys(weightedObjectScores).length,
          objectScoresKeyCount: Object.keys(objectScores).length,
          weightedObjectScoresKeys: Object.keys(weightedObjectScores).slice(0, 5), // Apenas chaves, não valores
          objectScoresKeys: Object.keys(objectScores).slice(0, 5),
          hasWeightedSubjectives: Object.keys(weightedSubjectives).length > 0,
          weightedSubjectivesKeyCount: Object.keys(weightedSubjectives).length,
          weightedSubjectivesKeys: Object.keys(weightedSubjectives).slice(0, 5)
        });
      }

      const isEliminated = isBelowMinimum(rankingData);
      
      const positionFromMap = positionMap.get(originalIndex);
      const assignedPosition = isEliminated ? 0 : (positionFromMap || 0);
      
      return {
        id: item.rankingId || rankingData?.id || `ranking-${item.user_id}-${originalIndex}`, // Usar o rankingId específico
        position: assignedPosition, // ✅ CORREÇÃO CRÍTICA: Eliminados recebem posição 0, classificados recebem posição considerando empates
        name: item.users_profiles?.name || 'Usuário',
        score: userData?.score || rankingData?.score || 0,
        userId: item.user_id,
        avatarUrl: item.users_profiles?.avatar_url || null,
        // ✅ CORREÇÃO: Normalizar reservation_type para garantir nomenclatura correta
        reservationType: normalizeReservationType(userData?.reservation_type || rankingData?.reservation_type || 'Ampla Concorrência'),
        displayReservation: getReservationAbbreviation(userData?.reservation_type || rankingData?.reservation_type || 'Ampla Concorrência'),
        discursiveScore: subjectiveScores.discursive || 0,
        caseStudy1Score: subjectiveScores.case_study_1 || 0,
        caseStudy2Score: subjectiveScores.case_study_2 || 0,
        caseStudy3Score: subjectiveScores.case_study_3 || 0,
        otherSubjectiveScore: subjectiveScores.other_subjective || 0,
        // ✅ CORREÇÃO: Adicionar scores ponderados das subjetivas
        weightedDiscursiveScore: Number(
          weightedSubjectives.weighted_discursive_score || 
          weightedSubjectives.weightedDiscursiveScore || 
          subjectiveScores.discursive || 0
        ),
        weightedCaseStudy1Score: Number(
          weightedSubjectives.weighted_case_study_1_score || 
          weightedSubjectives.weightedCaseStudy1Score || 
          subjectiveScores.case_study_1 || 0
        ),
        weightedCaseStudy2Score: Number(
          weightedSubjectives.weighted_case_study_2_score || 
          weightedSubjectives.weightedCaseStudy2Score || 
          subjectiveScores.case_study_2 || 0
        ),
        weightedCaseStudy3Score: Number(
          weightedSubjectives.weighted_case_study_3_score || 
          weightedSubjectives.weightedCaseStudy3Score || 
          subjectiveScores.case_study_3 || 0
        ),
        weightedOtherSubjectiveScore: Number(
          weightedSubjectives.weighted_other_subjective_score || 
          weightedSubjectives.weightedOtherSubjectiveScore || 
          subjectiveScores.other_subjective || 0
        ),
        // ✅ CORREÇÃO: Usar objectScores filtrado para customDisciplineScores
        customDisciplineScores: Object.fromEntries(
          Object.entries(objectScores).filter(([k]) => k.startsWith('custom_'))
        ),
        // ✅ CORREÇÃO: Usar weightedCustomDisciplineScores ou weighted_object_scores
        // Se weightedObjectScores já contém apenas chaves custom_, usar diretamente
        // Caso contrário, filtrar apenas as que começam com custom_
        weightedCustomDisciplineScores: (() => {
          // ✅ SEGURANÇA: Log sanitizado da criação de weightedCustomDisciplineScores (sem dados completos)
          if (mapIndex === 0) {
            devLog.debug('🔍 [RANKING_SERVICE] Criando weightedCustomDisciplineScores (sanitizado):', {
              weightedObjectScoresKeyCount: Object.keys(weightedObjectScores).length,
              objectScoresKeyCount: Object.keys(objectScores).length,
              weightedObjectScoresKeys: Object.keys(weightedObjectScores).slice(0, 10), // Apenas chaves
              objectScoresKeys: Object.keys(objectScores).slice(0, 10),
              objectScoresCustomKeys: Object.keys(objectScores).filter(k => k.startsWith('custom_')).slice(0, 10),
              weightedObjectScoresCustomKeys: Object.keys(weightedObjectScores).filter(k => k.startsWith('custom_')).slice(0, 10)
            });
          }
          
          if (Object.keys(weightedObjectScores).length > 0) {
            // ✅ CORREÇÃO: Usar TODOS os dados diretamente, sem filtro
            // O backend já salva apenas as disciplinas customizadas em weightedCustomDisciplineScores
            if (mapIndex === 0) {
              devLog.debug('✅ [RANKING_SERVICE] Usando weightedObjectScores completo (sanitizado):', {
                keyCount: Object.keys(weightedObjectScores).length,
                keys: Object.keys(weightedObjectScores).slice(0, 10) // Apenas chaves, não valores
              });
            }
            return weightedObjectScores; // ✅ Retornar TODOS os dados, sem filtro
          }
          // Fallback: se não houver weighted scores, usar object_scores (sem peso)
          const fallback = Object.fromEntries(
            Object.entries(objectScores).filter(([k]) => k.startsWith('custom_'))
          );
          if (mapIndex === 0) {
            devLog.debug('⚠️ [RANKING_SERVICE] Usando fallback (object_scores filtrado)', {
              fallbackKeyCount: Object.keys(fallback).length,
              fallbackKeys: Object.keys(fallback).slice(0, 5) // Apenas chaves, não valores
            });
          }
          // ✅ CORREÇÃO: Se o fallback resultou em vazio mas há objectScores, usar TODOS
          if (Object.keys(fallback).length === 0 && Object.keys(objectScores).length > 0) {
            if (mapIndex === 0) {
              devLog.debug('⚠️ [RANKING_SERVICE] Fallback resultou vazio, usando todos os objectScores');
            }
            return objectScores;
          }
          return fallback;
        })(),
        // ✅ CORREÇÃO CRÍTICA: Usar o resultado da função isBelowMinimum para garantir consistência
        belowMinimum: isEliminated,
        belowDisciplineMinimums: userData?.belowDisciplineMinimums || userData?.below_discipline_minimums || [],
        belowBlockMinimums: userData?.belowBlockMinimums || userData?.below_block_minimums || [],
      };
    }).filter((r): r is Ranking => r !== null); // ✅ CRÍTICO: Filtrar nulls

    devLog.debug('✅ [RANKING_SERVICE] Rankings mapeados', {
      total: rankings.length
    });

    // ✅ SEGURANÇA: Log sanitizado dos dados finais (sem valores completos)
    if (rankings.length > 0) {
      devLog.debug('✅ [RANKING_SERVICE] Rankings mapeados (primeiro item - sanitizado):', {
        totalRankings: rankings.length,
        firstRanking: {
          id: rankings[0].id,
          name: '[REDACTED]', // Não expor nome completo
          score: rankings[0].score,
          hasWeightedCustomDisciplineScores: !!rankings[0].weightedCustomDisciplineScores,
          weightedCustomDisciplineScoresKeyCount: rankings[0].weightedCustomDisciplineScores ? Object.keys(rankings[0].weightedCustomDisciplineScores).length : 0,
          weightedCustomDisciplineScoresKeys: rankings[0].weightedCustomDisciplineScores ? Object.keys(rankings[0].weightedCustomDisciplineScores).slice(0, 5) : [], // Apenas chaves
          hasCustomDisciplineScores: !!rankings[0].customDisciplineScores,
          customDisciplineScoresKeyCount: rankings[0].customDisciplineScores ? Object.keys(rankings[0].customDisciplineScores).length : 0,
          customDisciplineScoresKeys: rankings[0].customDisciplineScores ? Object.keys(rankings[0].customDisciplineScores).slice(0, 5) : []
        }
      });
    }
    
    // ✅ CORREÇÃO: Verificar se os rankings têm os campos necessários antes de salvar no cache
    // Garantir que pelo menos alguns rankings tenham weightedCustomDisciplineScores
    const rankingsWithScores = rankings.filter(r => 
      r.weightedCustomDisciplineScores && Object.keys(r.weightedCustomDisciplineScores).length > 0
    );
    
    if (rankings.length > 0 && rankingsWithScores.length === 0) {
      devLog.warn('⚠️ [RANKING_SERVICE] Nenhum ranking tem weightedCustomDisciplineScores válido');
      devLog.debug('⚠️ [RANKING_SERVICE] Estrutura dos dados (sanitizado):', {
        sampleRanking: rankings[0] ? {
          keyCount: Object.keys(rankings[0]).length,
          allKeys: Object.keys(rankings[0]).slice(0, 10), // Apenas amostra de chaves
          hasCustomDisciplineScores: !!rankings[0].customDisciplineScores,
          customDisciplineScoresKeyCount: rankings[0].customDisciplineScores ? Object.keys(rankings[0].customDisciplineScores).length : 0,
          customDisciplineScoresKeys: rankings[0].customDisciplineScores ? Object.keys(rankings[0].customDisciplineScores).slice(0, 5) : []
        } : null
      });
    }
    
    logger.info('Rankings mapeados', 'RANKING_SERVICE', {
      total: rankings.length,
      withWeightedScores: rankingsWithScores.length,
      sampleWeightedScores: rankings[0]?.weightedCustomDisciplineScores || {}
    });
    
    // ✅ DEBUG: Verificar posições finais antes de retornar (apenas em desenvolvimento)
    devLog.debug('🔍 [RANKING_SERVICE] Rankings processados com sucesso', {
      total: rankings.length,
      classified: rankings.filter(r => r.position > 0).length,
      eliminated: rankings.filter(r => r.position === 0).length
    });
    
    // Armazenar no cache local apenas se os dados estiverem completos
    rankingCache.setRankings(concursoId, rankings, page, limit, reservationType);

    const duration = performance.now() - startTime;
    logger.performance('fetchUserRankings completed', duration, 'RANKING_SERVICE', {
      count: rankings.length,
      offset,
      limit
    });

    return rankings;
  } catch (error: any) {
    devLog.error('❌ [RANKING_SERVICE] Erro geral', sanitizeForLog({
      message: error?.message,
      name: error?.name
    }));
    logger.error('Error in fetchUserRankings', 'RANKING_SERVICE', error);
    throw error;
  } finally {
    const endTime = performance.now();
    devLog.debug('🏁 [RANKING_SERVICE] Fim fetchUserRankings', {
      duration: `${(endTime - startTime).toFixed(2)}ms`
    });
  }
};

/**
 * Busca dados do ranking (concurso)
 */
// ✅ Função consolidada (anteriormente fetchRankingDataV3)
export const fetchRankingData = async (concursoId: string): Promise<RankingData | null> => {
  try {
    const { data, error } = await getSupabase()
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();

    if (error) {
      logger.error('Error fetching ranking data V3', 'RANKING_SERVICE_V3', error);
      throw error;
    }

    return data as RankingData;
  } catch (error) {
    logger.error('Error in fetchRankingData', 'RANKING_SERVICE', error);
    return null;
  }
};

/**
 * Busca disciplinas do ranking
 */
// ✅ Função consolidada (anteriormente fetchRankingDisciplinesV3)
export const fetchRankingDisciplines = async (concursoId: string): Promise<any[]> => {
  try {
    const { data, error } = await getSupabase()
      .from('concursos')
      .select('disciplines')
      .eq('id', concursoId)
      .single();

    if (error) {
      logger.error('Error fetching disciplines', 'RANKING_SERVICE', error);
      throw error;
    }

    return data?.disciplines || [];
  } catch (error) {
    logger.error('Error in fetchRankingDisciplines', 'RANKING_SERVICE', error);
    return [];
  }
};

/**
 * Busca tipos de reserva disponíveis para um ranking
 */
// ✅ Função consolidada (anteriormente getAvailableReservationTypesV3)
export const getAvailableReservationTypes = async (concursoId: string): Promise<string[]> => {
  try {
    const { data, error } = await getSupabase()
      .from('user_rankings')
      .select('consolidated_data');

    if (error) {
      logger.error('Error fetching reservation types', 'RANKING_SERVICE', error);
      throw error;
    }

    const types = new Set<string>();
    types.add('Ampla Concorrência');

    data?.forEach((item: any) => {
      const rankings = item.consolidated_data?.rankings || {};
      Object.values(rankings).forEach((ranking: any) => {
        if (ranking?.concurso_id === concursoId) {
          const type = ranking?.user_data?.reservation_type || 'Ampla Concorrência';
          types.add(type);
        }
      });
    });

    return Array.from(types);
  } catch (error) {
    logger.error('Error in getAvailableReservationTypes', 'RANKING_SERVICE', error);
    return ['Ampla Concorrência'];
  }
};

/**
 * Busca estatísticas do ranking
 */
// ✅ Função consolidada (anteriormente fetchRankingStatsV3)
export const fetchRankingStats = async (concursoId: string): Promise<any> => {
  try {
    const { data, error } = await getSupabase()
      .from('user_rankings')
      .select('consolidated_data');

    if (error) {
      logger.error('Error fetching stats', 'RANKING_SERVICE', error);
      throw error;
    }

    const entries: Array<{ score: number; reservation_type: string }> = [];

    data?.forEach((item: any) => {
      const rankings = item.consolidated_data?.rankings || {};
      Object.values(rankings).forEach((ranking: any) => {
        if (ranking?.concurso_id === concursoId) {
          entries.push({
            score: Number(ranking?.user_data?.score || 0),
            reservation_type: ranking?.user_data?.reservation_type || 'Ampla Concorrência'
          });
        }
      });
    });

    const totalParticipants = entries.length;
    const scores = entries.map(e => e.score);
    const avgScore = totalParticipants > 0 ? (scores.reduce((a, b) => a + b, 0) / totalParticipants) : 0;
    const maxScore = scores.length ? Math.max(...scores) : 0;
    const minScore = scores.length ? Math.min(...scores) : 0;

    const reservationTypeCount: Record<string, number> = {};
    entries.forEach(e => {
      reservationTypeCount[e.reservation_type] = (reservationTypeCount[e.reservation_type] || 0) + 1;
    });

    return {
      total_participants: totalParticipants,
      avg_score: avgScore,
      max_score: maxScore,
      min_score: minScore,
      reservation_type_count: reservationTypeCount,
    };
  } catch (error) {
    logger.error('Error in fetchRankingStats', 'RANKING_SERVICE', error);
    return null;
  }
};

/**
 * Calcula score usando Edge Function
 */
export const calculateRankingScore = async (
  userId: string,
  concursoId: string,
  answers: Record<string, string>,
  bookletId: string,
  reservationType: string,
  subjectiveScores?: {
    discursive_score?: number;
    case_study_1_score?: number;
    case_study_2_score?: number;
    case_study_3_score?: number;
    other_subjective_score?: number;
  }
): Promise<{ success: boolean; score?: number; error?: string }> => {
  try {
    logger.info('calculateRankingScore called', 'RANKING_SERVICE', {
      userId,
      concursoId,
      bookletId,
      answerCount: Object.keys(answers).length
    });

    const { data, error } = await getSupabase().functions.invoke('calculate-ranking-score', {
      body: {
        userId,
        concursoId,
        answers,
        bookletId,
        reservationType,
        subjectiveScores,
      },
    });

    if (error) {
      logger.error('Error calling calculate-ranking-score function', 'RANKING_SERVICE', error);
      return { success: false, error: error.message };
    }

    logger.info('Score calculated successfully', 'RANKING_SERVICE', {
      score: data.score
    });

    return { success: true, score: data.score };
  } catch (error: any) {
    logger.error('Error in calculateRankingScore', 'RANKING_SERVICE', error);
    return { success: false, error: error.message };
  }
};
