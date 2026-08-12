import type { Place } from '../types';
const BASE='https://nominatim.openstreetmap.org';
type Result={display_name:string;lat:string;lon:string};
async function json<T>(url:string):Promise<T>{const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Vora-Mobile-MVP/0.1'}});if(!response.ok)throw new Error('Não foi possível consultar o endereço.');return response.json() as Promise<T>}
export async function searchPlace(query:string):Promise<Place>{const results=await json<Result[]>(`${BASE}/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`);const result=results[0];if(!result)throw new Error(`Não encontramos “${query}”. Confira o endereço.`);return{name:result.display_name,latitude:Number(result.lat),longitude:Number(result.lon)}}
export async function reverseGeocode(latitude:number,longitude:number):Promise<Place>{const result=await json<Result>(`${BASE}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);return{name:result.display_name||'Minha localização',latitude,longitude}}
