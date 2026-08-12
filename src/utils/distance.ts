import type { Place } from '../types';
const rad=(n:number)=>n*Math.PI/180;
export function haversineKm(a:Place,b:Place):number{const dLat=rad(b.latitude-a.latitude),dLon=rad(b.longitude-a.longitude);const v=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v))}
