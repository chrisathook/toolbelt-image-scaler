"use strict";
let fs = require('fs');
let path = require('path');
let test = require('./test'); // Plugins support using require.
let taskRunner = require('./TaskRunner');
plugin.onload = init; // triggered when Toolbelt is ready to display this plugin.
function init() {
  test.run(); // Testing out our included module.
  renderInterface();
  pathHandlerSetup();
  setUpRunJobsButton();
  plugin.init(); // We've rendered our elements, now to tell Toolbelt the plugin is ready to be displayed.
  //openFrame();
}
function renderPathForm() {
  let sourceInput = document.querySelector('#sourcePath');
  let outputInput = document.querySelector('#outputPath');
  sourceInput.value = plugin.config.sourcePath;
  outputInput.value = plugin.config.outputPath;
  console.log(111, plugin.config.sourcePath);
  
  let sourceOpenDialog = document.querySelector('#sourceOpenDialog');
  
}
function generateJobHTML(job) {
  let container = document.createElement("div");
  container.className = "jobDisplay";
  let name = job.name.slice(0);
  for (let key in job) {
    let rowDiv = document.createElement("div");
    rowDiv.className = `rowDiv`;
    let rowP = document.createElement('p');
    rowP.innerHTML = key;
    rowDiv.appendChild(rowP);
    let input = document.createElement("input");
    input.type = "text";
    input.className = `${key} jobInput`;
    input.value = job[key];
    input.name = key;
    let inputHandler = function (e) {
      console.log('change', job[key], 'to', input.value);
      job[key] = input.value;
    };
    input.addEventListener('input', inputHandler);
    rowDiv.appendChild(input);
    container.appendChild(rowDiv)
  }
  let jobRemover = function () {
    container.parentNode.removeChild(container);
    plugin.config.jobs = plugin.config.jobs.filter(function (obj) {
      return obj.name !== name;
    });
  };
  let deleteButton = document.createElement("button");
  deleteButton.innerHTML = 'DeleteJob';
  deleteButton.addEventListener('click', jobRemover);
  container.appendChild(deleteButton);
  container.appendChild(document.createElement("hr"));
  return container;
}
function renderJobs(jobsArray) {
  let root = document.querySelector('#jobsRoot');
  for (const job of jobsArray) {
    root.appendChild(generateJobHTML(job));
  }
}
function setUpAddJob() {
  let button = document.querySelector('#createJob');
  let handler = function () {
    let job = {
      "name": 'Job ' + getRandomArbitrary(10, 1000),
      "scale": 100,
      "targetKB": 200,
      "minQuality": 40,
      "suffix": "_WIDTHxHEIGHT"
    };
    plugin.config.jobs.push(job);
    let root = document.querySelector('#jobsRoot');
    root.appendChild(generateJobHTML(job));
  };
  button.addEventListener('click', handler);
}
// initial render.
function renderInterface() {
  // Plugins have access to the DOM of the index.html file this script was loaded in.
  //var paragraphElement = document.createElement('p');
  //paragraphElement.innerHTML = 'Some example text.';
  //document.body.appendChild(paragraphElement);
  renderPathForm();
  renderJobs(plugin.config.jobs);
  setUpAddJob();
}
// event handlers
function pathHandlerSetup() {
  let sourceInput = document.querySelector('#sourcePath');
  let outputInput = document.querySelector('#outputPath');
  let sourceOpen = document.querySelector('#sourceOpen');
  let outputOpen = document.querySelector('#outputOpen');
  
  
  let sourcePathChangeHandler = function (e){
  
    console.log ("!!!!!! ",e.target.files)
  
  };
  
  
  sourceOpenDialog.addEventListener('change',sourcePathChangeHandler);
  
  
  let sourceChangeHandler = function (e) {
    console.log(e);
    sourceInput.value = sourceOpen.files[0].path;
    plugin.config.sourcePath = sourceInput.value;
  };
  let outChangeHandler = function (e) {
    console.log(e);
    outputInput.value = outputOpen.files[0].path;
    plugin.config.outputPath = outputInput.value;
  };
  sourceOpen.addEventListener('change', sourceChangeHandler);
  outputOpen.addEventListener('change', outChangeHandler);
}
function setUpRunJobsButton() {
  let runButton = document.querySelector('#runJobs');
  let runButtonHandler = function (e) {
    let status = document.querySelector('#clobber').checked;
    console.log('checked ', status);
  
    runButton.disabled = true;
    
    let frame = plugin.createFrame('Plugin Template Frame', {
      width: 300,
      height: 250,
      x: plugin.frame.width - 5,
      y: plugin.frame.y
    });
    frame.document.body.innerHTML = '<span style="color:white">Jobs Running</span><br/><br/>';
    
    let newConsole = {};
    newConsole.log = function (){
      
      let content = Array.prototype.slice.call(arguments).join(' ');
      console.log (content);
      frame.document.body.innerHTML+='<span style="color:white">'+  content +'</span><br/>'
      
    };
    
    
    taskRunner(plugin.config, status,newConsole)
      .then (function (value){
        runButton.disabled = false;
        frame.document.body.innerHTML += '<span style="color:white">Jobs Done</span><br/><br/>';
        
      })
      .catch(function (value) {
        runButton.disabled = false;
        frame.document.body.innerHTML += `<span style="color:white">Job Failed <br/><br/> ${value}</span> `;
      })
  };
  runButton.addEventListener('click', runButtonHandler);
}
function setupCheckbox() {
  let settingsCheckbox = document.querySelector('#some-setting');
  // The Plugin config object can be modified and added to for saving settings and state of the plugin. This is saved to the project when a user runs "Save Project".
  let isChecked = plugin.config.someSetting; // Retrieve the latest value from the plugin config. When a plugin is loaded, it pulls in the most recent saved config for this plugin into plugin.config.
  settingsCheckbox.checked = plugin.config.someSetting || false; // Default is false if plugin.config.someSetting doesn't exist.
  settingsCheckbox.onclick = () => {
    plugin.config.someSetting = settingsCheckbox.checked; // Update our config with the checkbox's latest state.
  }
}
function runNodeScript() {
  // runScript returns a Node Runner instance. Node Runner runs the given script through an instance of NodeJS. Useful for scripts that weren't designed to run in an Electron environment.
  let runner = plugin.runScript('./script.js'); // Run NodeJS script.
  runner.ondata = function (msg) { // Fires when the script runs console.log() or stdout.write()
    console.log('From Node process:', msg);
  };
  runner.sendData('init', {message: 'Sending data to a runner instance.'});
}
function openFrame() {
  let frame = plugin.createFrame('Plugin Template Frame', {
    width: 300,
    height: 250,
    x: plugin.frame.width - 5,
    y: plugin.frame.y
  });
  frame.document.body.innerHTML = 'Hello World!';
}
function writeTestFile() {
  let projectPath = app.projectPath; // The current project folder of the current tab view.
  let testFile = path.join(projectPath, 'pluginTest.txt')
  fs.writeFile(testFile, 'Writing text from the plugin!', function (err) {
    if (err) return console.log(err);
    console.log('Wrote file from plugin.')
  });
}
function getRandomArbitrary(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}