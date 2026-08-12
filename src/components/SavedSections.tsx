import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { FavoriteRoute, SavedPlace, SavedPlaceLabel } from '../types';
import { Card } from './Ui';

export function SavedPlacesSection({ places, onPress, onDelete }: { places: SavedPlace[]; onPress: (label: SavedPlaceLabel) => void; onDelete: (label: SavedPlaceLabel) => void }) {
  return <Card><Text style={styles.heading}>Meus lugares</Text><View style={styles.row}>{(['Casa', 'Trabalho'] as const).map((label) => { const place = places.find((item) => item.label === label); return <Pressable key={label} style={styles.place} onPress={() => onPress(label)}><View style={styles.icon}><Ionicons name={label === 'Casa' ? 'home-outline' : 'briefcase-outline'} size={21} color={colors.primary} /></View><View style={styles.copy}><Text style={styles.itemTitle}>{label}</Text><Text numberOfLines={2} style={styles.itemSubtitle}>{place?.name ?? `Salvar ${label.toLowerCase()}`}</Text></View>{place && <Pressable hitSlop={12} onPress={() => onDelete(label)}><Ionicons name="trash-outline" size={18} color={colors.muted} /></Pressable>}</Pressable>})}</View></Card>;
}

export function FavoriteRoutesSection({ routes, onPress, onDelete }: { routes: FavoriteRoute[]; onPress: (route: FavoriteRoute) => void; onDelete: (id: string) => void }) {
  return <Card><Text style={styles.heading}>Rotas favoritas</Text>{routes.length === 0 ? <View style={styles.empty}><Ionicons name="heart-outline" size={23} color={colors.muted}/><Text style={styles.itemSubtitle}>As rotas que você salvar aparecerão aqui.</Text></View> : routes.map((route) => <Pressable key={route.id} style={styles.route} onPress={() => onPress(route)}><View style={styles.copy}><Text style={styles.itemTitle}>{route.name || `${short(route.origin.name)} → ${short(route.destination.name)}`}</Text><Text numberOfLines={1} style={styles.itemSubtitle}>{short(route.origin.name)} → {short(route.destination.name)}</Text></View><Pressable hitSlop={12} onPress={() => onDelete(route.id)}><Ionicons name="trash-outline" size={18} color={colors.muted}/></Pressable></Pressable>)}</Card>;
}

const short = (name: string) => name.split(',').slice(0, 2).join(',');
const styles = StyleSheet.create({ heading: { fontSize: 18, fontWeight: '900', color: colors.text }, row: { gap: spacing.sm }, place: { flexDirection: 'row', minHeight: 62, alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.input, gap: spacing.sm }, icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight }, copy: { flex: 1 }, itemTitle: { color: colors.text, fontWeight: '800', fontSize: 14 }, itemSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 }, empty: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm }, route: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: spacing.sm } });
