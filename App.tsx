import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddressAutocomplete } from './src/components/AddressAutocomplete';
import { FavoriteRoutesSection, SavedPlacesSection } from './src/components/SavedSections';
import { TripSummary } from './src/components/TripSummary';
import { Button, Card } from './src/components/Ui';
import { favoriteRoutesService } from './src/services/favoriteRoutes';
import { savedPlacesService } from './src/services/savedPlaces';
import { getCurrentWeather } from './src/services/weather';
import { colors, spacing } from './src/theme';
import type { FavoriteRoute, Place, SavedPlace, SavedPlaceLabel, Trip } from './src/types';
import { haversineKm } from './src/utils/distance';

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

  useEffect(() => { void refreshSaved(); }, []);
  async function refreshSaved() {
    const [savedPlaces, favoriteRoutes] = await Promise.all([savedPlacesService.list(), favoriteRoutesService.list()]);
    setPlaces(savedPlaces); setRoutes(favoriteRoutes);
  }
  function setField(field: Field, place: Place) {
    if (field === 'origin') { setOrigin(place); setOriginText(place.name); }
    else { setDestination(place); setDestinationText(place.name); }
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
  async function saveRoute() {
    if (!trip) return;
    await favoriteRoutesService.save({ id: `${Date.now()}`, origin: trip.origin, destination: trip.destination, createdAt: new Date().toISOString() });
    await refreshSaved(); Alert.alert('Rota salva', 'Esta viagem agora está nas suas rotas favoritas.');
  }
  async function openRoute(route: FavoriteRoute) {
    setField('origin', route.origin); setField('destination', route.destination); await prepareWith(route.origin, route.destination);
  }

  return <SafeAreaView style={styles.safe}><StatusBar style="dark"/><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <View style={styles.brand}><View><Text style={styles.logo}>Vora<Text style={styles.dot}>.</Text></Text><Text style={styles.tagline}>Saiba antes de sair.</Text></View><View style={styles.logoIcon}><Ionicons name="navigate" size={24} color="#fff"/></View></View>
    <View><Text style={styles.title}>Para onde você vai?</Text><Text style={styles.subtitle}>Prepare seu deslocamento em poucos segundos.</Text></View>
    <Card>
      <View style={styles.shortcuts}>
        <Shortcut icon="locate-outline" label="Localização" loading={locationLoading} onPress={() => void useLocation()}/>
        <Shortcut icon="home-outline" label="Casa" onPress={() => savedPlaceAction('Casa')}/>
        <Shortcut icon="briefcase-outline" label="Trabalho" onPress={() => savedPlaceAction('Trabalho')}/>
      </View>
      <AddressAutocomplete label="Origem" placeholder="Rua, endereço ou lugar" value={originText} onChangeText={(text) => { setOriginText(text); setOrigin(undefined); }} onSelect={(place) => setField('origin', place)}/>
      <AddressAutocomplete label="Destino" placeholder="Para onde vamos?" value={destinationText} onChangeText={(text) => { setDestinationText(text); setDestination(undefined); }} onSelect={(place) => setField('destination', place)}/>
      <Button title="Preparar viagem" icon="arrow-forward" loading={tripLoading} onPress={() => void prepareWith()}/>
    </Card>
    {trip && <TripSummary trip={trip} onSave={() => void saveRoute()}/>}
    <SavedPlacesSection places={places} onPress={savedPlaceAction} onDelete={(label) => void savedPlacesService.remove(label).then(refreshSaved)}/>
    <FavoriteRoutesSection routes={routes} onPress={(route) => void openRoute(route)} onDelete={(id) => void favoriteRoutesService.remove(id).then(refreshSaved)}/>
    <Text style={styles.footer}>Vora · informações para decidir antes de navegar</Text>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function Shortcut({ icon, label, onPress, loading }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; loading?: boolean }) {
  return <Pressable style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.7 }]} onPress={onPress} disabled={loading}><Ionicons name={icon} size={21} color={colors.primary}/><Text style={styles.shortcutText}>{loading ? 'Buscando…' : label}</Text></Pressable>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, content: { padding: spacing.lg, paddingBottom: 48, gap: spacing.lg, maxWidth: 680, width: '100%', alignSelf: 'center' }, brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, logo: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5, color: colors.primary }, dot: { color: colors.accent }, tagline: { color: colors.muted, fontSize: 14, fontWeight: '600' }, logoIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, color: colors.text }, subtitle: { fontSize: 15, color: colors.muted, marginTop: spacing.xs }, shortcuts: { flexDirection: 'row', gap: spacing.sm }, shortcut: { flex: 1, minHeight: 66, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: colors.primaryLight, paddingHorizontal: 4 }, shortcutText: { fontSize: 11, fontWeight: '800', color: colors.primary, textAlign: 'center' }, footer: { textAlign: 'center', fontSize: 12, color: colors.muted } });
