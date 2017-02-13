import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var dotSize = 5;
var margin = {top: 20, left: 20};
var width = 16 * 12 * dotSize + 2 * margin.left;
var height = 360;
var fontSize = 14;


var numTicks = 30;
var xScale = d3.scaleTime()
  .domain([new Date('2/1/2001'), new Date('12/31/2016')])
  .range([margin.left, width - margin.left]);
var yScale = d3.scaleLinear()
  .range([height - margin.top, 2 * margin.top])
  .clamp(true);
var xAxis = d3.axisBottom()
  .ticks(numTicks)
  .tickFormat(d => d.getMonth() === 0 ? d.getFullYear() : '')
  .tickSizeOuter(0)
  .scale(xScale);
var line = d3.line()
  .x(d => xScale(d.date))
  .y(d => height - margin.top - d.top * dotSize)
  .curve(d3.curveStep);
var area = d3.area()
  .x(d => xScale(d.date))
  .y0(d => height - margin.top - d.bottom * dotSize)
  .y1(d => height - margin.top -  d.top * dotSize)
  .curve(d3.curveStep);

class Timeline extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: null,
    };
    this.selectPairing = this.selectPairing.bind(this);
    this.hoverLine = this.hoverLine.bind(this);
  }

  componentDidMount() {
    this.container = d3.select(this.refs.container);
    this.container.append('g')
      .attr('transform', 'translate(' + [0, height - margin.top] + ')')
      .call(xAxis);
    this.lines = this.container.append('g');
    this.annotations = this.container.append('g');
    this.legend = this.container.append('g');
    this.title = this.legend.append('text')
      .attr('font-size', fontSize - 2)
      .attr('text-anchor', 'start')
      .attr('dy', '.35em')
      .attr('transform', 'translate(' + [width * 0.75, height * 0.5] + ')')
      .style('font-weight', 600);

    this.renderDates();
    this.calculateLines(this.props);
    this.renderLines(this.props);
    this.renderLegend(this.props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    // if it's a different character all together, reset state
    if (nextProps.selected !== this.props.selected) {
      nextState = {selected: null};
      this.setState(nextState);
    }
    this.calculateLines(nextProps);
    this.renderLines(nextProps, nextState);
    this.renderLegend(nextProps, nextState);

    return false;
  }

  calculateLines(props) {
    var opacity = 0.85;
    this.months = _.map(props.pairings, months => {
      var pairing = _.values(months)[0][0].pairings[0];
      return {
        pairing,
        data: [],
        key: {},
        fill: props.annotations[pairing].canon ?
          props.colors1(opacity) : props.colors2(opacity),
      }
    });
    var [start, end] = xScale.domain();
    var index = 0;
    _.each(d3.timeMonth.range(start, end), date => {
      var bottom = 0;
      _.each(props.pairings, (months, i) => {
        var stories = months[date] || [];
        var top = bottom + Math.ceil(stories.length / 5);

        this.months[i].data.push({
          date,
          length: stories.length,
          bottom,
          top,
        });
        this.months[i].key[date] = index;

        bottom = top;
      });
      index += 1;
    });
  }

  renderLines(props, state) {
    var pairings = this.lines.selectAll('.pairing')
      .data(this.months);
    pairings.exit().remove();

    var enter = pairings.enter().append('g')
      .classed('pairing', true);
    enter.append('path')
      .classed('line', true)
      .attr('fill', 'none')
      .attr('stroke-opacity', 0)
      .attr('stroke-width', 2);
    enter.append('path')
      .classed('area', true)
      .attr('fill-opacity', 0);

    pairings = enter.merge(pairings)
      .attr('opacity', d => !state.selected || d.pairing === state.selected ? 1 : 0.25)
      .on('mousemove', this.hoverLine)
      .on('mouseleave', d => this.hoverLine());

    pairings.select('.line')
      .attr('stroke', d => d.fill)
      .transition(props.transition)
      .attr('stroke-opacity', .75)
      .attr('d', d => line(d.data));
    pairings.select('.area')
      .attr('fill', d => d.fill)
      .transition(props.transition)
      .attr('d', d => area(d.data))
      .attr('fill-opacity', d => state.selected && d.pairing === state.selected ? 0.75 : 0.1);

    this.dots = this.lines.selectAll('.dot')
      .data(this.months, d => d.pairing);
    this.dots.exit().remove();

    this.dots = this.dots.enter().append('circle')
      .classed('dot', true)
      .merge(this.dots)
      .attr('fill', d => d.fill)
      .attr('r', dotSize * 0.65)
      .style('display', 'none')
  }


  renderDates() {
    var fontSize = 10;
    var y = height * 0.6;
    var dates = this.annotations.selectAll('.date')
      .data(this.props.dates).enter().append('g')
      .classed('date', true)
      .attr('transform', d => 'translate(' + [xScale(d[2]), y] + ')');

    dates.append('line')
      .attr('y1', d => d[0] === 5 && d[3] === 'film' ? -1.5 * fontSize : 0)
      .attr('y2', height - margin.top - y)
      .attr('stroke', this.props.gray)
      .attr('stroke-dasharray', d => d[3] === 'book' ? '5 5' : 'none')
      .attr('opacity', 0.5);

    dates.append('circle')
      .attr('cy', d => d[0] === 5 && d[3] === 'film' ? -1.5 * fontSize : 0)
      .attr('r', (fontSize + 2) / 2)
      .attr('fill', d => d[3] === 'book' ? '#fff' : this.props.gray)
      .attr('stroke', this.props.gray)
      .attr('stroke-width', 2);

    dates.append('text')
      .attr('y', d => d[0] === 5 && d[3] === 'film' ? -1.5 * fontSize : 0)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', d => d[3] === 'book' ? this.props.gray : '#fff')
      .attr('font-size', fontSize)
      .attr('font-weight', 600)
      .text(d => d[0]);
  }

  renderLegend(props, state) {
    var totalStories = 0;
    var data = _.map(props.pairings, months => {
      var pairing = _.values(months)[0][0].pairings[0];
      var character = pairing.replace(props.selected, '').replace('/', '');
      var length = _.reduce(months, (sum, stories) => sum + stories.length, 0);
      var color = props.annotations[pairing].canon ? props.pink : props.purple;
      totalStories += length;

      return {pairing, character, length, color, months};
    });
    var pairings = this.legend.selectAll('.pairing')
      .data(data, d => d.character);

    pairings.exit().remove();

    var enter = pairings.enter().append('g')
      .classed('pairing', true)
      .attr('opacity', 0)
      .attr('transform', (d, i) => 'translate(' + [width * 0.75, height * 0.5 - 1.5 * i * fontSize] + ')')
      .style('cursor', 'pointer')
      .on('click', this.selectPairing);

    enter.append('line')
      .attr('stroke-width', 2)
      .attr('x2', fontSize);

    enter.append('text')
      .attr('font-size', fontSize - 2)
      .attr('x', fontSize + 2)
      .attr('text-anchor', 'start')
      .attr('dy', '.35em');

    pairings = enter.merge(pairings)
      .transition(props.transition)
      .attr('opacity', d => !state.selected || d.pairing === state.selected ? 1 : 0.25)
      .attr('transform', (d, i) => 'translate(' + [width * 0.75, height * 0.5 - 1.5 * i * fontSize] + ')');
    pairings.select('line')
      .attr('stroke', d => d.color)
    pairings.select('text')
      .text(d => d.character + ' (' + d3.format(',')(d.length) + ' stories)');

    this.title
      .text('Total (' + d3.format(',')(totalStories) + ' stories)')
      .transition(props.transition)
      .attr('transform', 'translate(' + [width * 0.75, height * 0.5 - 1.5 * data.length * fontSize] + ')');
  }

  selectPairing(d) {
    var selected = this.state.selected && this.state.selected === d.pairing ? null : d.pairing;
    this.setState({selected});
  }

  hoverLine(line) {
    var [x, y] = d3.mouse(this.refs.container);
    var date = d3.timeMonth.floor(xScale.invert(x));

    var totalStories = 0;
    this.legend.selectAll('.pairing').select('text')
      .text(d => {
        var length = line ? (d.months[date] ? d.months[date].length : 0) : d.length;
        totalStories += length;

        return d.character + ' (' + d3.format(',')(length) + ' stories)';
      });
    var title = line ? d3.timeFormat('%b %Y')(date) : 'Total';
    this.title.text(title + ' (' + d3.format(',')(totalStories) + ' stories)');

    this.dots
      .style('display', line ? 'block' : 'none')
      .attr('opacity', d => !this.state.selected || d.pairing === this.state.selected ? 1 : 0.25)
      .attr('cx', xScale(date))
      .attr('cy', d => height - margin.top - d.data[d.key[date]].top * dotSize)
  }

  render() {
    var style = {
      paddingTop: 120,
    };

    var imageStyle = {
      padding: 5,
      width: 100,
    };
    var image = _.find(this.props.characters, c => c.name === this.props.selected);
    if (image) {
      image = (<img src={image.image} style={imageStyle} />);
    }

    return (
      <div style={style}>
        <div>{image}</div>
        <div>{this.props.selected}</div>
        <svg ref='container' width={width} height={height} />
      </div>
    );
  }
}

export default Timeline;
