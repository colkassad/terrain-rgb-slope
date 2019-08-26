# terrain-rgb-slope
Converts Mapbox's [Terrain-RGB](https://docs.mapbox.com/help/troubleshooting/access-elevation-data/) PNG tiles to 16 bit greyscale PNGs depicting integer slope percentage.

# Installation

`npm install terrain-rgb-slope`


# Examples
```javascript
var converter = require('terrain-rgb-slope');

var options = {
  inputFilePath: '/path/to/my/terrain-rgb-tile.png',
  outputFilePath: '/path/to/output/16bit-slope.png'
};

converter.convertToSlope(options, function() {
  console.log("Finished.");
});

