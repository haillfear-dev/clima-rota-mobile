import type { Place, RouteEstimate, TravelMode } from '../../types';

export class RoutingError extends Error {}

type OsrmResponse = { code: string; routes?: Array<{ distance: number; duration: number }> };

export const routingService = {
  async estimate(origin: Place, destination: Place, mode: TravelMode): Promise<RouteEstimate> {
    const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false&alternatives=false&steps=false`);
    if (!response.ok) throw new RoutingError('O serviço de rotas está indisponível no momento.');
    const data = await response.json() as OsrmResponse;
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route) throw new RoutingError('Não encontramos uma rota rodoviária entre estes locais.');
    return { distanceMeters: route.distance, durationSeconds: route.duration, origin, destination, mode };
  },
};
