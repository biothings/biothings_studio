# webapp
This folder contains the BioThings Studio webapp built with Vue.js and Semantic UI.

## Project setup
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
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
