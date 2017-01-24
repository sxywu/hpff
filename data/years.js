var fs = require('fs');
var _ = require('lodash');

var stories = fs.readFileSync('./stories.json', 'utf-8');
stories = JSON.parse(stories);

_.chain(stories)
  .groupBy(story => (new Date(story.published)).getFullYear())
  .map((stories, year) => {
    if (year !== 'NaN') {
      stories = _.map(stories, story => {
        story.title.link = story.title.link.replace(/\'/g, '');
        return story;
      });

      fs.writeFileSync('./years/' + year + '.json', JSON.stringify(stories));
    }
  }).value()
