# Stoat Frontend (for-web)

The official web client for https://stoat.chat/app — a chat platform frontend built with **Solid.js**.

Repository: https://github.com/stoatchat/for-web

## Tech Stack

- **Framework**: Solid.js (v1.9)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm (v11.3) with workspace monorepo
- **Styling**: PandaCSS
- **Rich Text Editor**: ProseMirror + CodeMirror
- **Markdown**: remark / rehype pipeline
- **i18n**: Lingui
- **Routing**: @solidjs/router
- **State/Data**: @tanstack/solid-query
- **Task Runner**: mise-en-place
- **Linting**: ESLint + Prettier (2-space indentation)

## Monorepo Packages

```
packages/
  client/              # Main web app (Vite + Solid.js)
  stoat.js/            # Stoat API client library (workspace dep)
  solid-livekit-components/  # LiveKit voice/video components
  solid-dnd-directive/       # Drag-and-drop directive
  js-lingui-solid/           # Lingui i18n integration for Solid
```

## Common Commands

```bash
# Install dependencies
mise install:frozen

# Build dependencies (stoat.js, etc.)
mise build:deps

# Run dev server (http://local.revolt.chat:5173)
mise dev

# Build for production
mise build          # standard build
mise build:prod     # Stoat production build

# Run all CI checks
mise check

# Pull brand assets
mise assets
mise assets:fallback   # revert to fallback assets
```

## Key Code Guidelines

- **Never destructure reactive Solid.js props** — always use `splitProps`
- Follow [Airbnb JavaScript style guide](https://github.com/airbnb/javascript) naming conventions
- 2-space indentation (enforced by Prettier)
- Comment above all classes, constants, Solid components, constructors, methods, and functions
- Use semantic HTML and proper ARIA attributes — accessibility is a priority
- Avoid importing external libraries in more than one component; re-export where appropriate
- Import only types where necessary (e.g. `stoat.js` types in UI code)

## Environment Configuration

Copy `packages/client/.env.example` to `packages/client/.env`.

- By default connects to localhost backend
- Comment out the local URL variables to use the official hosted backend
- Env vars: `VITE_API_URL`, `VITE_WS_URL`, `VITE_MEDIA_URL`, `VITE_PROXY_URL`

## Routing

App routes (defined in `packages/client/src/index.tsx`):
`/login`, `/pwa`, `/dev`, `/discover`, `/settings`, `/invite`, `/bot`, `/friends`, `/server`, `/channel`

## Deployment

Build output is in `packages/client/dist` after running `mise build`.
