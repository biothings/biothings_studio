# webapp
This folder contains the BioThings Studio webapp built with Vue 3, Vite and Fomantic UI.

## Project setup
It needs Node.js 20.19+ or 22.12+. CI uses Node 24, like `.nvmrc`.
```
npm install
```

## Install Fomantic UI

### Install package

```bash
npm install --ignore-scripts fomantic-ui
```

### Build dist files

- change to node_modules/formatic-ui folder

- run gulp install

Note: set the semantic folder to public/assets/semantic-ui

```bash
npx gulp install
```

- build dist files

```bash
cd public/assets/semantic-ui
npx gulp build
```

### Compiles and hot-reloads for development
```
npm run dev
```
The app is then served at http://localhost:5173. It connects to the hub at http://localhost:7080, or to
the last hub it connected to.

### Compiles and minifies for production
```
npm run build
```
The build goes to `dist/`, which `npm run preview` serves locally.

### Customize configuration
See [Vite's configuration reference](https://vite.dev/config/).
