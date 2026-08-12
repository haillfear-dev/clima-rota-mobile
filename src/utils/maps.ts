import type { Trip } from '../types';
export function googleMapsUrl(t:Trip):string{const origin=`${t.origin.latitude},${t.origin.longitude}`,destination=`${t.destination.latitude},${t.destination.longitude}`;return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`}
