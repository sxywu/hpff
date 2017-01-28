import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var dotSize = 6;
var margin = {top: 20, left: 20};
var width = 15 * 12 * dotSize + 2 * margin.left;
var height = 130;
var sf = 2;

var xScale = d3.scaleTime()
  .domain([new Date('1/1/2002'), new Date('12/31/2016')])
  .range([margin.left, width - margin.left]);
var xAxis = d3.axisBottom()
  .ticks(32)
  .tickFormat(d => d.getMonth() === 0 ? d.getFullYear() : '')
  .scale(xScale);
var sizeScale = d3.scaleLinear()
  .domain([1, 100]).range([3, 5]);

class Timeline extends Component {

  componentDidMount() {
    this.crispyCanvas(this.refs.canvas, this.props, 'canvas');
    this.calculateData(this.props);
    this.renderData(this.props);

    d3.select(this.refs.svg)
      .append('g').attr('transform', 'translate(' + [0, height - margin.top] + ')')
      .call(xAxis);
  }

  shouldComponentUpdate(nextProps) {
    this.calculateData(nextProps);
    this.renderData(nextProps);

    return false;
  }

  crispyCanvas(canvas, props, name) {
    canvas.width = width * sf;
    canvas.height = height * sf;
    canvas.style.width = width + 'px';
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
              x: xScale(stories[0].publishGroup),
              y: height - margin.top - (parseInt(i) + 0.5) * dotSize,
              size,
              color,
            }
          }).value();
      }).flatten().value();
  }

  renderData(props) {
    this.canvas.clearRect(0, 0, width, height);
    // this.canvas.globalCompositeOperation = 'overlay';

    _.each(this.months, month => {
      this.canvas.beginPath();
      this.canvas.fillStyle = month.color;
      this.canvas.arc(month.x, month.y, month.size / 2, 0, 2 * Math.PI, false);
      this.canvas.fill();
    });
  }

  render() {
    var style = {
      position: 'relative',
      width,
      height,
    };
    var svgStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width,
      height,
    };

    return (
      <div className="Timeline" style={style}>
        <canvas ref='canvas' />
        <svg ref='svg' style={svgStyle} />
      </div>
    );
  }
}

export default Timeline;
