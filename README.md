# healthie-react

A small kanban board (To Do / Doing / Done) built with React, Vite and [dnd kit](https://dndkit.com) for drag and drop. Cards use characters from the Rick and Morty API.

## Running locally

You need Node.js 20.19+ (or 22.12+) and npm.

```sh
npm install
npm run dev
```

Then open the URL Vite prints, usually http://localhost:5173.

The board is saved in your browser's local storage, so it survives a refresh.

## Other scripts

- `npm run build` typechecks and builds for production into `dist/`
- `npm run preview` serves the production build locally
- `npm run lint` runs Oxlint
