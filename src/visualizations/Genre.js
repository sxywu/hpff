import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var dotSize = 5;
var margin = {top: 5, left: 20};
var width = 16 * 12 * dotSize + 2 * margin.left;
var height = 60;

var xScale = d3.scaleTime()
  .domain([new Date('2/1/2001'), new Date('12/31/2016')])
  .range([margin.left, width - margin.left]);
var xAxis = d3.axisBottom()
  .ticks(30)
  .tickFormat('')
  // .tickFormat(d => d.getMonth() === 0 ? d.getFullYear() : '')
  .tickSize(0)
  .scale(xScale);
var line = d3.line()
  .x(d => xScale(d.date))
  .y(d => height - margin.top - d.length * dotSize)
  .curve(d3.curveStep);
var area = d3.area()
  .x(d => xScale(d.date))
  .y0(d => height - margin.top)
  .y1(d => height - margin.top -  d.length * dotSize)
  .curve(d3.curveStep);

class Genre extends Component {

  componentDidMount() {
    this.container = d3.select(this.refs.container);
    // axis
    this.axis = this.container.append('g')
      .attr('transform', 'translate(' + [0, height - margin.top] + ')')
      .call(xAxis);
    this.area = this.container.append('path')
      .attr('opacity', .1);
    this.line = this.container.append('path')
      .attr('opacity', .75)
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    this.renderArea(this.props);
  }

  shouldComponentUpdate(nextProps) {
    this.renderArea(nextProps);
    return false;
  }

  renderArea(props) {
    var [start, end] = xScale.domain();
    var yMax = 0;
    var data = _.map(d3.timeMonth.range(start, end), date => {
      var length = props.months[date] ? props.months[date].length : 0;
      length = Math.ceil(length / 5);
      yMax = Math.max(yMax, length);
      return {date, length};
    });

    height = Math.max(yMax * dotSize + 2 * margin.top, 50);
    this.container.attr('height', height);
    this.axis.attr('transform', 'translate(' + [0, height - margin.top] + ')');

    var opacity = 0.85;
    var fill = props.annotations[props.pairing].canon ?
      props.colors1(opacity) : props.colors2(opacity)
    this.area
      .datum(data)
      .attr('d', area)
      .attr('fill', fill);
    this.line
      .datum(data)
      .attr('d', line)
      .attr('stroke', fill);
  }

  render() {
    return (
      <div>
        <svg ref='container' width={width} height={height}/>
      </div>
    );
  }
}

export default Genre;
