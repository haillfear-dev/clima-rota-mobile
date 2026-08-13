import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Alert, Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { RouteIllustration } from './Illustrations';

const items = [
  ['home', 'Início'], ['location', 'Meus lugares'], ['star', 'Rotas favoritas'],
  ['settings', 'Configurações'], ['notifications', 'Notificações'],
  ['chatbox-ellipses', 'Sugestões e reportar bugs'],
  ['information-circle', 'Sobre o Vora'], ['help-circle', 'Ajuda'],
] as const;

export function SideMenu({ visible, onClose, onNavigate, onFeedback }: { visible: boolean; onClose: () => void; onNavigate: (section: string) => void; onFeedback: () => void }) {
  const width = Math.min(Dimensions.get('window').width * .84, 340);
  const translateX = useRef(new Animated.Value(width)).current;
  useEffect(() => {
    if (visible) translateX.setValue(width);
    Animated.timing(translateX, { toValue: visible ? 0 : width, duration: 260, useNativeDriver: true }).start();
  }, [translateX, visible, width]);
  const choose = (label: string) => {
    if (label === 'Sugestões e reportar bugs') onFeedback();
    else if (['Início', 'Meus lugares', 'Rotas favoritas'].includes(label)) onNavigate(label);
    else Alert.alert(label, 'Esta área estará disponível em uma próxima atualização.');
    onClose();
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <View style={styles.overlay}><Pressable style={styles.dismiss} onPress={onClose}/><Animated.View style={[styles.drawer, { width, transform: [{ translateX }] }]}>
      <Pressable accessibilityLabel="Fechar menu" hitSlop={12} style={styles.close} onPress={onClose}><Ionicons name="close" size={30} color="#fff"/></Pressable>
      <View style={styles.avatar}><RouteIllustration scene="beach"/></View><Text style={styles.profile}>Viajante</Text><Text style={styles.profileLink}>Seu caminho, seu clima</Text>
      <View style={styles.menu}>{items.map(([icon, label], index) => <Pressable key={label} style={[styles.item, index === 0 && styles.active]} onPress={() => choose(label)}><Ionicons name={icon} size={23} color="#fff"/><Text style={styles.label}>{label}</Text></Pressable>)}</View>
      <Pressable style={styles.logout} onPress={() => choose('Sair')}><Ionicons name="log-out-outline" size={24} color="#fff"/><Text style={styles.label}>Sair</Text></Pressable>
    </Animated.View></View>
  </Modal>;
}
const styles = StyleSheet.create({ overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(2,35,37,.38)' }, dismiss: { flex: 1 }, drawer: { backgroundColor: colors.primary, paddingTop: 58, paddingHorizontal: spacing.lg, paddingBottom: 30, shadowColor: '#000', shadowOpacity: .25, shadowRadius: 18, elevation: 20 }, close: { position: 'absolute', right: 18, top: 18 }, avatar: { width: 84, height: 84, borderRadius: 42, alignSelf: 'center', overflow: 'hidden', backgroundColor: '#BDE8E7', borderWidth: 3, borderColor: '#fff' }, profile: { color: '#fff', textAlign: 'center', fontWeight: '900', fontSize: 22, marginTop: spacing.sm }, profileLink: { color: '#CBE3DF', textAlign: 'center', marginTop: 3 }, menu: { marginTop: spacing.xl, gap: 5, flex: 1 }, item: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, paddingHorizontal: spacing.md, gap: spacing.md }, active: { backgroundColor: 'rgba(255,255,255,.18)' }, label: { color: '#fff', fontSize: 15, fontWeight: '700' }, logout: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: 'rgba(0,25,26,.28)' } });
