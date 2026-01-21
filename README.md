# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Development environment variables

This project supports a small set of Vite environment variables used during local development. Copy `.env.example` to `.env.local` or `.env` to override defaults.

- `VITE_MOCK_AUTH` (default: `true` in `.env.example`) — when set to `true`, the frontend will not call the real Gateway for auth requests but will instead return mocked responses for login/register. Use this during UI work while the backend endpoints are not available. Remember to set this to `false` when you want to test against the real Gateway.

See `src/docs/auth-contract.md` for the frontend's expected auth API contract (request/response examples) so you can align with backend implementers.
