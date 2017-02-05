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
  // .curve(d3.curveCatmullRom.alpha(0.5));

class Timeline extends Component {

  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.container.append('g')
      .attr('transform', 'translate(' + [0, height - margin.top] + ')')
      .call(xAxis);
    this.histogram = this.container.append('g')
      // .attr('fill-opacity', 0.5);
    this.lines = this.container.append('g');

    // this.renderHistogram(this.props);
    this.renderLines(this.props);
  }

  shouldComponentUpdate(nextProps) {
    // this.renderHistogram(nextProps);
    this.renderLines(nextProps);

    return false;
  }

  renderHistogram(props) {
    var data = _.chain(props.data)
      .groupBy(d => d.publishGroup)
      .map(stories => {
        return {
          date: stories[0].publishGroup,
          length: stories.length,
          max: d3.max(stories, d => d.reviews.text),
        }
      }).value();

    var yMax = d3.max(data, d => d.length);
    yScale.domain([0, yMax]);

    // render
    this.histogram.selectAll('.bar')
      .data(data).enter().append('rect')
      .classed('bar', true)
      .attr('x', d => xScale(d.date))
      .attr('y', d => yScale(d.length))
      .attr('width', dotSize)
      .attr('height', d => height - margin.top - yScale(d.length))
      .attr('fill', d => props.colors1(props.colorScale(d.max)));
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

  render() {
    return (
      <svg ref='container' width={width} height={height} />
    );
  }
}

export default Timeline;
