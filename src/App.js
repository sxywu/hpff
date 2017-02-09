import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import chroma from 'chroma-js';

import './App.css';
import Timeline from './visualizations/Timeline';
import Reviews from './visualizations/Reviews';
import Graph from './visualizations/Graph';

import dates from './data/dates.json';
import annotations from './data/annotations.json';
import allGifs from './data/gifs.json';
var gifs = _.map(allGifs.all, file =>
  [file.replace('.gif', ''), require('./images/gifs/' + file)]);
var gifsNested = allGifs.nested;

var numYears = 15;
var colorScale = d3.scaleLog();
var cream = '#fff1ec';
var purple = '#ad32ed';
var pink = '#ed3282';
var gray = '#665059';
var colors1 = chroma.scale([cream, cream, '#f183a6', pink]);
var colors2 = chroma.scale([cream, cream, '#e3acd2', purple]);
    // .range(['#f5d5ca', '#e7b7ce', '#da99d3', , '#a2094a']);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      stories: {},
      pairings: {},
      genres: {},
      selected: 'Hermione',
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

  getPairingsAndMetadata(pairings, genres, d, pairing) {
    if (pairing === 'Other Pairing' || pairing === 'Others' ||
      pairing === 'No Pairing' || pairing === 'undefined') return;

    if (!pairings[pairing]) {
      pairings[pairing] = {};
    }
    if (!pairings[pairing][d.publishGroup]) {
      pairings[pairing][d.publishGroup] = [];
    }
    pairings[pairing][d.publishGroup].push(d);

    _.each(d.genres, genre => {
      if (!genre || genre === 'Romance') return;

      if (!genres[pairing]) {
        genres[pairing] = {};
      }
      if (!genres[pairing][genre]) {
        genres[pairing][genre] = [];
      }
      genres[pairing][genre].push(d);
    });
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
    var genres = {}
    _.each(data, d => {
      // only remember pairings we have in our graph/annotations
      if (!annotations[d.pairings[0]]) return;
      this.getPairingsAndMetadata(pairings, genres, d, d.pairings[0]);
    });

    this.setState({stories, data, pairings, genres});
  }

  render() {
    var props = {
      colors1,
      colors2,
      colorScale,
      cream, pink, purple, gray,
      dates,
      gifs,
      gifsNested,
      annotations,
    };

    var pairings = _.chain(this.state.pairings)
      .filter((dots, pairing) => _.includes(pairing, this.state.selected))
      .sortBy(dots => -1 * _.sumBy(_.values(dots), d => d.length)).value();
    // get pairings for selected character
    var reviews = _.map(pairings, dots => <Reviews {...props} dots={dots} />);

    return (
      <div className="App">
        <Graph {...props} {...this.state} />
        <Timeline {...props} {...this.state} pairings={pairings} />
        {reviews}
      </div>
    );
  }
}

export default App;
