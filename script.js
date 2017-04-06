var fs = require('fs');

fs.writeFile('scriptTest.txt', 'Writing text from the NodeJS script.', function(err) {
    if(err) return console.log(err);
    console.log('NodeJS script ran!');
});