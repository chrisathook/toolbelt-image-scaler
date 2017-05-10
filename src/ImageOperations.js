/**
 * Created by Christopher on 3/21/2017.
 */
"use strict";
const path = require('path');
const fs = require('fs-plus');
const os = require('os');
const gm = require('gm');
const del = require('del');
const imageSize = require('image-size');
const kb = 1024;
let sizeAndScale = function (imagePath, outputPath, minQuality, scale, targetKB) {
  return new Promise(function (resolve, reject) {
    let quality = 101;
    let step = function () {
      quality -= 1;
      
      if (targetKB===-1){
        quality = minQuality;
        
      }
      
      processAndReport(imagePath, outputPath, scale, quality, true).then(function (results) {
        let size = Math.round(results.stats.size / kb);
        results.stats.size = size;
        // image will never be what we want
        if (quality < minQuality && size > targetKB &&  targetKB !==-1) {
          resolve({
            success: false,
            stats: results.stats,
            dimensions: results.dimensions,
            path: outputPath,
            notes: `File cannot be converted to these dimensions and fileweight:   Target:${targetKB}KB    Actual:${size}KB  `
          
          });
        } else if (size <= targetKB || targetKB=== -1 ) {
          // image is the file size we want
          processAndReport(imagePath, outputPath, scale, quality, false).then(function (results) {
            results.stats.size = Math.round(results.stats.size / kb);
            resolve({
              success: true,
              stats: results.stats,
              dimensions: results.dimensions,
              path: outputPath,
              notes: ''
            });
          }).catch(function (err) {
            resolve({
              success: false,
              stats: null,
              dimensions: null,
              path: outputPath,
              notes: `Could Not Write File   ${err}`
            });
          })
        } else {
          // image too big, run again
          step()
        }
      }).catch(function (err) {
        resolve({
          success: false,
          stats: null,
          dimensions: null,
          path: outputPath,
          notes: `Could Not Write File   ${err}`
        });
      })
    };
    step()
  })
};
let processAndReport = function (imagePath, outputPath, scale, quality, preflight = true) {
  return new Promise(function (resolve, reject) {
    if (preflight === true) {
      outputPath = path.resolve(os.tmpdir(), path.parse(outputPath).base);
    } else {
      if (!fs.existsSync(path.parse(outputPath).dir)) {
        fs.makeTreeSync(path.parse(outputPath).dir);
      }
    }
    gm(imagePath)
      .strip()
      .resize(`${scale}%`, `${scale}%`)
      .quality(quality)
      .write(outputPath, function (err) {
        if (err) {
          console.error(err);
          reject(`${imagePath}   ${outputPath} `);
        } else {
          let stats = fs.statSync(outputPath);
          let dimensions = imageSize(outputPath);
          if (preflight === true) {
            del.sync(outputPath, {force: true});
          }
          resolve({stats: stats, dimensions: dimensions});
        }
      })
  });
};
module.exports = {
  sizeAndScale: sizeAndScale
};