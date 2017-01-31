var fs = require('fs');
var _ = require('lodash');

var files = fs.readdirSync('../src/images');
files = _.filter(files, gif => _.includes(gif, '.gif'));

var guys = ['dean', 'draco', 'harry', 'krum', 'neville', 'ron'];

var gifs = {};
_.each(files, file => {
  var guy = _.find(guys, guy => _.includes(file, guy));
  var girl = file.replace(guy, '').replace(/\d\-?\d?\.gif/, '');
  var movie = file.match(/(\d)\-?\d?\.gif/)[1];
  var pairing = _.capitalize(guy) + '/' + _.capitalize(girl);
  if (guy === 'Krum') {
    pairing = _.capitalize(girl) + '/' + _.capitalize(guy);
  }

  if (!gifs[pairing]) {
    gifs[pairing] = {};
  }
  if (!gifs[pairing][movie]) {
    gifs[pairing][movie] = [];
  }
  gifs[pairing][movie].push(file.replace('.gif', ''));
});

console.log(gifs);

var data = {
  nested: gifs,
  all: files,
}

fs.writeFileSync('../src/data/gifs.json', JSON.stringify(data));
