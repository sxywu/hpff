import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var dotSize = 5;
var margin = {top: 20, left: 20};
var width = 16 * 12 * dotSize + 2 * margin.left;
var height = 300;

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
var line = d3.line()
  .x(d => xScale(d.date))
  .y(d => yScale(d.top))
  .curve(d3.curveCatmullRom);
var area = d3.area()
  .x(d => xScale(d.date))
  .y0(d => yScale(d.bottom))
  .y1(d => yScale(d.top))
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
    this.calculateLines(this.props);
    this.renderLines(this.props);
  }

  shouldComponentUpdate(nextProps) {
    this.calculateLines(nextProps);
    this.renderLines(nextProps);

    return false;
  }

  calculateLines(props) {
    // props.pairings is an array of the pairings, with the values being
    // objects keyed by months and valued by stories
    var monthYs = {};
    var yMax = 0;
    this.months = _.map(props.pairings, months => {
      return _.chain(months)
        .sortBy(d => d[0].publishGroup)
        .map((stories) => {
          var date = stories[0].publishGroup;
          var bottom = monthYs[date] || 0;
          var top = bottom + stories.length;
          monthYs[date] = top;

          yMax = Math.max(yMax, top);

          return {
            date,
            length: stories.length,
            bottom,
            top,
            pairing: stories[0].pairings[0],
          }
        }).value();
    });

    yScale.domain([0, yMax]).nice();
  }

  renderLines(props) {
    var pairings = this.lines.selectAll('.pairing')
      .data(this.months);
    pairings.exit().remove();

    var enter = pairings.enter().append('g')
      .classed('pairing', true);
    enter.append('path')
      .classed('line', true);
    enter.append('path')
      .classed('area', true)
      .attr('fill-opacity', 0.25);

    pairings = enter.merge(pairings);

    pairings.select('.line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', d => props.annotations[d[0].pairing].canon ? props.pink : props.purple);
    pairings.select('.area')
      .attr('d', area)
      .attr('fill', d => props.annotations[d[0].pairing].canon ? props.pink : props.purple);
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
