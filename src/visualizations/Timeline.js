import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var dotSize = 5;
var margin = {top: 20, left: 20};
var width = 14.5 * 12 * dotSize + 2 * margin.left;
var height = 360;

var numTicks = 30;
var xScale = d3.scaleTime()
  .domain([new Date('6/1/2002'), new Date('12/31/2016')])
  .range([margin.left, width - margin.left]);
var yScale = d3.scaleLinear()
  .range([height - margin.top, 2 * margin.top]);
var xAxis = d3.axisBottom()
  .ticks(numTicks)
  .tickFormat(d => d.getMonth() === 0 ? d.getFullYear() : '')
  .tickSizeOuter(0)
  .scale(xScale);
var line = d3.line()
  .x(d => xScale(d.date))
  .y(d => height - margin.top - d.top * dotSize - 2)
  .curve(d3.curveCatmullRom);
var area = d3.area()
  .x(d => xScale(d.date))
  .y0(d => height - margin.top - d.bottom * dotSize - 2)
  .y1(d => height - margin.top -  d.top * dotSize)
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
    this.months = _.map(props.pairings, months => {
      return {
        pairing: _.values(months)[0][0].pairings[0],
        data: [],
      }
    });
    var [start, end] = xScale.domain();
    _.each(d3.timeMonth.range(start, end), date => {
      var bottom = 0;
      _.each(props.pairings, (months, i) => {
        var stories = months[date] || [];
        var top = bottom + stories.length / 5;

        this.months[i].data.push({
          date,
          length: stories.length,
          bottom,
          top,
        });

        bottom = top;
      });
    });
  }

  renderLines(props) {
    var pairings = this.lines.selectAll('.pairing')
      .data(this.months);
    pairings.exit().remove();

    var opacity = 0.85;
    var enter = pairings.enter().append('g')
      .classed('pairing', true);
    enter.append('path')
      .classed('line', true)
      .attr('fill', 'none')
      .attr('stroke-opacity', opacity)
      .attr('stroke-width', 2);
    enter.append('path')
      .classed('area', true)
      .attr('fill-opacity', 0.05);

    pairings = enter.merge(pairings);

    var t = d3.transition().duration(500);
    pairings.select('.line')
      .attr('stroke', d => props.annotations[d.pairing].canon ?
        props.colors1(opacity) : props.colors2(opacity))
      .transition(t)
      .attr('d', d => line(d.data));
    pairings.select('.area')
      .attr('fill', d => props.annotations[d.pairing].canon ?
        props.colors1(opacity) : props.colors2(opacity))
      .transition(t)
      .attr('d', d => area(d.data));
  }


  renderDates() {
    var fontSize = 10;
    var y = height * 0.1;
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
