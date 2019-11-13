# Pin Map

A spinning globe with markers (pins) with zoom & pan capability using React and D3.

Mapa data used are pre-built TopoJSON from [topojson/world-atlas](https://github.com/topojson/world-atlas).

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Features
- Initially renders as a spinning globe with red markers based on locations data.
- When mouse hovers over a marker while spinning, the animation is paused and a tooltip is displayed above the hovered marker displaying the location text from data. When the mouse leaves the marker, the animation resumes.
- When user interacts with globe with pan or zoom, the spinning animation stops.
- While the globe is spinning, or while the user pans or zooms, the land masses are rendered in low resolution. When the user does not interact with the globe and its not spinning, the map is rendered in high resolution.

## Libraries used

- d3: Loading JSON, rendering SVG elements, and data update patterns
  - d3-geo: Globe projection, scaling, and mapping coordinates
  - d3-zoom & d3-drag: Map zoom & pan
  - d3-timer: Timer to spin globe
- d3-tip: Location tooltips for markers
- topojson: Topology encoding for map land masses

## Installation
Clone repository locally and run:
```bash
npm i
```

## Running the app

```bash
npm start
```

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

## Build for production

```bash
npm run build
```

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
