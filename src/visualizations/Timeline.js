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

class Timeline extends Component {

  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.container.append('g')
      .attr('transform', 'translate(' + [0, height - margin.top] + ')')
      .call(xAxis);
    this.histogram = this.container.append('g')
      // .attr('fill-opacity', 0.5);

    this.renderHistogram(this.props);
  }

  shouldComponentUpdate(nextProps) {
    this.renderHistogram(nextProps);

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
      .attr('fill', d => props.colors(props.colorScale(d.max)));
  }

  render() {
    return (
      <svg ref='container' width={width} height={height} />
    );
  }
}

export default Timeline;
