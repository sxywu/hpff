var http = require('http');
var html2json = require('html2json').html2json;
var _ = require('lodash');
var fs = require('fs');

var allStories = [];
function getPage(i) {
  console.log('page ' + i);

  http.get('http://www.harrypotterfanfiction.com/storysearch.php?&srt=2&sctlab=' + i, res => {
    let rawData = '';
    res.on('data', (chunk) => rawData += chunk);
    res.on('end', () => {
      try {
        let parsedData = html2json(rawData);
        getStories(parsedData);
        getPage(i + 1);
      } catch (e) {
        console.log(e.message);
      }
    });
  });
}

function getStories(node) {
  var body = _.find(node.child, child => child.tag === 'body');
  var layer1 = _.find(body.child, child => child.attr && child.attr.id === 'layer1');
  var layer2 = _.find(layer1.child, child => child.attr && child.attr.id === 'layer2');
  var layer3 = _.find(layer2.child, child => child.attr && child.attr.id === 'layer3');
  var mainpage2 = _.find(layer3.child, child => child.attr && child.attr.id === 'mainpage2');
  var center = _.find(mainpage2.child, child => child.attr && child.attr.align === 'center');
  var table = _.find(center.child, child => child.tag === 'table');

  _.chain(table.child)
    .filter(child => child.tag === 'tr')
    .each(story => {
      var obj = {};

      var title = story.child[0].child[0].child[3];
      obj.title = {
        link: _.isArray(title.attr.href) ? _.last(title.attr.href) : title.attr.href,
        text: title.child ? title.child[0].text : '',
      };
      var author = story.child[0].child[0].child[5];
      obj.author = {
        link: _.isArray(author.attr.href) ? _.last(author.attr.href) : author.attr.href,
        text: author.child ? author.child[0].text : '',
      };
      var reviews = _.last(story.child[0].child[0].child);
      obj.reviews = {
        link: reviews.attr.href,
        text: reviews.child[0].text,
      };
      // obj.description = _.chain(story.child[0].child)
      //   .slice(1, story.child[0].child.length - 2)
      //   .filter(child => child.tag !== 'br' && child.text !== '\n')
      //   .value();

      var storydata = _.find(story.child[0].child,
          child => child.attr && child.attr.class === 'storydata');

      var genreIndex = getMetaData(storydata, 'Genres:');
      if (genreIndex > -1) {
        obj.genres = _.map(storydata.child[genreIndex + 1].text
          .replace('&nbsp;&nbsp;', '').split(', '), d => d.trim());
      }
      var eraIndex = getMetaData(storydata, 'Era:');
      if (eraIndex > -1) {
        obj.era = storydata.child[eraIndex + 1].text.replace('&nbsp;&nbsp;', '').trim();
      }
      var charactersIndex = getMetaData(storydata, 'Characters: ');
      if (charactersIndex > -1) {
        obj.characters = _.map(storydata.child[charactersIndex + 1].text
          .replace('&nbsp;&nbsp;', '').split(', '), d => d.trim());
      }
      var publishedIndex = getMetaData(storydata, 'Published:');
      if (publishedIndex > -1) {
        obj.published = storydata.child[publishedIndex + 1].text
          .replace('&nbsp;&nbsp;', '').trim();
      }
      var updatedIndex = getMetaData(storydata, 'Latest Chapter:');
      if (updatedIndex > -1) {
        obj.updated = storydata.child[updatedIndex + 1].text
          .replace('&nbsp;&nbsp;', '').trim();
      }

      allStories.push(obj);
    }).value();

  fs.writeFileSync('./stories.json', JSON.stringify(allStories));
}

function getMetaData(storydata, text) {
  var index = 0;
  var exists = _.some(storydata.child, child => {
    if (child.child && child.child[0].text === text) {
      return true;
    }
    index += 1;
  });
  return exists ? index : -1;
}

getPage(1);
