import type { SavedPlace, SavedPlaceLabel } from '../types';
import { readJson, writeJson } from './storage';

const KEY = '@vora/saved-places/v1';

export const savedPlacesService = {
  list: () => readJson<SavedPlace[]>(KEY, []),
  async save(place: SavedPlace) {
    const places = await this.list();
    await writeJson(KEY, [...places.filter((item) => item.label !== place.label), place]);
  },
  async remove(label: SavedPlaceLabel) {
    await writeJson(KEY, (await this.list()).filter((place) => place.label !== label));
  },
};
