# Vora Mobile MVP v0.1

Assistente de preparação de deslocamentos feito com React Native, Expo e TypeScript.

## Executar no Android físico com Expo Go

1. Instale Node.js 20+ e rode `npm install`.
2. Instale **Expo Go** no Android pela Play Store.
3. Deixe computador e celular na mesma rede Wi-Fi.
4. Rode `npm start` e leia o QR code exibido usando o Expo Go.
5. Se a rede local bloquear a conexão, rode `npx expo start --tunnel`.
6. Autorize a localização quando desejar usar a origem atual; a digitação manual sempre permanece disponível.

## Verificações

- `npm run typecheck`: valida TypeScript.
- `npx expo-doctor`: valida configuração e dependências Expo.

## Serviços e arquitetura

- Nominatim/OpenStreetMap para geocodificação de protótipo, isolado em `src/services/geocoding.ts`.
- Open-Meteo para o clima atual.
- Haversine para distância geográfica aproximada.
- URL universal do Google Maps para iniciar a navegação, sem chave paga.

## Limitações do MVP

A busca não possui autocomplete e o Nominatim tem política de uso e limites adequados apenas a prototipagem. O clima representa origem e destino no momento da consulta, não todo o percurso nem o horário de chegada. A distância é em linha reta, não rodoviária. Rotas recentes ainda são apenas um estado vazio e não há persistência ou contas.
