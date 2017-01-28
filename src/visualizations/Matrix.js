import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var dotSize = 6;
var margin = {top: 20, left: 50};
var width = 700;
var height = 700;
var sf = 2;

var sizeScale = d3.scaleLinear()
  .domain([1, 100]).range([3, 5]);
var simulation = d3.forceSimulation()
  .force('collide', d3.forceCollide(dotSize / 2))
  .force('x', d3.forceX().x(d => d.focusX))
  .force('y', d3.forceY().y(d => d.focusY));

class Matrix extends Component {

  componentDidMount() {
    this.crispyCanvas(this.refs.canvas, this.props, 'canvas');
    this.calculateData(this.props);

    simulation.on('tick', this.renderData.bind(this))
      .stop();
  }

  shouldComponentUpdate(nextProps) {
    this.calculateData(nextProps);
    simulation.nodes(this.matrix)
      // .alphaMin(0.5)
      .alpha(1).restart();

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

  calculateData(props) {
    var pairings = {};
    _.each(props.data, story => {
      _.each(story.pairings, pairing => {
        var [source, target] = pairing.split('/');
        if (source === 'Other Pairing' || source === 'OC' ||
          source === 'Others' || source === 'undefined' ||
          target === 'Other Pairing' || target === 'OC' ||
          target === 'Others' || target === 'undefined') return;

        if (!pairings[source]) {
          pairings[source] = {};
        }
        if (!pairings[source][target]) {
          pairings[source][target] = [];
        }
        pairings[source][target].push(story);

        if (!pairings[target]) {
          pairings[target] = {};
        }
        if (!pairings[target][source]) {
          pairings[target][source] = [];
        }
        pairings[target][source].push(story);
      });
    });

    var topChars = _.chain(pairings)
      .map((targets, source) => {
        var sum = _.sumBy(_.values(targets), target => target.length);
        return [source, sum];
      }).sortBy(d => -d[1])
      .take(6).value();

    var characters = this.characters = {};
    _.each(topChars, source => {
      source = source[0];
      var targets = pairings[source];

      if (!characters[source]) {
        var size = _.maxBy(_.values(targets), target => target.length).length;
        size = Math.ceil(Math.sqrt(size / 100)) * dotSize;

        characters[source] = {
          name: source,
          size,
        };
      }

      _.each(targets, (stories, target) => {
        if (stories.length > 100 && !characters[target]) {
          var size = _.maxBy(_.values(pairings[target]), target => target.length).length;
          size = Math.ceil(Math.sqrt(size / 100)) * dotSize;

          characters[target] = {
            name: target,
            size,
          };
        }
      });
    });

    var y = 0;
    var matrix = this.matrix = [];
    _.chain(characters)
      .sortBy(d => -d.size)
      .each(source => {
        source.y = y;
        y += source.size;
        var targets = pairings[source.name];

        _.each(targets, (stories, target) => {
          target = characters[target];

          if (target && stories.length > 100) {
            var i = -1;
            _.chain(stories)
              .groupBy(d => {
                i += 1;
                return Math.floor(i / 100);
              }).each(stories => {
                var ratings = d3.max(stories, d => d.reviews.text);
                var color = props.colors(props.colorScale(ratings));

                matrix.push({
                  focusY: source.y + source.size / 2,
                  focusX: target.y + target.size / 2,
                  size: sizeScale(stories.length),
                  color,
                });
              }).value();
          }
        });
      }).value();
  }

  renderData(props) {
    this.canvas.clearRect(0, 0, width, height);

    _.each(this.matrix, matrix => {
      this.canvas.beginPath();
      this.canvas.fillStyle = matrix.color;
      this.canvas.arc(matrix.x, matrix.y, matrix.size / 2, 0, 2 * Math.PI, false);
      this.canvas.fill();
    });
  }

  render() {
    var style = {
      position: 'relative',
      width,
      height,
    };
    var svgStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width,
      height,
    };

    return (
      <div className="Matrix" style={style}>
        <canvas ref='canvas' />
        <svg ref='svg' style={svgStyle} />
      </div>
    );
  }
}

export default Matrix;
