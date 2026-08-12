import type { FavoriteRoute } from '../types';
import { readJson, writeJson } from './storage';

const KEY = '@vora/favorite-routes/v1';

export const favoriteRoutesService = {
  list: () => readJson<FavoriteRoute[]>(KEY, []),
  async save(route: FavoriteRoute) {
    await writeJson(KEY, [route, ...(await this.list())]);
  },
  async remove(id: string) {
    await writeJson(KEY, (await this.list()).filter((route) => route.id !== id));
  },
};
