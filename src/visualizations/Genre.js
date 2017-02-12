import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var dotSize = 5;
var margin = {top: 5, left: 20};
var width = 16 * 12 * dotSize + 2 * margin.left;
var height = 60;
var sf = 2;

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
  .x(d => xScale(d.date) + dotSize / 2)
  .y(d => height - margin.top - d.length * dotSize)
  .curve(d3.curveStep);

class Genre extends Component {

  componentDidMount() {
    this.crispyCanvas(this.refs.canvas, this.props, 'canvas');

    this.container = d3.select(this.refs.svg);

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
    this.updateTitle(this.props);
    this.calculateDots(this.props);
    this.renderDots(this.props);
  }

  shouldComponentUpdate(nextProps) {
    this.renderArea(nextProps);
    this.updateTitle(nextProps);
    this.calculateDots(nextProps);
    this.renderDots(nextProps);

    return true;
  }

  crispyCanvas(canvas, props, name) {
    canvas.width = width * sf;
    canvas.height = height * sf;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    this[name] = canvas.getContext('2d');
    this[name].scale(sf, sf);
  }

  calculateDots(props) {
    var dots = _.chain(props.months)
      .map(stories => {
        var i = -1;
        return _.chain(stories)
          .sortBy(d => d.published)
          .groupBy(d => {
            i += 1;
            return Math.floor(i / 5);
          }).map((stories, i) => {
            return {
              pairing: stories[0].pairings[0],
              extent: d3.extent(stories, story => story.published),
              month: stories[0].publishGroup,
              max: _.maxBy(stories, story => story.reviews.text),
              length: stories.length,
            };
          }).value();
      }).flatten().value();

    // group data by months
    this.months = _.chain(dots)
      .groupBy(d => d.month)
      .map(stories => {
        return _.map(stories, (d, i) => {
          var size = dotSize;
          var color = props.annotations[d.pairing].canon ? props.colors1 : props.colors2;
          color = color(props.colorScale(d.max.reviews.text));
          return {
            x: xScale(d.month),
            y: height - margin.top - (parseInt(i) + 1) * dotSize,
            size,
            color,
          }
        });
      }).flatten().value();
  }

  renderDots(props) {
    this.canvas.clearRect(0, 0, width, height);
    // this.canvas.globalCompositeOperation = 'overlay';

    _.each(this.months, month => {
      this.canvas.beginPath();
      this.canvas.fillStyle = month.color;
      this.canvas.rect(month.x, month.y, dotSize, dotSize);
      this.canvas.fill();
    });
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
    this.crispyCanvas(this.refs.canvas, props, 'canvas')

    var opacity = 0.85;
    var fill = props.annotations[props.pairing].canon ?
      props.colors1(opacity) : props.colors2(opacity);
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

  updateTitle(props) {
    var fontSize = 14;
    var length = d3.format(',')(props.stories.length);

    this.title
      .attr('y', fontSize / 2)
      .attr('font-size', fontSize - 2)
      .text(props.genre + ' (' + length + ' stories)');
  }

  render() {
    var style = {
      position: 'relative',
      width,
    };
    var vizStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width,
    };

    return (
      <div className='Genre' style={style}>
        <canvas ref='canvas' />
        <svg ref='svg' style={vizStyle} />
      </div>
    );
  }
}

export default Genre;
