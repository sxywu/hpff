import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var height = 250;
var dotSize = 7;
var xScale = d3.scaleTime()
  .domain([new Date('1/1/2002'), new Date('11/1/2016')])
  .range([0, 15 * 6 * dotSize]);
var sizeScale = d3.scaleLinear()
  .domain([1, 100]).range([3, 5]);
var sf = 2;

class Timeline extends Component {

  componentDidMount() {
    this.crispyCanvas(this.refs.canvas, this.props, 'canvas');
    this.calculateData(this.props);
    this.renderData(this.props);
  }

  shouldComponentUpdate(nextProps) {
    this.calculateData(nextProps);
    this.renderData(nextProps);

    return false;
  }

  crispyCanvas(canvas, props, name) {
    canvas.width = props.width * sf;
    canvas.height = height * sf;
    canvas.style.width = props.width + 'px';
    canvas.style.height = height + 'px';
    this[name] = canvas.getContext('2d');
    this[name].scale(sf, sf);
  }

  calculateData(props) {
    // group data by months
    this.months = _.chain(props.data)
      .groupBy(d => d.publishGroup)
      .map(stories => {
        // first sort by number of reviews
        var i = -1;
        return _.chain(stories)
          // .sortBy(d => -d.reviews.text)
          .groupBy(d => {
            i += 1;
            return Math.floor(i / 100);
          }).map((stories, i) => {
            var size = sizeScale(stories.length);
            var ratings = d3.max(stories, d => d.reviews.text);
            var color = props.colors(props.colorScale(ratings));
            return {
              x: xScale(stories[0].publishGroup) + dotSize / 2,
              y: height - (parseInt(i) + 0.5) * dotSize,
              size,
              color,
            }
          }).value();
      }).flatten().value();
  }

  renderData(props) {
    this.canvas.clearRect(0, 0, props.width, height);
    // this.canvas.globalCompositeOperation = 'overlay';

    _.each(this.months, month => {
      this.canvas.beginPath();
      this.canvas.fillStyle = month.color;
      this.canvas.arc(month.x, month.y, month.size / 2, 0, 2 * Math.PI, false);
      this.canvas.fill();
    });
  }

  render() {
    return (
      <div className="Timeline">
        <canvas ref='canvas' />
      </div>
    );
  }
}

export default Timeline;
