import React, { Component } from 'react';
import './App.css';
import Timeline from './visualizations/Timeline';

import _ from 'lodash';
import * as d3 from 'd3';
import chroma from 'chroma-js';

var numYears = 15;
var colorScale = d3.scaleLog();
var colors = chroma.scale(['#f5d5ca', '#f5d5ca', '#f5d5ca', '#da99d3', '#a2094a']);
    // .range(['#f5d5ca', '#e7b7ce', '#da99d3', , '#a2094a']);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stories: {},
      pairings: {},
      metadata: {},
    };
  }

  componentWillMount() {
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
    if (_.size(stories) !== numYears) {
      return this.setState({stories});
    }

    var data = _.chain(stories)
      .values().flatten().value();
    var max = d3.max(data, d => d.reviews.text);
    colorScale.domain([1, max]);

    // first get all pairings
    var pairings = {};
    var metadata = {}
    _.each(data, d => {
      if (!d.pairings.length) {
        this.getPairingsAndMetadata(pairings, metadata, d, 'No Pairing');
      }
      _.each(d.pairings, pairing => {
        this.getPairingsAndMetadata(pairings, metadata, d, pairing);
      });
    });

    pairings = _.mapValues(pairings, (months, pairing) => {
        return _.chain(months)
          .map(stories => {
            var i = -1;
            return _.chain(stories)
              .sortBy(d => d.published)
              .groupBy(d => {
                i += 1;
                return Math.floor(i / 20);
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

          console.log(pairings);
    this.setState({stories, pairings, metadata});
  }

  render() {
    var props = {
      colors,
      colorScale,
    };

    var timelines = _.chain(this.state.pairings)
      .filter(d => d.length > 10)
      .sortBy(d => -d.length)
      .map(dots => {
        var pairing = dots[0].pairing;
        var data = {
          dots,
          pairing,
          metadata: this.state.metadata[pairing]
        };
        return <Timeline {...props} {...data} />
      }).value();

    return (
      <div className="App">
        {timelines}
      </div>
    );
  }
}

export default App;
