import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddressAutocomplete } from './src/components/AddressAutocomplete';
import { FavoriteRoutesSection, SavedPlacesSection } from './src/components/SavedSections';
import { TripSummary } from './src/components/TripSummary';
import { SideMenu } from './src/components/SideMenu';
import { TropicalBackground } from './src/components/TropicalBackground';
import { Button, Card } from './src/components/Ui';
import { favoriteRoutesService } from './src/services/favoriteRoutes';
import { savedPlacesService } from './src/services/savedPlaces';
import { getCurrentWeather } from './src/services/weather';
import { colors, spacing } from './src/theme';
import type { FavoriteRoute, Place, SavedPlace, SavedPlaceLabel, Trip } from './src/types';
import { haversineKm } from './src/utils/distance';
import { shortAddress } from './src/utils/address';

type Field = 'origin' | 'destination';

export default function App() {
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [origin, setOrigin] = useState<Place>();
  const [destination, setDestination] = useState<Place>();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [routes, setRoutes] = useState<FavoriteRoute[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [tripLoading, setTripLoading] = useState(false);
  const [trip, setTrip] = useState<Trip>();
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { void refreshSaved(); }, []);
  async function refreshSaved() {
    const [savedPlaces, favoriteRoutes] = await Promise.all([savedPlacesService.list(), favoriteRoutesService.list()]);
    setPlaces(savedPlaces); setRoutes(favoriteRoutes);
  }
  function setField(field: Field, place: Place) {
    if (field === 'origin') { setOrigin(place); setOriginText(shortAddress(place.name)); }
    else { setDestination(place); setDestinationText(shortAddress(place.name)); }
    setTrip(undefined);
  }
  async function useLocation(field: Field = 'origin') {
    setLocationLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { Alert.alert('Localização não permitida', 'Sem problemas: pesquise seu endereço manualmente.'); return; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setField(field, { name: 'Minha localização atual', latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch { Alert.alert('Localização indisponível', 'Não conseguimos obter sua localização. Digite a origem manualmente.'); }
    finally { setLocationLoading(false); }
  }
  async function prepareWith(from = origin, to = destination) {
    if (!from || !to) { Alert.alert('Selecione os endereços', 'Escolha uma sugestão válida para origem e destino.'); return; }
    setTripLoading(true);
    try {
      const [originWeather, destinationWeather] = await Promise.all([getCurrentWeather(from), getCurrentWeather(to)]);
      setTrip({ origin: from, destination: to, distanceKm: haversineKm(from, to), originWeather, destinationWeather });
    } catch (error) { Alert.alert('Não foi possível preparar a viagem', error instanceof Error ? error.message : 'Tente novamente em instantes.'); }
    finally { setTripLoading(false); }
  }
  function savedPlaceAction(label: SavedPlaceLabel) {
    const saved = places.find((item) => item.label === label);
    if (saved) {
      Alert.alert(label, saved.name, [
        { text: 'Usar como origem', onPress: () => setField('origin', saved) },
        { text: 'Usar como destino', onPress: () => setField('destination', saved) },
        { text: 'Alterar', onPress: () => choosePlaceToSave(label) }, { text: 'Cancelar', style: 'cancel' },
      ]);
    } else choosePlaceToSave(label);
  }
  function choosePlaceToSave(label: SavedPlaceLabel) {
    const choices = [
      origin && { text: 'Salvar origem atual', onPress: () => void savePlace(label, origin) },
      destination && { text: 'Salvar destino atual', onPress: () => void savePlace(label, destination) },
      { text: 'Cancelar', style: 'cancel' as const },
    ].filter(Boolean) as { text: string; onPress?: () => void; style?: 'cancel' }[];
    if (choices.length === 1) { Alert.alert(`Salvar ${label}`, 'Primeiro selecione uma origem ou um destino.'); return; }
    Alert.alert(`Salvar ${label}`, 'Qual endereço selecionado deseja guardar?', choices);
  }
  async function savePlace(label: SavedPlaceLabel, place: Place) {
    await savedPlacesService.save({ ...place, label }); await refreshSaved();
  }
  async function toggleRoute() {
    if (!trip) return;
    const existing = routes.find((route) => sameTrip(route, trip));
    if (existing) { await favoriteRoutesService.remove(existing.id); await refreshSaved(); return; }
    await favoriteRoutesService.save({ id: `${Date.now()}`, origin: trip.origin, destination: trip.destination, createdAt: new Date().toISOString() });
    await refreshSaved(); Alert.alert('Rota salva', 'Esta viagem agora está nas suas rotas favoritas.');
  }
  async function openRoute(route: FavoriteRoute) {
    setField('origin', route.origin); setField('destination', route.destination); await prepareWith(route.origin, route.destination);
  }

  const isFavorite = !!trip && routes.some((route) => sameTrip(route, trip));
  return <SafeAreaView style={styles.safe}><StatusBar style="dark"/><TropicalBackground/><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <View style={styles.brand}><View><Text style={styles.logo}>Vora<Text style={styles.dot}>.</Text></Text><Text style={styles.tagline}>Saiba antes de sair.</Text></View><Pressable accessibilityLabel="Abrir menu" style={styles.menuButton} onPress={() => setMenuOpen(true)}><Ionicons name="menu" size={29} color={colors.primary}/></Pressable></View>
    <View style={styles.hero}><Text style={styles.title}>Para onde{`\n`}você vai?</Text><Text style={styles.subtitle}>Prepare seu deslocamento{`\n`}em poucos segundos.</Text></View>
    <Card>
      <View style={styles.shortcuts}>
        <Shortcut icon="locate-outline" label="Localização" loading={locationLoading} onPress={() => void useLocation()}/>
        <Shortcut icon="home-outline" label="Casa" onPress={() => savedPlaceAction('Casa')}/>
        <Shortcut icon="briefcase-outline" label="Trabalho" onPress={() => savedPlaceAction('Trabalho')}/>
      </View>
      <AddressAutocomplete variant="origin" label="Origem" placeholder="Rua, endereço ou lugar" value={originText} onChangeText={(text) => { setOriginText(text); setOrigin(undefined); }} onSelect={(place) => setField('origin', place)}/>
      <AddressAutocomplete variant="destination" label="Destino" placeholder="Para onde vamos?" value={destinationText} onChangeText={(text) => { setDestinationText(text); setDestination(undefined); }} onSelect={(place) => setField('destination', place)}/>
      <Button title="Preparar viagem" icon="arrow-forward" loading={tripLoading} onPress={() => void prepareWith()}/>
    </Card>
    {trip && <TripSummary trip={trip} isFavorite={isFavorite} onSave={() => void toggleRoute()}/>}
    <SavedPlacesSection places={places} onPress={savedPlaceAction} onDelete={(label) => void savedPlacesService.remove(label).then(refreshSaved)}/>
    <FavoriteRoutesSection routes={routes} onPress={(route) => void openRoute(route)} onDelete={(id) => void favoriteRoutesService.remove(id).then(refreshSaved)}/>
    <Text style={styles.footer}>Vora · informações para decidir antes de navegar</Text>
  </ScrollView></KeyboardAvoidingView><SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={(section) => scrollRef.current?.scrollTo({ y: section === 'Início' ? 0 : section === 'Meus lugares' ? 1150 : 1500, animated: true })}/></SafeAreaView>;
}

function sameTrip(route: FavoriteRoute, trip: Trip) { return route.origin.latitude === trip.origin.latitude && route.origin.longitude === trip.origin.longitude && route.destination.latitude === trip.destination.latitude && route.destination.longitude === trip.destination.longitude; }

function Shortcut({ icon, label, onPress, loading }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; loading?: boolean }) {
  const tint = label === 'Casa' ? colors.orange : label === 'Trabalho' ? colors.blue : colors.turquoise;
  return <Pressable style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.7 }]} onPress={onPress} disabled={loading}><View style={[styles.shortcutIcon, { backgroundColor: `${tint}18` }]}><Ionicons name={icon} size={25} color={tint}/></View><Text style={styles.shortcutText}>{loading ? 'Buscando…' : label}</Text></Pressable>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? 22 : 0 }, flex: { flex: 1 }, content: { padding: spacing.md, paddingTop: spacing.lg, paddingBottom: 60, gap: spacing.lg, maxWidth: 680, width: '100%', alignSelf: 'center' }, brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, logo: { fontSize: 40, fontWeight: '900', letterSpacing: -2, color: colors.primary }, dot: { color: colors.orange }, tagline: { color: colors.text, fontSize: 14, fontWeight: '700' }, menuButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#765218', shadowOpacity: .12, shadowRadius: 9, elevation: 3 }, hero: { minHeight: 235, justifyContent: 'center' }, title: { fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1, color: colors.text }, subtitle: { fontSize: 16, lineHeight: 23, color: colors.text, fontWeight: '600', marginTop: spacing.md }, shortcuts: { flexDirection: 'row', gap: spacing.sm }, shortcut: { flex: 1, minWidth: 0, minHeight: 88, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 3 }, shortcutIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, shortcutText: { fontSize: 11, fontWeight: '800', color: colors.text, textAlign: 'center' }, footer: { textAlign: 'center', fontSize: 12, color: colors.muted } });
