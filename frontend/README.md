# Frontend do Study Agent

## Executar localmente

Crie `.env` a partir de `.env.example` e ajuste `VITE_API_URL` caso a API não
esteja em `http://127.0.0.1:8000`. Em seguida execute:

```bash
bun install
bun run dev
```

O backend deve permitir a origem do Vite: defina
`ALLOWED_ORIGINS=http://localhost:5173` no `.env` da API e reinicie-o.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
