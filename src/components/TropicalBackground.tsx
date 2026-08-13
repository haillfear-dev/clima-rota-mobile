import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

import { BeachFooterArt, TropicalHeroArt } from './Illustrations';

export function TropicalHero({ children }: { children: ReactNode }) {
  return <View style={styles.hero}><TropicalHeroArt/>{children}</View>;
}

export function BeachFooter() {
  return <View style={styles.footer}><BeachFooterArt/><Text style={styles.footerText}>Vora · informações para decidir antes de navegar</Text></View>;
}

const styles = StyleSheet.create({
  hero: { height: 490, width: '100%', overflow: 'hidden', backgroundColor: colors.background },
  footer: { height: 245, marginHorizontal: -16, marginBottom: -60, marginTop: -8, justifyContent: 'flex-end', alignItems: 'center' },
  footerText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700', marginBottom: 42, paddingHorizontal: 80, textAlign: 'center' },
});
