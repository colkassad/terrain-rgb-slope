var PNG = require('pngjs').PNG;
var fs = require('fs');
var request = require('request');

/* Converts a Terrain-RGB PNG to a 16 bit greyscale PNG depicting slope percentage.
 * @param options {Object} Options for the conversion.
 * @param callback {Function} The path to save the 16 bit PNG.
*/
module.exports.convertToSlope = function(options, callback) {
    options = options || {};
    if (!options.cellsize) {
        options.cellsize = 1;
    }
    fs.createReadStream(options.inputFilePath)
        .pipe(new PNG({
        }))
        .on('parsed', function() {
            
            var w = this.width;
            var h = this.height;

            var buffer = Buffer.alloc(2 * w * h);
            var bitmap = new Uint16Array(buffer.buffer);

            //extract elevations
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    var idx = (w * y + x) << 2;
                    var northIdx = (w * (y - 1) + x) << 2;
                    var northeastIdx = (w * (y - 1) + (x + 1)) << 2;
                    var eastIdx = (w * y + (x + 1)) << 2;
                    var southeastIdx = (w * (y + 1) + (x + 1)) << 2;
                    var southIdx = (w * (y + 1) + x) << 2;
                    var southwestIdx = (w * (y + 1) + (x - 1)) << 2;
                    var westIdx = (w * y + (x - 1)) << 2;
                    var northwestIdx = (w * (y - 1) + (x - 1)) << 2;

                    //the pixel for which we shall calculate slope.
                    var r = this.data[idx];
                    var g = this.data[idx+1];
                    var b = this.data[idx+2];
                    
                    //obtain neighboring pixels
                    var rNorth = this.data[northIdx];
                    var gNorth = this.data[northIdx + 1];
                    var bNorth = this.data[northIdx + 2];

                    var rNortheast = this.data[northeastIdx];
                    var gNortheast = this.data[northeastIdx + 1];
                    var bNortheast = this.data[northeastIdx + 2];

                    var rEast = this.data[eastIdx];
                    var gEast = this.data[eastIdx + 1];
                    var bEast = this.data[eastIdx + 2];

                    var rSoutheast = this.data[southeastIdx];
                    var gSoutheast = this.data[southeastIdx + 1];
                    var bSoutheast = this.data[southeastIdx + 2];

                    var rSouth = this.data[southIdx];
                    var gSouth = this.data[southIdx + 1];
                    var bSouth = this.data[southIdx + 2];

                    var rSouthwest = this.data[southwestIdx];
                    var gSouthwest = this.data[southwestIdx + 1];
                    var bSouthwest = this.data[southwestIdx + 2];

                    var rWest = this.data[westIdx];
                    var gWest = this.data[westIdx + 1];
                    var bWest = this.data[westIdx + 2];

                    var rNorthwest = this.data[northwestIdx];
                    var gNorthwest = this.data[northwestIdx + 1];
                    var bNorthwest = this.data[northwestIdx + 2];

                
                    //Convert from terrain-rgb to integer height value.
                    //If the pixel for which slope is being calculated is along an edge, assign
                    //non-existent neighbors the same height value as the pixel for which slope is being calculated.
                    var height = getHeightFromRgb(r, g, b);
                    var northHeight = isNaN(getHeightFromRgb(rNorth, gNorth, bNorth)) ? height : getHeightFromRgb(rNorth, gNorth, bNorth);
                    var northeastHeight = isNaN(getHeightFromRgb(rNortheast, gNortheast, bNortheast)) ? height : getHeightFromRgb(rNortheast, gNortheast, bNortheast);
                    var eastHeight = isNaN(getHeightFromRgb(rEast, gEast, bEast)) ? height : getHeightFromRgb(rEast, gEast, bEast);
                    var southeastHeight = isNaN(getHeightFromRgb(rSoutheast, gSoutheast, bSoutheast)) ? height : getHeightFromRgb(rSoutheast, gSoutheast, bSoutheast);
                    var southHeight = isNaN(getHeightFromRgb(rSouth, gSouth, bSouth)) ? height : getHeightFromRgb(rSouth, gSouth, bSouth);
                    var southwestHeight = isNaN(getHeightFromRgb(rSouthwest, gSouthwest, bSouthwest)) ? height : getHeightFromRgb(rSouthwest, gSouthwest, bSouthwest);
                    var westHeight = isNaN(getHeightFromRgb(rWest, gWest, bWest)) ? height : getHeightFromRgb(rWest, gWest, bWest);
                    var northwestHeight = isNaN(getHeightFromRgb(rNorthwest, gNorthwest, bNorthwest)) ? height : getHeightFromRgb(rNorthwest, gNorthwest, bNorthwest);

                    //calculate slope using its 8 neighbors
                    var dzdx = (((northeastHeight + (2 * eastHeight) + southeastHeight)) - ((northwestHeight + (2 * westHeight) + southwestHeight))) / (8 * options.cellsize);
                    var dzdy = (((southwestHeight + (2 * southHeight) + southeastHeight)) - ((northwestHeight + (2* northHeight) + northeastHeight))) / (8 * options.cellsize);
                    var riseRun = Math.sqrt(Math.pow(dzdx, 2) + Math.pow(dzdy, 2));
                    var slopeDegrees = Math.atan(riseRun) * (180 / Math.PI);
                    bitmap[y * w + x] = Math.floor(slopeDegrees);
                }
            }

            //write out a 16 bit png
            png = new PNG({
                width: w,
                height: h,
                bitDepth: 16,
                colorType: 0,
                inputColorType: 0,
                inputHasAlpha: false
            });
            png.data = bitmap;
            png.pack().pipe(fs.createWriteStream(options.outputFilePath)
                .on('close', function() {
                    callback();
                }));
    })
    .on('error', function(err) {
        console.log(err);
    });;
};

//converts height encoded in RGB values to a 16 bit integer elevation
var getHeightFromRgb = function(r, g, b) {
    return -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
};