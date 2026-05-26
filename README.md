# Nomeia Aí Rankings (App)

App mobile (Expo) para visualizar rankings do [Nomeia Aí](https://nomeiai.com.br). Usa o **mesmo Supabase** e a **mesma conta** do site web.

## Pré-requisitos

- Node.js 20+
- Android Studio (emulador) ou dispositivo físico com Expo Go
- Credenciais Supabase do projeto `ppsymqrdtjyaguftracc` (iguais ao `.env` da web)

## Configuração

```bash
cd Nomeia-Ai_Rankings
cp .env.example .env
# Edite .env com EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
```

## Executar

```bash
npm start
# Ctrl+C e depois, se o QR não conectar na rede local:
npx expo start -c --tunnel
```

- **Celular:** app **Expo Go** → escanear QR (mesma Wi‑Fi ou `--tunnel`).
- **Android emulador:** abra o AVD no Android Studio primeiro → `adb devices` → tecla `a`.
- **Web:** tecla `w` (após `npm start`).

> A tecla `a` só funciona com emulador ligado ou celular via USB com depuração USB.

## Estrutura

```
src/
  app/              # Rotas (Expo Router)
    index.tsx       # Lista de concursos
    login.tsx       # Autenticação
    ranking/[id].tsx # Classificação
  contexts/         # Auth (Supabase)
  services/         # API rankings / concursos
  components/       # UI
  lib/              # Cliente Supabase
```

## Deploy

- **Não usa a VPS** do site: o app roda no celular e fala direto com o Supabase.
- Builds de produção: [EAS Build](https://docs.expo.dev/build/introduction/) (`eas build`).

## Participação em rankings (app)

Participar, editar gabarito e sair do ranking usam as **mesmas RPCs do site** (`participate_in_ranking`, `update_consolidated_data_and_recalculate`), via Supabase nativo — sem WebView.

**Criar ranking** fica apenas no [site web](https://www.nomeiai.com.br/criar-ranking).

## Próximas fases

- Deep links (`nomeia-rankings://`)
- Pacote `shared` com a web para lógica de gabarito idêntica em provas muito customizadas
- Pacote `shared` com a web para lógica de ordenação/desempate idêntica
