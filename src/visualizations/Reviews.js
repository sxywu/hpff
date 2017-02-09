import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var gifSize = 50;
var dotSize = 5;
var margin = {top: 20, left: 20};
var width = 16 * 12 * dotSize + 2 * margin.left;
var height = 320;
var sf = 2;

var xScale = d3.scaleTime()
  .domain([new Date('2/1/2001'), new Date('12/31/2016')])
  .range([margin.left, width - margin.left]);
var xAxis = d3.axisBottom()
  .ticks(32)
  .tickFormat(d => d.getMonth() === 0 ? d.getFullYear() : '')
  .tickSizeOuter(0)
  .scale(xScale);
var sizeScale = d3.scaleLinear()
  .domain([1, 5]).range([3, 4.5]);

class Timeline extends Component {

  componentDidMount() {
    this.crispyCanvas(this.refs.canvas, this.props, 'canvas');
    this.calculateDots(this.props);
    this.renderDots(this.props);

    this.svg = d3.select(this.refs.svg);
    this.defs = this.svg.append('defs');

    this.initiateGifs();

    this.annotations = this.svg.append('g')
      .attr('transform', 'translate(' + [0, margin.top] + ')');
    this.renderGifs(this.props);

    // axis
    this.svg.append('g')
      .attr('transform', 'translate(' + [0, height - margin.top] + ')')
      .call(xAxis);
  }

  shouldComponentUpdate(nextProps) {
    this.calculateDots(nextProps);
    this.renderDots(nextProps);
    this.renderGifs(nextProps);

    return false;
  }

  crispyCanvas(canvas, props, name) {
    canvas.width = width * sf;
    canvas.height = height * sf;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    this[name] = canvas.getContext('2d');
    this[name].scale(sf, sf);
  }

  initiateGifs() {
    // taken from Nadieh's January datasketches:
    // https://github.com/nbremer/datasketches/blob/gh-pages/january/code/nadieh/js/main.js
    this.defs.selectAll('pattern')
  		.data(this.props.gifs)
  		.enter().append('pattern')
  		.attr('id', d => 'gif-' + d[0])
  		.attr('patternUnits','objectBoundingBox')
  		.attr('height', '100%')
  		.attr('width', '100%')
  		.append('image')
  			.attr('xlink:href', d => d[1])
        .attr('y', 0.5 * gifSize)
        .attr('height', gifSize);
  }

  calculateDots(props) {
    var dots = _.chain(props.dots)
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
          var size = sizeScale(d.length);
          var color = props.annotations[d.pairing].canon ? props.colors1 : props.colors2;
          color = color(props.colorScale(d.max.reviews.text));
          return {
            x: xScale(d.month) + dotSize / 2,
            y: height - margin.top - (parseInt(i) + 0.5) * dotSize,
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
      this.canvas.arc(month.x, month.y, month.size / 2, 0, 2 * Math.PI, false);
      this.canvas.fill();
    });
  }

  renderGifs(props) {
    var gifs = _.map(props.gifsNested[props.pairing], (gifs, year) => {
      year = parseInt(year);
      var image = gifs[_.random(gifs.length - 1)];
      var date = _.find(props.dates, d => d[0] === year && d[3] === 'film')[2];
      return {
        year,
        date,
        image,
      }
    });

    var images = this.annotations.selectAll('.gif')
      .data(gifs);

    images.exit().remove();

    var enter = images.enter().append('g')
      .classed('gif', true);

    enter.append('line')
      .attr('stroke', this.props.gray)
      // .attr('stroke-dasharray', '5 5')
      .attr('opacity', 0.5);

    enter.append('circle')
      .attr('r', gifSize);

    images = enter.merge(images)
      .attr('transform', (d, i) => {
        d.y = i % 2 ? 0.5 * gifSize : 1.5 * gifSize;
        return 'translate(' + [xScale(d.date), d.y] + ')'
      });

    images.select('line')
      .attr('y2', d => height - 2 * margin.top - d.y);

    images.select('circle')
      .style('fill', d => 'url(#gif-' + d.image + ')');
  }

  render() {
    var style = {
      position: 'relative',
      width,
      height,
    };
    var vizStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width,
      height,
    };

    return (
      <div className='Timeline' style={style}>
        <canvas ref='canvas' style={vizStyle} />
        <svg ref='svg' style={vizStyle} />
      </div>
    );
  }
}

export default Timeline;
