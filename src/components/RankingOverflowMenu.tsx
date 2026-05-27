import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import {
  ScreenOverflowMenu,
  type OverflowMenuItem,
} from '@/components/ScreenOverflowMenu';
import { useAuth } from '@/contexts/AuthContext';
import { checkParticipation, leaveRanking } from '@/services/participationService';

type Props = {
  concursoId: string;
  concursoTitle?: string;
};

export function RankingOverflowMenu({ concursoId, concursoTitle }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [leaving, setLeaving] = useState(false);

  const participationQuery = useQuery({
    queryKey: ['participation', concursoId, user?.id],
    queryFn: () => checkParticipation(concursoId, user!.id),
    enabled: !!user?.id && !!concursoId,
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveRanking(concursoId, user!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['participation', concursoId] });
      await queryClient.invalidateQueries({ queryKey: ['rankings', concursoId] });
      await queryClient.invalidateQueries({ queryKey: ['ranking-stats', concursoId] });
      await queryClient.invalidateQueries({ queryKey: ['rankings-home'] });
      await queryClient.invalidateQueries({ queryKey: ['concurso-detail', concursoId] });
      Alert.alert('Sucesso', 'Você saiu deste ranking.');
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
    onSettled: () => setLeaving(false),
  });

  const { isParticipating, isCreator } = participationQuery.data ?? {
    isParticipating: false,
    isCreator: false,
  };

  const openGabarito = () => {
    router.push({
      pathname: '/participar',
      params: { concursoId, title: concursoTitle ?? 'Gabarito' },
    });
  };

  const confirmLeave = () => {
    const message = isCreator
      ? 'Você criou este ranking. Ao sair, sua participação será removida da classificação, mas o ranking continuará disponível para os demais.'
      : 'Tem certeza que deseja sair deste ranking? Seus dados de participação serão removidos.';

    Alert.alert('Deixar ranking', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          setLeaving(true);
          leaveMutation.mutate();
        },
      },
    ]);
  };

  const items = useMemo((): OverflowMenuItem[] => {
    if (!user || participationQuery.isLoading) return [];

    const list: OverflowMenuItem[] = [];

    if (isParticipating) {
      list.push({
        id: 'gabarito',
        label: 'Editar gabarito',
        icon: 'create-outline',
        onPress: openGabarito,
      });
      list.push({
        id: 'leave',
        label: 'Deixar ranking',
        icon: 'exit-outline',
        onPress: confirmLeave,
        danger: true,
        loading: leaving || leaveMutation.isPending,
      });
    } else {
      list.push({
        id: 'participar',
        label: 'Participar',
        icon: 'person-add-outline',
        onPress: openGabarito,
      });
    }

    return list;
  }, [
    user,
    isParticipating,
    isCreator,
    participationQuery.isLoading,
    leaving,
    leaveMutation.isPending,
    concursoId,
    concursoTitle,
  ]);

  if (!user || items.length === 0) return null;

  return <ScreenOverflowMenu items={items} />;
}
