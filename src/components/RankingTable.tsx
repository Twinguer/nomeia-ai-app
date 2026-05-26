import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { userInitials } from '@/components/UserAvatar';
import { useAppTheme } from '@/contexts/AppThemeContext';
import type { Ranking } from '@/services/rankingService';
import type { ConcursoDetail } from '@/types/ranking';
import { getQuotaTagForName, type QuotaTabKey } from '@/utils/rankingDisplay';
import {
  buildDisciplineColumns,
  formatColumnScore,
  scoresSectionWidth,
  type DisciplineColumn,
} from '@/utils/rankingDisciplines';

const PARTICIPANT_W = 168;
const POS_W = 36;

type RowRanking = Ranking & { quotaPosition: number; eliminated: boolean };

type Props = {
  rankings: RowRanking[];
  concurso: ConcursoDetail | null | undefined;
  activeTab: QuotaTabKey;
  highlightUserId?: string;
  listHeader?: React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
};

function fixedColumnsWidth(isAmpla: boolean): number {
  return (isAmpla ? POS_W : POS_W * 2) + PARTICIPANT_W;
}

function RowAvatar({
  name,
  avatarUrl,
  colors,
}: {
  name: string;
  avatarUrl?: string | null;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={styles.rowAvatar} contentFit="cover" />;
  }
  return (
    <View style={[styles.rowAvatarFallback, { backgroundColor: colors.border }]}>
      <Text style={[styles.rowAvatarText, { color: colors.textMuted }]}>{userInitials(name)}</Text>
    </View>
  );
}

function ScoresCells({
  entry,
  columns,
  colors,
}: {
  entry: RowRanking;
  columns: DisciplineColumn[];
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const eliminated = entry.eliminated;
  const red = colors.danger;

  return (
    <>
      {columns.map((col) => {
        const below = col.isBelowMinimum(entry);
        const color = eliminated || below ? red : colors.text;
        return (
          <View key={col.key} style={[styles.scoreCell, { width: col.width }]}>
            <Text style={[styles.scoreText, { color }]} numberOfLines={1}>
              {formatColumnScore(col.getScore(entry))}
            </Text>
          </View>
        );
      })}
    </>
  );
}

function TableHeaderRow({
  columns,
  activeTab,
  colors,
  tableWidth,
}: {
  columns: DisciplineColumn[];
  activeTab: QuotaTabKey;
  colors: ReturnType<typeof useAppTheme>['colors'];
  tableWidth: number;
}) {
  const isAmpla = activeTab === 'ac';

  return (
    <View
      style={[
        styles.fullRow,
        styles.headerRow,
        { width: tableWidth, backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <Text style={[styles.headerCell, { width: POS_W, color: colors.textMuted }]}>ac</Text>
      {!isAmpla ? (
        <Text style={[styles.headerCell, { width: POS_W, color: colors.textMuted }]}>
          {activeTab}
        </Text>
      ) : null}
      <Text
        style={[
          styles.headerCell,
          { width: PARTICIPANT_W, color: colors.textMuted, textAlign: 'left', paddingLeft: 4 },
        ]}>
        part
      </Text>
      {columns.map((col) => (
        <View key={col.key} style={[styles.scoreCell, { width: col.width }]}>
          <Text style={[styles.headerScore, { color: colors.textMuted }]} numberOfLines={1}>
            {col.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TableDataRow({
  entry,
  columns,
  activeTab,
  highlight,
  colors,
  tableWidth,
}: {
  entry: RowRanking;
  columns: DisciplineColumn[];
  activeTab: QuotaTabKey;
  highlight?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
  tableWidth: number;
}) {
  const eliminated = entry.eliminated;
  const red = colors.danger;
  const textColor = eliminated ? red : colors.text;
  const isAmpla = activeTab === 'ac';
  const quotaTag = getQuotaTagForName(entry.reservationType, isAmpla);

  const colAc = eliminated ? 'E' : entry.position > 0 ? `${entry.position}º` : '—';
  const colQuota = eliminated
    ? 'E'
    : entry.quotaPosition > 0
      ? `${entry.quotaPosition}º`
      : '—';

  return (
    <View
      style={[
        styles.fullRow,
        styles.dataRow,
        {
          width: tableWidth,
          backgroundColor: highlight && !eliminated ? colors.primaryLight : colors.surface,
          borderBottomColor: colors.border,
        },
      ]}>
      <Text style={[styles.posText, { width: POS_W, color: eliminated ? red : textColor }]}>
        {colAc}
      </Text>
      {!isAmpla ? (
        <Text style={[styles.posText, { width: POS_W, color: eliminated ? red : textColor }]}>
          {colQuota}
        </Text>
      ) : null}
      <View style={[styles.participant, { width: PARTICIPANT_W }]}>
        <RowAvatar name={entry.name} avatarUrl={entry.avatarUrl} colors={colors} />
        <Text style={[styles.nameText, { color: textColor }]} numberOfLines={2}>
          {entry.name}
          {quotaTag ? (
            <Text style={[styles.quotaTag, { color: eliminated ? red : colors.primaryDark }]}>
              {' '}
              {quotaTag}
            </Text>
          ) : null}
        </Text>
      </View>
      <ScoresCells entry={entry} columns={columns} colors={colors} />
    </View>
  );
}

export function RankingTable({
  rankings,
  concurso,
  activeTab,
  highlightUserId,
  listHeader,
  refreshing,
  onRefresh,
}: Props) {
  const { colors } = useAppTheme();
  const columns = useMemo(() => buildDisciplineColumns(concurso), [concurso]);
  const isAmpla = activeTab === 'ac';
  const tableWidth = useMemo(() => {
    const screenW = Dimensions.get('window').width;
    const w = fixedColumnsWidth(isAmpla) + scoresSectionWidth(columns);
    return Math.max(screenW, w);
  }, [columns, isAmpla]);

  const headerBlock = (
    <>
      {listHeader}
      <TableHeaderRow columns={columns} activeTab={activeTab} colors={colors} tableWidth={tableWidth} />
    </>
  );

  const rows = rankings.map((item) => (
    <TableDataRow
      key={item.id}
      entry={item}
      columns={columns}
      activeTab={activeTab}
      highlight={item.userId === highlightUserId}
      colors={colors}
      tableWidth={tableWidth}
    />
  ));

  /** No web, FlatList dentro de ScrollView horizontal costuma colapsar e esconder as colunas. */
  if (Platform.OS === 'web') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={styles.outerHorizontalWeb}
        contentContainerStyle={styles.webHorizontalContent}>
        <View style={{ width: tableWidth }}>
          {headerBlock}
          {rows.length > 0 ? (
            rows
          ) : (
            <Text style={[styles.empty, { color: colors.textMuted, width: tableWidth }]}>
              Nenhum participante neste filtro.
            </Text>
          )}
        </View>
      </ScrollView>
    );
  }

  const nativeHeader = (
    <View style={{ width: tableWidth }}>
      {headerBlock}
    </View>
  );

  return (
    <ScrollView
      horizontal
      bounces
      showsHorizontalScrollIndicator
      style={styles.outerHorizontal}
      contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ width: tableWidth, flex: 1, minHeight: 0 }}>
        <FlatList
          data={rankings}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={nativeHeader}
          renderItem={({ item }) => (
            <TableDataRow
              entry={item}
              columns={columns}
              activeTab={activeTab}
              highlight={item.userId === highlightUserId}
              colors={colors}
              tableWidth={tableWidth}
            />
          )}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            ) : undefined
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted, width: tableWidth }]}>
              Nenhum participante neste filtro.
            </Text>
          }
          contentContainerStyle={rankings.length === 0 ? styles.listEmpty : styles.listContent}
          style={{ backgroundColor: colors.background, flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerHorizontal: { flex: 1, minHeight: 0 },
  outerHorizontalWeb: {
    flex: 1,
    width: '100%',
  },
  webHorizontalContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  fullRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'lowercase',
    textAlign: 'center',
  },
  headerScore: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  dataRow: {
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  posText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
  },
  rowAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  rowAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarText: { fontSize: 10, fontWeight: '600' },
  nameText: { flex: 1, fontSize: 13, lineHeight: 17 },
  quotaTag: { fontSize: 13, fontWeight: '600' },
  scoreCell: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  listContent: { paddingBottom: 24 },
  listEmpty: { flexGrow: 1, paddingBottom: 24 },
  empty: {
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
    fontSize: 15,
  },
});
