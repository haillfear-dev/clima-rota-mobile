import type { GeographicMetadata, Place } from '../types';

const streetAbbreviations: Array<[RegExp, string]> = [
  [/^Rua\s+/iu, 'R. '], [/^Avenida\s+/iu, 'Av. '], [/^Rodovia\s+/iu, 'Rod. '],
  [/^Travessa\s+/iu, 'Tv. '], [/^Alameda\s+/iu, 'Al. '],
];
const ambiguousLocalities = new Set(['center', 'centre', 'centro', 'downtown', 'jardim américa', 'jardim america']);

export type AddressDisplay = { title: string; subtitle: string };

function compactStreet(value: string): string {
  let street = value.replace(/,?\s+\d+[\w/-]*$/u, '').trim();
  for (const [pattern, replacement] of streetAbbreviations) street = street.replace(pattern, replacement);
  return street;
}

function legacyParts(label: string): AddressDisplay {
  const parts = label.split(',').map((part) => part.trim()).filter(Boolean);
  return {
    title: compactStreet(parts[0] || 'Local selecionado'),
    subtitle: parts.slice(1).find((part) => !/^\d+[\w/-]*$/u.test(part)) || '',
  };
}

function first(...values: Array<string | undefined>): string {
  return values.find((value) => !!value?.trim())?.trim() ?? '';
}

function structuredParts(data: GeographicMetadata): AddressDisplay {
  const legacy = legacyParts(data.originalLabel);
  let title = '';
  let subtitle = '';
  switch (data.kind) {
    case 'poi':
      title = first(data.name, legacy.title);
      subtitle = first(data.neighbourhood, data.city, data.region);
      break;
    case 'street':
    case 'address':
      title = compactStreet(first(data.street, data.name, legacy.title));
      subtitle = first(data.neighbourhood, data.district, data.city, data.region);
      break;
    case 'neighbourhood':
      title = first(data.neighbourhood, data.district, data.name, legacy.title);
      if (ambiguousLocalities.has(title.toLocaleLowerCase())) subtitle = first(data.city, data.regionCode, data.region);
      break;
    case 'city':
      title = first(data.city, data.name, legacy.title);
      break;
    case 'region':
      title = first(data.region, data.county, data.name, legacy.title);
      break;
    case 'country':
      title = first(data.country, data.name, legacy.title);
      break;
    default:
      title = legacy.title;
      subtitle = legacy.subtitle;
  }
  return { title: title || 'Local selecionado', subtitle: subtitle === title ? '' : subtitle };
}

/** Supports structured places and legacy favorites that contain only an address string. */
export function addressParts(place: Place | string): AddressDisplay {
  if (typeof place === 'string') return legacyParts(place);
  return place.geography ? structuredParts(place.geography) : legacyParts(place.name);
}

export function displayName(place: Place | string): string {
  const { title, subtitle } = addressParts(place);
  return [title, subtitle].filter(Boolean).join(', ');
}

export const shortAddress = displayName;

/**
 * Label for an editable origin/destination field. Unlike card summaries, this
 * confirms the exact result selected by the user instead of adding or promoting
 * geographic context.
 */
export function selectionDisplayName(place: Place): string {
  if (place.selectionLabel?.trim()) return place.selectionLabel.trim();
  if (place.geography?.name?.trim()) return place.geography.name.trim();
  return legacyParts(place.geography?.originalLabel ?? place.name).title;
}
