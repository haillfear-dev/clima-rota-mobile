const streetAbbreviations: Array<[RegExp, string]> = [
  [/^Rua\s+/i, 'R. '], [/^Avenida\s+/i, 'Av. '], [/^Rodovia\s+/i, 'Rod. '],
  [/^Travessa\s+/i, 'Tv. '], [/^Alameda\s+/i, 'Al. '],
];

export function addressParts(address: string): { title: string; subtitle: string } {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  let title = parts[0] || 'Local selecionado';
  for (const [pattern, replacement] of streetAbbreviations) title = title.replace(pattern, replacement);
  const subtitle = parts.slice(1).find((part) => !/^\d+$/.test(part)) || '';
  return { title, subtitle };
}

export function shortAddress(address: string): string {
  const { title, subtitle } = addressParts(address);
  return [title, subtitle].filter(Boolean).join(', ');
}
