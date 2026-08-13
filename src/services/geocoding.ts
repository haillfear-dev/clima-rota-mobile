import type { AddressSuggestion, Place } from '../types';

export class GeocodingConfigurationError extends Error {}

export type GeocodingProvider = {
  autocomplete(query: string, signal?: AbortSignal, proximity?: Place): Promise<AddressSuggestion[]>;
};

type GeoapifyFeature = {
  properties: {
    place_id?: string;
    formatted?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    suburb?: string;
    district?: string;
    city?: string;
    state?: string;
    lat: number;
    lon: number;
  };
};

const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

function addressParts(feature: GeoapifyFeature) {
  const p = feature.properties;
  const street = [p.street ?? p.name, p.housenumber].filter(Boolean).join(', ');
  const locality = [p.suburb ?? p.district, p.city, p.state].filter(Boolean).join(' · ');
  return { title: street || p.formatted || 'Local encontrado', subtitle: locality };
}

export const geoapifyProvider: GeocodingProvider = {
  async autocomplete(query, signal, proximity) {
    if (!apiKey) {
      throw new GeocodingConfigurationError(
        'Configure EXPO_PUBLIC_GEOAPIFY_API_KEY no arquivo .env para pesquisar endereços.',
      );
    }

    const params = new URLSearchParams({
      text: query,
      apiKey,
      limit: '5',
      lang: 'pt',
      format: 'geojson',
    });
    if (proximity) params.set('bias', `proximity:${proximity.longitude},${proximity.latitude}`);
    const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`, { signal });
    if (!response.ok) throw new Error('Não foi possível buscar endereços agora.');
    const data = (await response.json()) as { features: GeoapifyFeature[] };

    return data.features.slice(0, 5).map((feature, index) => {
      const { title, subtitle } = addressParts(feature);
      return {
        id: feature.properties.place_id ?? `${feature.properties.lat}-${feature.properties.lon}-${index}`,
        name: feature.properties.formatted ?? [title, subtitle].filter(Boolean).join(', '),
        title,
        subtitle,
        latitude: feature.properties.lat,
        longitude: feature.properties.lon,
      };
    });
  },
};

export const geocodingService = geoapifyProvider;

export async function coordinatesToPlace(latitude: number, longitude: number): Promise<Place> {
  if (!apiKey) return { name: 'Minha localização atual', latitude, longitude };
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), apiKey, lang: 'pt', format: 'geojson' });
  const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?${params}`);
  if (!response.ok) return { name: 'Minha localização atual', latitude, longitude };
  const data = await response.json() as { features?: GeoapifyFeature[] };
  return { name: data.features?.[0]?.properties.formatted ?? 'Minha localização atual', latitude, longitude };
}
