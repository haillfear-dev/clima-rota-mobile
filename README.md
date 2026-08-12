# Vora Mobile MVP v0.1

Assistente de preparação de deslocamentos feito com React Native, Expo SDK 54 e TypeScript.

## Configuração

1. Instale Node.js 20+ e execute `npm install`.
2. Crie sua chave gratuita no painel do [Geoapify](https://myprojects.geoapify.com/).
3. Copie `.env.example` para `.env` e substitua o valor de exemplo:

   ```sh
   cp .env.example .env
   # EXPO_PUBLIC_GEOAPIFY_API_KEY=sua_chave_aqui
   ```

O `.env` não é versionado. Reinicie o Expo após alterar a variável. Sem a chave, o aplicativo continua abrindo e explica a configuração necessária no campo de busca.

## Executar no Android físico com Expo Go

1. Instale **Expo Go** no Android pela Play Store.
2. Deixe computador e celular na mesma rede Wi-Fi.
3. Rode `npm start` e leia o QR code usando o Expo Go.
4. Se a rede local bloquear a conexão, rode `npx expo start --tunnel`.
5. Autorize a localização quando desejar; a pesquisa manual permanece disponível.

## Verificações

- `npm run typecheck`: valida TypeScript.
- `npx expo-doctor`: valida configuração e dependências Expo.

## Serviços e arquitetura

- Geoapify para autocomplete de endereços e pontos de interesse, isolado atrás de uma interface de provider.
- AsyncStorage, encapsulado em services, para Casa, Trabalho e rotas favoritas.
- Open-Meteo para o clima atual.
- Haversine para distância geográfica aproximada.
- URL universal do Google Maps para iniciar a navegação, sem chave paga.

## Limitações do MVP

O clima representa origem e destino no momento da consulta, não todo o percurso nem o horário de chegada. A distância é em linha reta, não rodoviária. Os dados salvos ficam apenas no aparelho e não são sincronizados. Ainda não há conta, autocomplete offline, distância rodoviária, duração ou trânsito.
