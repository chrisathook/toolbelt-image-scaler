/**
 * Created by Christopher on 3/22/2017.
 */
"use strict";
const path = require('path');
const glob = require('glob-all');
const json2csv = require('json2csv');
const fs = require('fs-plus');
const jsonfile = require('jsonfile');
const imageSize = require('image-size');
const del = require('del');
let prompt = require('prompt');
//
const sizeAndScale = require('../src/ImageOperations').sizeAndScale;
//
let JobLoader = function (jsonPath) {
  return new Promise(function (resolve, reject) {
    jsonfile.readFile(jsonPath, function (err, obj) {
      console.dir(obj);
      if (err) {
        console.error(err);
        reject(err);
      } else {
        let source = path.resolve(obj.sourcePath);
        let dist = path.resolve(obj.outputPath);
        
        let processJobs = function () {
          let jobsArray = [];
          for (let value of obj.jobs) {
            jobsArray.push(
              new JobConfig(
                source,
                dist,
                value.minQuality,
                value.scale,
                value.targetKB,
                value.name,
                value.suffix
              ))
          }
          resolve(jobsArray);
        };
  
        if (!fs.existsSync(source)) {
    
          throw new Error('Source directory does not exist: '+source);
    
        }
        
        if (!fs.existsSync(dist)) {
  
          throw new Error('Destination directory does not exist: '+dist);
          
        } else {
          console.warn('Destination directory exists and will be cleaned of all files, type yes if you want to proceed');
          prompt.start();
          prompt.get(['agree'], function (err, result) {
            if (err) {
              throw new Error(err)
            } else {
              if (result.agree === 'yes') {
                del.sync(dist, {force: true});
                processJobs();
              } else {
                
                console.info('Goodbye');
                process.exit(0)
              }
            }
          });
        }
      }
    })
  });
};
/**
 *
 * @param sourceDir Root directory were pngs are
 * @param outputDir Root directory where files will be wrtten too
 * @param minQuality Use like Photoshop jpeg quality
 * @param scale Scaling factor 0-100
 * @param targetKB Desired File size
 * @param name name for job, will also be name for folder.
 * @param suffix to append
 * @returns {{name: string, scale: *, targetKB: *, minQuality: *, sourceDir: *, outputDir: *}}
 * @constructor
 */
let JobConfig = function (sourceDir, outputDir, minQuality, scale, targetKB, name = 'defaultName', suffix = '') {
  return {
    name: name,
    scale: scale,
    targetKB: targetKB,
    minQuality: minQuality,
    sourceDir: sourceDir,
    outputDir: outputDir,
    suffix: suffix
  };
};
let JobQueue = function () {
  let runSingleJob = function (config) {
    return RunJob(config);
  };
  let runJobs = function (jobsArray) {
    return new Promise(function (resolve, reject) {
      function *run() {
        for (let value of jobsArray) {
          yield {config: value, promise: runSingleJob(value)};
        }
      }
      
      const iterator = run();
      
      function step() {
        let item = iterator.next();
        if (!item.done) {
          console.log(`job start ${item.value.config.name}`);
          item.value.promise.then(function () {
            console.log(`job done ${item.value.config.name}`);
          }).then(step);
        } else {
          resolve()
        }
      }
      
      step();
    });
  };
  return {
    runSingleJob: runSingleJob,
    runJobs: runJobs,
  }
};
let RunJob = function (jobConfig) {
  return new Promise(function (resolve, reject) {
    let files = findInDir(jobConfig.sourceDir, ['**/*.png', '**/*.jpg']);
    // generator
    function *run() {
      for (let value of files) {
        
        // have to get file dimensions here for naming
        let sourceFile = path.resolve(jobConfig.sourceDir, value);
        let dimensions = imageSize(sourceFile);
        let scaler = jobConfig.scale / 100;
        let processedSuffix = jobConfig.suffix
          .replace('WIDTH', Math.round(dimensions.width * scaler))
          .replace('HEIGHT', Math.round(dimensions.height * scaler))
          .replace('SIZE', `${jobConfig.targetKB}K`);
        let newFileName = path.resolve(jobConfig.outputDir, jobConfig.name, value.replace(/\.(jpg|png|gif)/, `${processedSuffix}.jpg`));
        let ret = sizeAndScale(
          sourceFile,
          newFileName,
          jobConfig.minQuality,
          jobConfig.scale,
          jobConfig.targetKB
        );
        yield ret
      }
    }
    
    const iterator = run();
    const reporter = JobReporter();
    reporter.createQueue(
      ['Image Path', 'Target KB', 'Final KB', 'Final Width', 'Final Height', 'Successful Conversion', 'Notes']
    );
    function step() {
      let item = iterator.next();
      if (!item.done) {
        item.value
          .then(function (value) {
            let lineItem = {};
            if (value.success === true) {
              lineItem = {
                "Image Path": value.path.replace(jobConfig.outputDir, ''),
                "Target KB": jobConfig.targetKB,
                "Final KB": value.stats.size,
                "Final Width": value.dimensions.width,
                "Final Height": value.dimensions.height,
                "Successful Conversion": value.success,
                "Notes": value.notes
              };
            } else {
              lineItem = {
                "Image Path": value.path.replace(jobConfig.outputDir, ''),
                "Target KB": jobConfig.targetKB,
                "Final KB": "unknown",
                "Final Width": "unknown",
                "Final Height": "unknown",
                "Successful Conversion": value.success,
                "Notes": value.notes
              };
              if (value.stats !== null) {
                lineItem["Final KB"] = value.stats.size;
                lineItem["Final Width"] = value.dimensions.width;
                lineItem["Final Height"] = value.dimensions.height;
              }
            }
            reporter.appendLine(lineItem)
          })
          .then(step);
      } else {
        reporter.printReport(
          path.resolve(jobConfig.outputDir, jobConfig.name, jobConfig.name + '.csv')
        );
        resolve()
      }
    }
    
    step();
  })
};
let JobReporter = function () {
  let _queue = [];
  let _fields = [];
  let createQueue = function (fields) {
    _queue = [];
    _fields = fields;
  };
  let appendLine = function (lineItem) {
    _queue.push(lineItem);
  };
  let printReport = function (filePath) {
    return new Promise(function (resolve, reject) {
      let csv = json2csv({data: _queue, fields: _fields});
      fs.writeFile(filePath, csv, function (err) {
        if (err) {
          reject(err);
        }
        resolve()
      });
    });
  };
  return {
    createQueue: createQueue,
    appendLine: appendLine,
    printReport: printReport
  };
};
let findInDir = function (dir, patterns) {
  return glob.sync(patterns, {cwd: dir})
};
module.exports = {
  JobConfig: JobConfig,
  RunJob: RunJob,
  JobQueue: JobQueue,
  JobLoader: JobLoader
};
