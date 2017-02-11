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
  .y1(d => height - margin.top - d.length * dotSize)
  .curve(d3.curveStep);

class Genre extends Component {

  componentDidMount() {
    this.container = d3.select(this.refs.container);

    this.area = this.container.append('path')
      .attr('opacity', .1);
    this.line = this.container.append('path')
      .attr('opacity', .75)
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    this.annotations = this.container.append('g');
    this.axis = this.annotations.append('g')
      .attr('transform', 'translate(' + [0, height - margin.top] + ')')
      .call(xAxis);
    this.title = this.annotations.append('text')
      .attr('x', margin.left)
      .attr('text-anchor', 'start')
      .attr('dy', '.35em');

    this.renderArea(this.props);
    this.renderDates();
    this.renderTitle(this.props);
  }

  shouldComponentUpdate(nextProps) {
    this.renderArea(nextProps);
    this.renderTitle(nextProps);

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

    height = Math.max(yMax * dotSize + 2 * margin.top, 40);
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

  renderDates() {
    var y = 0;
    var dates = this.annotations.selectAll('.date')
      .data(this.props.dates).enter().append('g')
      .classed('date', true)
      .attr('transform', d => 'translate(' + [xScale(d[2]), y] + ')');

    dates.append('line')
      .attr('y2', height - margin.top - y)
      .attr('stroke', this.props.gray)
      .attr('stroke-dasharray', d => d[3] === 'film' ? 'none' : '5 5')
      .attr('opacity', 0.2);
  }

  renderTitle(props) {
    var fontSize = 14;
    var length = d3.format(',')(props.stories.length);

    this.title
      .attr('y', fontSize / 2)
      .attr('font-size', fontSize - 2)
      .text(props.genre + ' (' + length + ' stories)');
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
