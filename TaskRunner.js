/**
 * Created by Christopher on 3/21/2017.
 */
"use strict";
const _ = require('lodash');
const path = require('path');
const fs = require('fs-plus');
const rimraf = require('rimraf');
//
const JobConfig = require('./src/JobRunner').JobConfig;
const JobQueue = require('./src/JobRunner').JobQueue;
const JobLoader = require('./src/JobRunner').JobLoader;
//
//const source = path.resolve(process.cwd(), '_source');
//const dist = path.resolve(process.cwd(), '_out');



let run = function (jsonJSON) {
  console.log('hello world');

  /*
   let jobs = [
   JobConfig(source,
   dist,
   50, // set min jpeg compression, won't compress harder than this
   50, // set scale, 100 = no scale, 50 = 1/2
   40, // set the goal file weight
   'jobOne' // give job a name
   )
   ];*/
  JobLoader(jsonJSON).then(function (jobs) {
    const queue = JobQueue();
    queue.runJobs(jobs).then(function () {
      console.log('All Jobs Done')
    })
  });
};

module.exports = run;