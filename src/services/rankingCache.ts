export const rankingCache = {
  getRankings: (
    _concursoId: string,
    _page?: number,
    _limit?: number,
    _reservationType?: string
  ) => null as unknown[] | null,
  setRankings: (
    _concursoId: string,
    _rankings: unknown[],
    _page?: number,
    _limit?: number,
    _reservationType?: string
  ) => {},
};
