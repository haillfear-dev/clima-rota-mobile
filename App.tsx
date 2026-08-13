import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AddressAutocomplete } from './src/components/AddressAutocomplete';
import { FavoriteRoutesSection, SavedPlacesSection } from './src/components/SavedSections';
import { TravelModeSelector } from './src/components/TravelModeSelector';
import { FeedbackModal } from './src/components/FeedbackModal';
import { TripSummary } from './src/components/TripSummary';
import { SideMenu } from './src/components/SideMenu';
import { BeachFooter, TropicalHero } from './src/components/TropicalBackground';
import { Button, Card } from './src/components/Ui';
import { favoriteRoutesService } from './src/services/favoriteRoutes';
import { savedPlacesService } from './src/services/savedPlaces';
import { getCurrentWeather } from './src/services/weather';
import { coordinatesToPlace } from './src/services/geocoding';
import { routingService } from './src/services/routing';
import { colors, spacing } from './src/theme';
import type { FavoriteRoute, Place, SavedPlace, SavedPlaceLabel, TravelMode, Trip } from './src/types';
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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [deviceLocation, setDeviceLocation] = useState<Place>();
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  useEffect(() => { void refreshSaved(); }, []);
  async function refreshSaved() {
    const [savedPlaces, favoriteRoutes] = await Promise.all([savedPlacesService.list(), favoriteRoutesService.list()]);
    setPlaces(savedPlaces); setRoutes(favoriteRoutes);
  }
  function setField(field: Field, place: Place) {
    if (field === 'origin') { setOrigin(place); setOriginText(shortAddress(place)); }
    else { setDestination(place); setDestinationText(shortAddress(place)); }
    setTrip(undefined);
  }
  async function useLocation(field: Field = 'origin') {
    setLocationLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { Alert.alert('Localização não permitida', 'Sem problemas: pesquise seu endereço manualmente.'); return; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const place = await coordinatesToPlace(position.coords.latitude, position.coords.longitude);
      setDeviceLocation(place); setField(field, place);
    } catch { Alert.alert('Localização indisponível', 'Não conseguimos obter sua localização. Digite a origem manualmente.'); }
    finally { setLocationLoading(false); }
  }
  async function prepareWith(from = origin, to = destination) {
    if (!from || !to) { Alert.alert('Selecione os endereços', 'Escolha uma sugestão válida para origem e destino.'); return; }
    setTripLoading(true);
    try {
      const [originWeather, destinationWeather, routeEstimate] = await Promise.all([getCurrentWeather(from), getCurrentWeather(to), routingService.estimate(from, to, travelMode)]);
      setTrip({ origin: from, destination: to, routeEstimate, mode: travelMode, originWeather, destinationWeather });
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
  return <SafeAreaView style={styles.safe}><StatusBar style="dark"/><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
    <TropicalHero><View style={styles.heroContent}><View style={styles.brand}><View><Text style={styles.logo}>Vora<Text style={styles.dot}>.</Text></Text><Text style={styles.tagline}>Saiba antes de sair.</Text></View><Pressable accessibilityLabel="Abrir menu" style={styles.menuButton} onPress={() => setMenuOpen(true)}><Ionicons name="menu" size={29} color={colors.primary}/></Pressable></View><View style={styles.heroCopy}><Text style={styles.title}>Para onde{`\n`}você vai?</Text><Text style={styles.subtitle}>Prepare seu deslocamento{`\n`}em poucos segundos.</Text></View></View></TropicalHero>
    <View style={styles.content}><Card style={styles.searchCard}>
      <View style={styles.shortcuts}>
        <Shortcut icon="locate-outline" label="Localização" loading={locationLoading} onPress={() => void useLocation()}/>
        <Shortcut icon="home-outline" label="Casa" onPress={() => savedPlaceAction('Casa')}/>
        <Shortcut icon="briefcase-outline" label="Trabalho" onPress={() => savedPlaceAction('Trabalho')}/>
      </View>
      <AddressAutocomplete proximity={deviceLocation} variant="origin" label="Origem" placeholder="Rua, endereço ou lugar" value={originText} onClear={() => { setOriginText(''); setOrigin(undefined); setTrip(undefined); }} onChangeText={(text) => { setOriginText(text); setOrigin(undefined); }} onSelect={(place) => setField('origin', place)}/>
      <AddressAutocomplete proximity={deviceLocation} variant="destination" label="Destino" placeholder="Para onde vamos?" value={destinationText} onClear={() => { setDestinationText(''); setDestination(undefined); setTrip(undefined); }} onChangeText={(text) => { setDestinationText(text); setDestination(undefined); }} onSelect={(place) => setField('destination', place)}/>
      <TravelModeSelector value={travelMode} onChange={(mode) => { setTravelMode(mode); setTrip(undefined); }}/>
      <Button title="Preparar viagem" icon="arrow-forward" loading={tripLoading} onPress={() => void prepareWith()}/>
    </Card>
    {trip && <TripSummary trip={trip} isFavorite={isFavorite} onSave={() => void toggleRoute()}/>}
    <View style={[styles.savedGrid, width < 560 && styles.savedGridNarrow]}><View style={styles.placesColumn}><SavedPlacesSection places={places} onPress={savedPlaceAction} onDelete={(label) => void savedPlacesService.remove(label).then(refreshSaved)}/></View><View style={styles.routesColumn}><FavoriteRoutesSection routes={routes} onPress={(route) => void openRoute(route)} onDelete={(id) => void favoriteRoutesService.remove(id).then(refreshSaved)}/></View></View>
    <BeachFooter/></View>
  </ScrollView></KeyboardAvoidingView><SideMenu visible={menuOpen} onFeedback={() => setFeedbackOpen(true)} onClose={() => setMenuOpen(false)} onNavigate={(section) => scrollRef.current?.scrollTo({ y: section === 'Início' ? 0 : section === 'Meus lugares' ? 1200 : 1450, animated: true })}/><FeedbackModal visible={feedbackOpen} onClose={() => setFeedbackOpen(false)}/></SafeAreaView>;
}

function sameTrip(route: FavoriteRoute, trip: Trip) { return route.origin.latitude === trip.origin.latitude && route.origin.longitude === trip.origin.longitude && route.destination.latitude === trip.destination.latitude && route.destination.longitude === trip.destination.longitude; }

function Shortcut({ icon, label, onPress, loading }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; loading?: boolean }) {
  const tint = label === 'Casa' ? colors.orange : label === 'Trabalho' ? colors.blue : colors.turquoise;
  return <Pressable style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.7 }]} onPress={onPress} disabled={loading}><View style={[styles.shortcutIcon, { backgroundColor: `${tint}18` }]}><Ionicons name={icon} size={25} color={tint}/></View><Text style={styles.shortcutText}>{loading ? 'Buscando…' : label}</Text></Pressable>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? 22 : 0 }, flex: { flex: 1 }, scroll: { backgroundColor: colors.background }, content: { paddingHorizontal: spacing.md, paddingBottom: 60, gap: spacing.sm, maxWidth: 760, width: '100%', alignSelf: 'center' }, heroContent: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 68 }, brand: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, logo: { fontSize: 45, lineHeight: 49, fontWeight: '900', letterSpacing: -2.5, color: colors.primary }, dot: { color: colors.orange }, tagline: { color: colors.text, fontSize: 15, fontWeight: '800' }, menuButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#765218', shadowOpacity: .16, shadowRadius: 9, elevation: 4 }, heroCopy: { marginTop: 72, maxWidth: 300 }, title: { fontSize: 35, lineHeight: 39, fontWeight: '900', letterSpacing: -1, color: colors.text }, subtitle: { fontSize: 15, lineHeight: 21, color: colors.text, fontWeight: '700', marginTop: spacing.md }, searchCard: { marginTop: -42, padding: spacing.md }, shortcuts: { flexDirection: 'row', gap: spacing.sm }, shortcut: { flex: 1, minWidth: 0, minHeight: 78, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 3 }, shortcutIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, shortcutText: { fontSize: 11, fontWeight: '800', color: colors.text, textAlign: 'center' }, savedGrid: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' }, savedGridNarrow: { flexDirection: 'column' }, placesColumn: { flex: 4 }, routesColumn: { flex: 6 } });
