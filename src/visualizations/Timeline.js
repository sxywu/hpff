import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var dotSize = 5;
var margin = {top: 20, left: 20};
var width = 16 * 12 * dotSize + 2 * margin.left;
var height = 200;

var numTicks = 32;
var xScale = d3.scaleTime()
  .domain([new Date('2/1/2001'), new Date('12/31/2016')])
  .range([margin.left, width - margin.left]);
var yScale = d3.scaleLinear()
  .range([height - margin.top, margin.top]);
var xAxis = d3.axisBottom()
  .ticks(numTicks)
  .tickFormat(d => d.getMonth() === 0 ? d.getFullYear() : '')
  .tickSizeOuter(0)
  .scale(xScale);
var area = d3.area()
  .x(d => xScale(d.date))
  .y1(d => yScale(d.length))
  .y0(yScale(0))
  .curve(d3.curveCatmullRom);

class Timeline extends Component {

  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.container.append('g')
      .attr('transform', 'translate(' + [0, height - margin.top] + ')')
      .call(xAxis);
    this.histogram = this.container.append('g')
      // .attr('fill-opacity', 0.5);
    this.lines = this.container.append('g');
    this.annotations = this.container.append('g');

    this.renderDates();
    this.renderLines(this.props);
  }

  shouldComponentUpdate(nextProps) {
    this.renderLines(nextProps);

    return false;
  }

  renderLines(props) {
    var yMax = _.chain(props.pairings)
      .map(months => _.map(months, stories => stories.length))
      .flatten().max().value()
    yScale.domain([0, yMax]).nice();

    var data = _.map(props.pairings, months => {
      return _.chain(months)
        .sortBy(d => d[0].publishGroup)
        .map(stories => {
          return {
            length: stories.length,
            date: stories[0].publishGroup,
          }
        }).value();
    });

    var lines = this.lines.selectAll('.line').data(data);
    lines.exit().remove();

    lines.enter().append('path')
      .classed('line', true)
      .attr('d', area)
      .attr('fill', props.pink)
      .attr('fill-opacity', 0.25);
  }


  renderDates() {
    var fontSize = 10;
    var y = height * 0.15;
    var dates = this.annotations.selectAll('date')
      .data(this.props.dates).enter().append('g')
      .classed('date', true)
      .attr('transform', d => 'translate(' + [xScale(d[2]), y] + ')');

    dates.append('line')
      .attr('y1', d => d[0] === 5 && d[3] === 'film' ? -1.5 * fontSize : 0)
      .attr('y2', height - margin.top - y)
      .attr('stroke', this.props.gray)
      // .attr('stroke-dasharray', d => d[3] === 'book' ? 'none' : '5 5')
      .attr('opacity', 0.5);

    dates.append('circle')
      .attr('cy', d => d[0] === 5 && d[3] === 'film' ? -1.5 * fontSize : 0)
      .attr('r', (fontSize + 2) / 2)
      .attr('fill', d => d[3] === 'book' ? this.props.gray : '#fff')
      .attr('stroke', this.props.gray)
      .attr('stroke-width', 2);

    dates.append('text')
      .attr('y', d => d[0] === 5 && d[3] === 'film' ? -1.5 * fontSize : 0)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', d => d[3] === 'book' ? '#fff' : this.props.gray)
      .attr('font-size', fontSize)
      .attr('font-weight', 600)
      .text(d => d[0]);
  }

  render() {
    return (
      <svg ref='container' width={width} height={height} />
    );
  }
}

export default Timeline;
