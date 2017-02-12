import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var gifSize = 50;
var dotSize = 5;
var margin = {top: 20, left: 20};
var width = 16 * 12 * dotSize + 2 * margin.left;
var height = 300;
var sf = 2;

var xScale = d3.scaleTime()
  .domain([new Date('2/1/2001'), new Date('12/31/2016')])
  .range([margin.left, width - margin.left]);
var xAxis = d3.axisBottom()
  .ticks(30)
  .tickFormat(d => d.getMonth() === 0 ? d.getFullYear() : '')
  .tickSizeOuter(0)
  .scale(xScale);
var line = d3.line()
  .x(d => xScale(d.date) + dotSize / 2)
  .y(d => height - margin.top -  d.length * dotSize)
  .curve(d3.curveStep);

// taken directly from nbremer's occupationcanvas code
//Generates the next color in the sequence, going from 0,0,0 to 255,255,255.
//From: https://bocoup.com/weblog/2d-picking-in-canvas
var nextCol = 1;
function genColor(){
  var ret = [];
  // via http://stackoverflow.com/a/15804183
  if(nextCol < 16777215){
    ret.push(nextCol & 0xff); // R
    ret.push((nextCol & 0xff00) >> 8); // G
    ret.push((nextCol & 0xff0000) >> 16); // B

    nextCol += 100; // This is exagerated for this example and would ordinarily be 1.
  }
  var col = "rgb(" + ret.join(',') + ")";
  return col;
}

class Timeline extends Component {

  constructor(props) {
    super(props);

    this.hoverCanvas = this.hoverCanvas.bind(this);
    this.clickCanvas = this.clickCanvas.bind(this);
  }

  componentDidMount() {
    this.crispyCanvas(this.refs.hidden, this.props, 'hidden');
    this.crispyCanvas(this.refs.canvas, this.props, 'canvas');
    d3.select(this.refs.canvas).on('mousemove', this.hoverCanvas)
      .on('mouseleave', this.hoverCanvas)
      .on('click', this.clickCanvas);

    this.svg = d3.select(this.refs.svg);
    this.defs = this.svg.append('defs');

    this.initiateGifs();

    this.annotations = this.svg.append('g')
      .attr('transform', 'translate(' + [0, margin.top] + ')');
    this.line = this.svg.append('path')
      .attr('fill', 'none')
      .attr('opacity', 0.75)
      .attr('stroke-width', 2);
    this.square = this.svg.append('rect')
      .attr('width', dotSize)
      .attr('height', dotSize)
      .attr('fill', 'none')
      .attr('stroke', this.props.gray)
      .attr('stroke-width', 2)
      .attr('opacity', 0);
    // axis
    this.svg.append('g')
      .attr('transform', 'translate(' + [0, height - margin.top] + ')')
      .call(xAxis);

    this.renderDates();
    this.renderLine(this.props);
    this.renderGifs(this.props);
    this.calculateDots(this.props);
    this.renderDots(this.props);

  }

  shouldComponentUpdate(nextProps) {
    if (!nextProps.update) return false;

    this.renderLine(nextProps);
    this.renderGifs(nextProps);
    this.calculateDots(nextProps);
    this.renderDots(nextProps);

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
    var dots = _.chain(props.stories)
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
              all: _.sortBy(stories, d => -d.reviews.text),
              max: _.maxBy(stories, story => story.reviews.text),
              length: stories.length,
            };
          }).value();
      }).flatten().value();

    // group data by months
    this.hoverLookup = {};
    this.months = _.chain(dots)
      .groupBy(d => d.month)
      .map(stories => {
        return _.map(stories, (d, i) => {
          var size = dotSize;
          var color = props.annotations[d.pairing].canon ? props.colors1 : props.colors2;
          color = color(props.colorScale(d.max.reviews.text));
          var x = xScale(d.month);
          var y = height - margin.top - (parseInt(i) + 1) * dotSize;

          var hidden = genColor();
          this.hoverLookup[hidden] = {x, y, stories: d.all, extent: d.extent};

          return {
            x,
            y,
            size,
            color,
            hidden,
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
      this.canvas.strokeStyle = month.color;
      this.canvas.rect(month.x, month.y, dotSize, dotSize);
      this.canvas.fill();
      this.canvas.stroke();

      // hidden canvas for interaction
      this.hidden.beginPath();
      this.hidden.fillStyle = month.hidden;
      this.hidden.strokeStyle = month.hidden;
      this.hidden.rect(month.x, month.y, dotSize, dotSize);
      this.hidden.fill();
      this.hidden.stroke();
    });
  }

  renderLine(props) {
    var [start, end] = xScale.domain();
    var data = _.map(d3.timeMonth.range(start, end), date => {
      var length = props.stories[date] ? props.stories[date].length : 0;
      length = Math.ceil(length / 5);
      return {date, length};
    });

    var opacity = 0.85;
    this.line
      .datum(data)
      .attr('stroke', props.annotations[props.pairing].canon ?
        props.colors1(opacity) : props.colors2(opacity))
      .attr('d', line);
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

    enter.append('circle')
      .attr('r', gifSize);

    images = enter.merge(images)
      .attr('transform', (d, i) => {
        d.y = (i % 2 ? 1.5 * gifSize : 0.5 * gifSize) + 1.5 * margin.top;
        return 'translate(' + [xScale(d.date), d.y] + ')'
      });

    images.select('circle')
      .style('fill', d => 'url(#gif-' + d.image + ')');
  }

  renderDates() {
    var fontSize = 10;
    var y = margin.top / 2;
    var dates = this.annotations.selectAll('.date')
      .data(this.props.dates).enter().append('g')
      .classed('date', true)
      .attr('transform', d => 'translate(' + [xScale(d[2]), y] + ')');

    dates.append('line')
      .attr('y2', height - 2 * margin.top - y)
      .attr('stroke', this.props.gray)
      .attr('stroke-dasharray', d => d[3] === 'film' ? 'none' : '5 5')
      .attr('opacity', 0.2);

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

  hoverCanvas() {
    var [x, y] = d3.mouse(this.refs.canvas);

    // multiply x and y by sf bc crispy canvas
    var col = this.hidden.getImageData(x * sf, y * sf, 1, 1).data;
    var color = 'rgb(' + col[0] + "," + col[1] + ","+ col[2] + ")";
    var square = this.hoverLookup[color];

    if (square && this.props.hovered !== square.stories) {
      this.square
        .attr('x', square.x)
        .attr('y', square.y)
        .attr('opacity', 1);

      this.props.hoverCanvas(square);
    } else if (!square && this.props.hovered) {
      this.square.attr('opacity', 0);
      this.props.hoverCanvas();
    }
  }

  clickCanvas() {
    var [x, y] = d3.mouse(this.refs.canvas);

    // multiply x and y by sf bc crispy canvas
    var col = this.hidden.getImageData(x * sf, y * sf, 1, 1).data;
    var color = 'rgb(' + col[0] + "," + col[1] + ","+ col[2] + ")";
    var square = this.hoverLookup[color];

    if (square) {
      // open up top story
      var link = square.stories[0].title.link;
      link = (_.includes(link, 'harrypotterfanfiction.com') ? '' :
        'http://harrypotterfanfiction.com/') + link;
      window.open(link, '_new');
    }
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
      pointerEvents: 'none',
    };

    return (
      <div className='Timeline' style={style}>
        <canvas ref='hidden' style={{display: 'none'}} />
        <canvas ref='canvas' />
        <svg ref='svg' style={vizStyle} />
      </div>
    );
  }
}

export default Timeline;
