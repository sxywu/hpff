var fs = require('fs');
var _ = require('lodash');
var d3 = require('d3');

var stories = fs.readFileSync('./stories.json', 'utf-8');
stories = JSON.parse(stories);

stories = _.chain(stories)
  .groupBy(story => (new Date(story.published)).getFullYear())
  .map((stories, year) => {
    if (year !== 'NaN') {
      stories = _.map(stories, story => {
        story.title.link = story.title.link.replace(/\'/g, '');
        story.pairings = _.map(story.pairings, pair => {
          if (pair !== 'undefined' && pair !== 'Other Pairing') {
            pair = _.map(pair.split('/'), character => {
              if ((character === 'James' || character === 'Lily')
                && story.era === 'Next Generation') {
                character += ' (II)';
              }
              return character;
            }).join('/');
          }

          return pair;
        });

        return story;
      });

      // fs.writeFileSync('./years/' + year + '.json', JSON.stringify(stories));
    }

    return stories;
  }).flatten().value()

var pairings = _.chain(stories)
  .map('pairings')
  .flatten()
  .countBy()
  .toPairs()
  .sortBy(d => -d[1]).value();

var characters = _.chain(stories)
  .map('characters')
  .flatten()
  .countBy()
  .toPairs()
  .sortBy(d => -d[1]).value();

var genres = _.chain(stories)
  .map('genres')
  .flatten()
  .countBy()
  .toPairs()
  .sortBy(d => -d[1]).value();

var era = _.chain(stories)
  .map('era')
  .countBy()
  .toPairs()
  .sortBy(d => -d[1]).value();

var time = _.chain(stories)
  .map(story => d3.timeMonth.floor(new Date(story.published)))
  .countBy()
  .toPairs()
  .sortBy(d => -d[1]).value();

var pairingsByYear = {};
_.each(stories, story => {
  var year = (new Date(story.published)).getFullYear();
  _.each(story.pairings, pairing => {
    if (!pairingsByYear[pairing]) {
      pairingsByYear[pairing] = {};
    }
    if (!pairingsByYear[pairing][year]) {
      pairingsByYear[pairing][year] = 0;
    }
    pairingsByYear[pairing][year] += 1;
  });
});

console.log(pairings);
console.log(genres)
console.log(era)
console.log(time)
