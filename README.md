# react-click-to-component (local plugin)

A self-hosted copy of [vite-plugin-react-click-to-component](https://github.com/ArnaudBarre/vite-plugin-react-click-to-component).
Use this when you can't install the npm package directly.

> **Dev-only** — all hooks are no-ops in production builds. Zero bundle impact.

---

## File Structure

```
plugins/
└── react-click-to-component/
    ├── index.ts     ← Vite plugin (runs in Node, modifies Vite internals)
    └── client.ts    ← Browser runtime (injected into the page during dev)
```

---

## Setup

### 1. Register the plugin in `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { reactClickToComponent } from "./plugins/react-click-to-component/index";

export default defineConfig({
  plugins: [
    react(),
    reactClickToComponent(),
  ],
});
```

### 2. No changes needed in `main.tsx` or anywhere else

The plugin injects the client script into your HTML automatically via `transformIndexHtml`. You don't import anything in your app code.

---

## Usage

| Action | Result |
|---|---|
| Hold `Alt` and hover over any element | Outlines the hovered element |
| `Alt` + right-click on any element | Opens a menu listing all React components in the tree at that point |
| Click a component in the menu | Opens that component's source file in your editor at the exact line |

---

## How it works internally

1. **`index.ts` (Vite plugin)**
   - `configResolved`: captures `root` (project root path) and `base` (URL base) from Vite config.
   - `transform`: patches `jsx-dev-runtime.js` for React 19+ to ensure source location info (`_debugSource`) is passed through JSX. React <19 already does this, so it's a no-op there.
   - `transformIndexHtml`: injects a `<script type="module">` tag that imports the client module.
   - `resolveId` + `load`: serves `client.ts` as a virtual module, replacing the `__ROOT__` and `__BASE__` placeholder strings with actual values before the browser receives the code.

2. **`client.ts` (browser runtime)**
   - Listens for `mousemove` while `Alt` is held to highlight the hovered element.
   - Listens for `contextmenu` while `Alt` is held to show the component tree menu.
   - Walks the React Fiber tree via `__reactFiber*` keys or React DevTools hook to find component names and source file paths.
   - On menu item click, calls Vite's built-in `/__open-in-editor?file=...` endpoint which opens the file in your editor.

---

## Editor setup

Vite uses [`launch-editor`](https://github.com/yyx990803/launch-editor) to open files. It auto-detects VS Code in most cases. If it doesn't work, set this in `.env.local`:

```
EDITOR=code
```

| Editor | Value |
|---|---|
| VS Code | `code` |
| WebStorm | `webstorm` |
| Cursor | `cursor` |
| Vim | `vim` |

---

## Important: Do not modify the placeholders in `client.ts`

`client.ts` contains two literal placeholder strings:

```ts
const root = "__ROOT__";
const base = "__BASE__";
```

**Do not replace these with actual paths.** The `index.ts` plugin replaces them with real values at dev-server startup before the browser receives the file.

---

## Compatibility

| React version | Works? | Notes |
|---|---|---|
| < 19 | Yes | Source info already present in JSX, no transform needed |
| 19.0 – 19.1 | Yes | `transform` hook patches `jsx-dev-runtime.js` |
| 19.2+ | Yes | Additional `replaceAll` patches handle updated signature |
