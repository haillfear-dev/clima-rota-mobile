export type Place={name:string;latitude:number;longitude:number};
export type Weather={temperature:number;apparentTemperature:number;precipitationProbability:number;weatherCode:number;description:string;icon:string};
export type Trip={origin:Place;destination:Place;distanceKm:number;originWeather:Weather;destinationWeather:Weather};
