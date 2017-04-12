var fs = require('fs');

fs.writeFile('scriptTest.txt', 'Writing text from the NodeJS script.', function(err) {
    if(err) return console.log(err);
    console.log('NodeJS script ran!');
});

process.stdin.setEncoding('utf8');
process.stdin.on('data', function(jsonString) {
    event = JSON.parse(jsonString);
    if( event.type == 'init' ) {
        console.log(event.data.message);
    }
});