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
  .range([height - margin.top, 2 * margin.top]);
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
    this.months = _.map(props.pairings, months => {
      return {
        pairing: _.values(months)[0][0].pairings[0],
        data: [],
      }
    });
    var [start, end] = xScale.domain();
    var yMax = 0;
    _.each(d3.timeMonth.range(start, end), date => {
      var bottom = 0;
      _.each(props.pairings, (months, i) => {
        var stories = months[date] || [];
        var top = bottom + stories.length + 2;

        this.months[i].data.push({
          date,
          length: stories.length,
          bottom,
          top,
        });

        bottom = top;
      });
      yMax = Math.max(yMax, bottom);
    });

    console.log(yMax, this.months)

    yScale.domain([0, yMax]).nice();
  }

  renderLines(props) {
    var pairings = this.lines.selectAll('.pairing')
      .data(this.months);
    pairings.exit().remove();

    var enter = pairings.enter().append('g')
      .classed('pairing', true);
    enter.append('path')
      .classed('line', true)
      .attr('fill', 'none')
      .attr('stroke-width', 2);
    enter.append('path')
      .classed('area', true)
      .attr('fill-opacity', 0.15);

    pairings = enter.merge(pairings);

    var opacity = 0.85;
    pairings.select('.line')
      .attr('d', d => line(d.data))
      .attr('stroke', d => props.annotations[d.pairing].canon ?
        props.colors1(opacity) : props.colors2(opacity));
    pairings.select('.area')
      .attr('d', d => area(d.data))
      .attr('fill', d => props.annotations[d.pairing].canon ?
        props.colors1(opacity) : props.colors2(opacity));
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
