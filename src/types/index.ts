export type Place = {
  name: string;
  latitude: number;
  longitude: number;
};

export type AddressSuggestion = Place & {
  id: string;
  title: string;
  subtitle: string;
};

export type Weather = {
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  weatherCode: number;
  description: string;
  icon: string;
};

export type Trip = {
  origin: Place;
  destination: Place;
  distanceKm: number;
  originWeather: Weather;
  destinationWeather: Weather;
};

export type SavedPlaceLabel = 'Casa' | 'Trabalho';

export type SavedPlace = Place & {
  label: SavedPlaceLabel;
};

export type FavoriteRoute = {
  id: string;
  name?: string;
  origin: Place;
  destination: Place;
  createdAt: string;
};
