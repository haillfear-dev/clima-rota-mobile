import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { TravelMode } from '../types';

const modes: Array<{ mode: TravelMode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { mode: 'driving', label: 'Carro', icon: 'car' }, { mode: 'transit', label: 'Transporte público', icon: 'bus' },
  { mode: 'walking', label: 'A pé', icon: 'walk' }, { mode: 'bicycling', label: 'Bicicleta', icon: 'bicycle' },
];
export function TravelModeSelector({ value, onChange }: { value: TravelMode; onChange: (mode: TravelMode) => void }) {
  return <View><Text style={styles.heading}>Como você vai?</Text><View style={styles.grid}>{modes.map(({ mode, label, icon }) => { const selected = value === mode; return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} key={mode} onPress={() => onChange(mode)} style={[styles.option, selected && styles.selected]}><Ionicons name={icon} size={20} color={selected ? '#fff' : colors.primary}/><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.8} style={[styles.label, selected && styles.selectedLabel]}>{label}</Text></Pressable>; })}</View></View>;
}
const styles=StyleSheet.create({heading:{fontSize:14,fontWeight:'800',color:colors.text,marginBottom:spacing.sm},grid:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},option:{width:'48%',minHeight:46,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.input,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingHorizontal:8},selected:{backgroundColor:colors.primary,borderColor:colors.primary},label:{fontSize:11,fontWeight:'800',color:colors.text,flexShrink:1},selectedLabel:{color:'#fff'}});
