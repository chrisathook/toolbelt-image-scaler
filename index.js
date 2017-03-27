plugin.onload = init; // triggered when Toolbelt is ready to display the app.

function init(){

  var paragraphElement = document.createElement('p');
  paragraphElement.innerHTML = 'Some example text.'

  document.body.appendChild(paragraphElement);

  plugin.init(); // we've rendered our elements, now to tell Toolbelt the plugin is ready to show.

}