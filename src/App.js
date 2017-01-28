import React, { Component } from 'react';
import './App.css';
import Timeline from './visualizations/Timeline';

import _ from 'lodash';
import * as d3 from 'd3';
import chroma from 'chroma-js';

var numYears = 15;
var colorScale = d3.scaleLog();
var colors = chroma.scale(['#f5d5ca', '#f5d5ca', '#e7b7ce', '#da99d3', '#a2094a']);
    // .range(['#f5d5ca', '#e7b7ce', '#da99d3', , '#a2094a']);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stories: {},
      data: [],
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

  processData(stories) {
    var data = _.chain(stories)
      .values().flatten().value();
    var max = d3.max(data, d => d.reviews.text);
    colorScale.domain([1, max]);

    this.setState({stories, data});
  }

  render() {
    var props = {
      colors,
      colorScale,
    };

    return (
      <div className="App">
        <Timeline {...props} {...this.state} />
      </div>
    );
  }
}

export default App;
