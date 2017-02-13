import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import chroma from 'chroma-js';

import './App.css';
import Timeline from './visualizations/Timeline';
import Pairing from './visualizations/Pairing';
import Graph from './visualizations/Graph';
import Footer from './Footer';

import dates from './data/dates.json';
import annotations from './data/annotations.json';
import allGifs from './data/gifs.json';
var gifs = _.map(allGifs.all, file =>
  [file.replace('.gif', ''), require('./images/gifs/' + file)]);
var gifsNested = allGifs.nested;
import positions from './data/positions.json';
var characters = _.map(positions, node => {
  return Object.assign(node, {
    image: require('./images/characters/' + node.name + '.svg'),
  })
});

var numYears = 15;
var colorScale = d3.scaleLog();
var cream = '#fff1ec';
var purple = '#ad32ed';
var pink = '#ed3282';
var gray = '#665059';
var colors1 = chroma.scale([cream, cream, '#f183a6', pink]);
var colors2 = chroma.scale([cream, cream, '#e3acd2', purple]);
    // .range(['#f5d5ca', '#e7b7ce', '#da99d3', , '#a2094a']);
var keepGenres = ['Drama', 'Humor', 'Angst', 'Fluff',
  'Action/Adventure', 'Horror/Dark', 'Mystery'];

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
    // https://daveceddia.com/avoid-bind-when-passing-props/, way #5
    this.selectCharacter = this.selectCharacter.bind(this);
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
      if (!genre || !_.includes(keepGenres, genre)) return;

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

  selectCharacter(node) {
    this.setState({selected: node.name});
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
      characters,
      selectCharacter: this.selectCharacter,
      transition: d3.transition().duration(1000),
    };

    var pairings = _.chain(this.state.pairings)
      .filter((dots, pairing) => _.includes(pairing, this.state.selected))
      .sortBy(dots => -1 * _.sumBy(_.values(dots), d => d.length)).value();
    // get pairings for selected character
    var details = _.map(pairings, stories => {
      var pairing = _.values(stories)[0][0].pairings[0];
      var genres = this.state.genres[pairing];
      return <Pairing {...props} {...this.state} pairing={pairing}
        genres={genres} stories={stories} />;
    });

    return (
      <div className="App">
        <Graph {...props} {...this.state} />
        <Timeline {...props} {...this.state} pairings={pairings} />
        {details}
        <Footer {...props} {...this.state} />
      </div>
    );
  }
}

export default App;
