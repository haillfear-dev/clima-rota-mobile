import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function TropicalBackground() {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={styles.sun}/><Text style={styles.leaves}>🌿</Text><View style={styles.cloud}/><View style={[styles.cloud, styles.cloud2]}/>
    <View style={styles.sea}/><View style={styles.sand}/><Text style={styles.beach}>⛱️</Text>
  </View>;
}
const styles = StyleSheet.create({ sun: { position: 'absolute', top: 112, right: 50, width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFD562', opacity: .72 }, leaves: { position: 'absolute', fontSize: 96, top: -22, right: -27, transform: [{ rotate: '-28deg' }], opacity: .45 }, cloud: { position: 'absolute', top: 185, left: -30, width: 125, height: 32, borderRadius: 30, backgroundColor: 'rgba(255,252,238,.48)' }, cloud2: { top: 255, left: undefined, right: -35, width: 155 }, sea: { position: 'absolute', top: 330, left: 0, right: 0, height: 54, backgroundColor: '#65C8C4', opacity: .27 }, sand: { position: 'absolute', top: 376, left: 0, right: 0, bottom: 0, backgroundColor: colors.sand, opacity: .55 }, beach: { position: 'absolute', right: -18, bottom: 20, fontSize: 92, opacity: .2 } });
