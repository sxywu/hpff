import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var dotSize = 6;
var margin = {top: 20, left: 20};
var width = 15 * 12 * dotSize + 2 * margin.left;
var height = 150;
var sf = 2;

var xScale = d3.scaleTime()
  .domain([new Date('1/1/2002'), new Date('12/31/2016')])
  .range([margin.left, width - margin.left]);
var xAxis = d3.axisBottom()
  .ticks(32)
  .tickFormat(d => d.getMonth() === 0 ? d.getFullYear() : '')
  .scale(xScale);
var sizeScale = d3.scaleLinear()
  .domain([1, 20]).range([2, 5]);

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
    this.months = _.chain(props.dots)
      .groupBy(d => d.month)
      .map(stories => {
        return _.map(stories, (d, i) => {
          var size = sizeScale(d.length);
          var color = props.colors(props.colorScale(d.max.reviews.text));
          return {
            x: xScale(d.month),
            y: height - margin.top - (parseInt(i) + 0.5) * dotSize,
            size,
            color,
          }
        });
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
    var vizStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width,
      height,
    };

    return (
      <div className="Timeline" style={style}>
        <h3>{this.props.pairing}</h3>
        <canvas ref='canvas' style={vizStyle} />
        <svg ref='svg' style={vizStyle} />
      </div>
    );
  }
}

export default Timeline;
