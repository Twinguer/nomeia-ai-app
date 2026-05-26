import React from 'react';

import { StyleSheet, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';



import { UserMenu } from '@/components/UserMenu';

import { useAppTheme } from '@/contexts/AppThemeContext';



export function AppHeader() {

  const { colors } = useAppTheme();

  const insets = useSafeAreaInsets();



  return (

    <View

      style={[

        styles.bar,

        {

          borderBottomColor: colors.border,

          backgroundColor: colors.surface,

          paddingTop: insets.top + 10,

        },

      ]}>

      <UserMenu />

    </View>

  );

}



const styles = StyleSheet.create({

  bar: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 16,

    paddingBottom: 10,

    borderBottomWidth: StyleSheet.hairlineWidth,

  },

});


