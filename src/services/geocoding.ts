import type { AddressSuggestion, GeographicKind, GeographicMetadata, Place } from '../types';

export class GeocodingConfigurationError extends Error {}

export type GeocodingProvider = {
  autocomplete(query: string, signal?: AbortSignal, proximity?: Place): Promise<AddressSuggestion[]>;
};

type GeoapifyFeature = {
  properties: {
    place_id?: string;
    result_type?: string;
    formatted?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    suburb?: string;
    district?: string;
    city?: string;
    state?: string;
    state_code?: string;
    county?: string;
    country?: string;
    country_code?: string;
    lat: number;
    lon: number;
  };
};

function geographicKind(resultType?: string): GeographicKind {
  if (['amenity', 'building', 'commercial', 'tourism', 'leisure', 'sport', 'airport'].includes(resultType ?? '')) return 'poi';
  if (resultType === 'country') return 'country';
  if (['state', 'region', 'province', 'county'].includes(resultType ?? '')) return 'region';
  if (['city', 'town', 'village', 'municipality'].includes(resultType ?? '')) return 'city';
  if (['suburb', 'district', 'neighbourhood', 'quarter'].includes(resultType ?? '')) return 'neighbourhood';
  if (resultType === 'street') return 'street';
  if (['postcode', 'formatted', 'address'].includes(resultType ?? '')) return 'address';
  return 'unknown';
}

function geography(feature: GeoapifyFeature): GeographicMetadata {
  const p = feature.properties;
  return {
    originalLabel: p.formatted ?? p.name ?? 'Local encontrado', kind: geographicKind(p.result_type),
    name: p.name, houseNumber: p.housenumber, street: p.street, neighbourhood: p.suburb,
    district: p.district, city: p.city, county: p.county, region: p.state,
    regionCode: p.state_code, country: p.country, countryCode: p.country_code,
  };
}

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
        selectionLabel: title,
        latitude: feature.properties.lat,
        longitude: feature.properties.lon,
        geography: geography(feature),
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
  const feature = data.features?.[0];
  return { name: feature?.properties.formatted ?? 'Minha localização atual', latitude, longitude, geography: feature ? geography(feature) : undefined };
}
