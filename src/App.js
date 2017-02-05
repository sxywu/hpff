import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import chroma from 'chroma-js';

import './App.css';
import Timeline from './visualizations/Timeline';
import dates from './data/dates.json';
import allGifs from './data/gifs.json';
var gifs = _.map(allGifs.all, file =>
  [file.replace('.gif', ''), require('./images/gifs/' + file)]);
var gifsNested = allGifs.nested;

var numYears = 15;
var colorScale = d3.scaleLog();
var colors = chroma.scale(['#f5d5ca', '#f5d5ca', '#da99d3', '#a2094a']);
    // .range(['#f5d5ca', '#e7b7ce', '#da99d3', , '#a2094a']);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stories: {},
      pairings: {},
      metadata: {},
      dots: {},
      pairing: 'Ron/Hermione',
    };
  }

  componentWillMount() {
    _.each(dates, date => {
      date[2] = new Date(date[2]);
    });

    _.times(numYears, i => {
      var year = 2002 + i;
      d3.json(process.env.PUBLIC_URL + '/years/' + year + '.json', data => {
        var stories = this.state.stories;
        stories[year] = _.map(data, d => {
          d.reviews.text = parseInt(d.reviews.text);
          d.published = new Date(d.published);
          d.updated = new Date(d.updated);
          d.publishGroup = d3.timeMonth.floor(d.published);

          return d;
        });

        this.processData(stories);
      });
    });
  }

  getPairingsAndMetadata(pairings, metadata, d, pairing) {
    if (!pairings[pairing]) {
      pairings[pairing] = {};
    }
    if (!pairings[pairing][d.publishGroup]) {
      pairings[pairing][d.publishGroup] = [];
    }
    pairings[pairing][d.publishGroup].push(d);

    if (!metadata[pairing]) {
      metadata[pairing] = {
        genres: {},
        pairings: {},
        reviews: [],
      };
    }
    _.each(d.genres, genre => {
      if (!metadata[pairing].genres[genre]) {
        metadata[pairing].genres[genre] = 0;
      }
      metadata[pairing].genres[genre] += 1;
    });
    _.each(d.pairings, p => {
      if (p === pairing) return;

      if (!metadata[pairing].pairings[p]) {
        metadata[pairing].pairings[p] = 0;
      }
      metadata[pairing].pairings[p] += 1;
    });
    metadata[pairing].reviews.push(d.reviews.text);
  }

  processData(stories) {
    // don't start processing data until all the data is back
    if (_.size(stories) !== numYears) {
      return this.setState({stories});
    }

    var data = _.chain(stories)
      .values().flatten().value();
    // var max = d3.max(data, d => d.reviews.text);
    colorScale.domain([1, 10000]);

    // first get all pairings
    var pairings = {};
    var metadata = {}
    _.each(data, d => {
      if (!d.pairings.length) {
        return this.getPairingsAndMetadata(pairings, metadata, d, 'No Pairing');
      }
      // _.each(d.pairings, pairing => {
        this.getPairingsAndMetadata(pairings, metadata, d, d.pairings[0]);
      // });
    });

    var dots = _.mapValues(pairings, (months, pairing) => {
        return _.chain(months)
          .map(stories => {
            var i = -1;
            return _.chain(stories)
              .sortBy(d => d.published)
              .groupBy(d => {
                i += 1;
                return Math.floor(i / 10);
              }).map((stories, i) => {
                return {
                  pairing,
                  extent: d3.extent(stories, story => story.published),
                  month: stories[0].publishGroup,
                  max: _.maxBy(stories, story => story.reviews.text),
                  length: stories.length,
                };
              }).value();
          }).flatten().value();
      });

    console.log(pairings, dots)
    this.setState({stories, pairings, dots, metadata});
  }

  render() {
    var props = {
      colors,
      colorScale,
      gray: '#665059',
      dates,
      gifs,
      gifsNested,
    };

    var timelineData = {
      pairing: this.state.pairing,
      dots: this.state.dots[this.state.pairing] || [],
    };

    return (
      <div className="App">
        <Timeline {...props} {...timelineData} />
      </div>
    );
  }
}

export default App;
