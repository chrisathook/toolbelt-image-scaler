var fs = require('fs');
var path = require('path');
var test = require('./test'); // Plugins support using require.

plugin.onload = init; // triggered when Toolbelt is ready to display this plugin.

function init() {

  test.run(); // Testing out our included module.

  renderInterface();
  setupCheckbox();
  runNodeScript();
  writeTestFile();

  plugin.init(); // We've rendered our elements, now to tell Toolbelt the plugin is ready to be displayed.

  openFrame();

}

function renderInterface() {
  // Plugins have access to the DOM of the index.html file this script was loaded in.
  var paragraphElement = document.createElement('p');
  paragraphElement.innerHTML = 'Some example text.';

  document.body.appendChild(paragraphElement);
}

function setupCheckbox() {
  var settingsCheckbox = document.querySelector('#some-setting');
  // The Plugin config object can be modified and added to for saving settings and state of the plugin. This is saved to the project when a user runs "Save Project".
  var isChecked = plugin.config.someSetting; // Retrieve the latest value from the plugin config. When a plugin is loaded, it pulls in the most recent saved config for this plugin into plugin.config.

  settingsCheckbox.checked = plugin.config.someSetting || false; // Default is false if plugin.config.someSetting doesn't exist.

  settingsCheckbox.onclick = () => {
    plugin.config.someSetting = settingsCheckbox.checked; // Update our config with the checkbox's latest state.
  }
}

function runNodeScript() {
  // runScript returns a Node Runner instance. Node Runner runs the given script through an instance of NodeJS. Useful for scripts that weren't designed to run in an Electron environment.

  var runner = plugin.runScript('./script.js'); // Run NodeJS script.

  runner.ondata = function(msg){ // Fires when the script runs console.log() or stdout.write()
    console.log('From Node process:', msg);
  }

  runner.sendData('init', {message: 'Sending data to a runner instance.'});
}

function openFrame(){
  var frame = plugin.createFrame('Plugin Template Frame', {
    width: 300,
    height: 250,
    x: plugin.frame.width - 5,
    y: plugin.frame.y
  });

  frame.document.body.innerHTML = 'Hello World!';
}

function writeTestFile() {
  var projectPath = app.projectPath; // The current project folder of the current tab view.
  var testFile = path.join(projectPath, 'pluginTest.txt')

  fs.writeFile(testFile, 'Writing text from the plugin!', function(err) {
    if(err) return console.log(err);
    console.log('Wrote file from plugin.')
  });
}