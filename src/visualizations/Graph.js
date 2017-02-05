import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var radius = 60;
var margin = {top: 20, left: 20};
var width = 250;
var height = 700;
var characters = [
  'Lily', 'James', 'Sirius', 'Snape', 'Tonks',
  'Cho', 'Dean', 'Draco', 'FredOrGeorge', 'Ginny',
  'Harry', 'Hermione', 'Krum', 'Lavender',
  'Luna', 'Pansy', 'Remus', 'Ron',
  'Rose', 'Scorpius',
];
var nodes = _.map(characters, character => {
  var fx, fy;
  if (character === 'Lily') {
    fx = width / 2;
    fy = 2 * radius;
  } else if (character === 'Hermione') {
    fx = width / 2;
    fy = height * 0.65;
  } else if (character === 'Rose') {
    fx = width / 2 - radius / 2;
    fy = height - radius;
  }
  return {
    name: character,
    image: require('../images/characters/' + character + '.svg'),
    fx, fy,
  };
});
var links = [];
var simulation = d3.forceSimulation()
  .force('collide', d3.forceCollide().radius(radius / 2 + 10))
  // .force("charge", d3.forceManyBody().strength(-300))
  // .force("center", d3.forceCenter(width / 2, height / 2));

var linkScale = d3.scaleLinear().range([1, 10]);

class Graph extends Component {

  componentDidMount() {
    this.container = d3.select(this.refs.container);

    this.calculateGraph(this.props);
  }

  shouldComponentUpdate(nextProps) {
    this.calculateGraph(nextProps);
    this.renderGraph(nextProps);
    simulation.nodes(nodes)
      .on('tick', this.updateGraph.bind(this))
      .on('end', () => {
        var result = _.map(nodes, node => {
          return {name: node.name, x: node.x, y: node.y};
        });
        console.log(JSON.stringify(result));
      })
      .force('links', d3.forceLink(links).strength(d => d.size / 10));

    return false;
  }

  calculateGraph(props) {
    var max = d3.max(_.values(props.pairings), months =>
      _.reduce(months, (sum, stories) => sum + stories.length, 0));
    linkScale.domain([1, max]);

    links = [];
    _.each(props.pairings, (months, pairing) => {
      var [source, target] = pairing.split('/');
      source = _.find(nodes, node => node.name === source);
      target = _.find(nodes, node => node.name === target);

      if (source && target) {
        var length = _.reduce(months, (sum, stories) => sum + stories.length, 0);
        links.push({
          id: pairing,
          source,
          target,
          size: linkScale(length),
        });
      }
    });
    console.log(JSON.stringify(_.map(links, 'id')))
  }

  renderGraph(props) {
    // images
    this.circles = this.container.selectAll('.node')
      .data(nodes, d => d.name)
      .enter().append('g')
      .classed('node', true);

    this.circles.append('circle')
      .attr('r', radius / 2)
      .attr('fill', '#fff');

    this.circles.append('image')
      .attr('xlink:href', d => d.image)
      .attr('x', -radius / 2)
      .attr('y', -radius / 2)
      .attr('width', radius)
      .attr('height', radius);


    this.links = this.container.selectAll('.link')
      .data(links, d => d.id)
      .enter().insert('path', '.node')
      .classed('link', true)
      .attr('fill', 'none')
      .attr('stroke', props.pink)
      .attr('stroke-width', d => d.size)
      .attr('opacity', 0.5);

    this.links = this.container.selectAll('.link');
    this.circles = this.container.selectAll('.node');
  }

  updateGraph() {
    _.each(nodes, node => {
      if (node.x + radius / 2 > width) {
        node.x = width - radius / 2;
      } else if (node.x - radius / 2 < 0) {
        node.x = radius / 2;
      }
      if (node.y + radius / 2 > height) {
        node.y = height - radius / 2;
      } else if (node.x - radius / 2 < 0) {
        node.y = radius / 2;
      }
    });

    this.circles.attr('transform', d => 'translate(' + [d.x, d.y] + ')');
    this.links
      .attr('d', this.calculateLinkPath)
      // .attr('x1', d => d.source.x)
      // .attr('y1', d => d.source.y)
      // .attr('x2', d => d.target.x)
      // .attr('y2', d => d.target.y);
  }

  calculateLinkPath(link) {
    var x1 = link.source.x;
    var y1 = link.source.y;
    var x2 = link.target.x;
    var y2 = link.target.y;

    // if it's on same level, then curve if not straight line
    var curve = (y1 === y2) ? (x2 - x1) / 4 : 0;
    var cx1 = x1 + curve;
    var cy1 = y1 + curve;
    var cx2 = x2 - curve;
    var cy2 = y1 + curve;
    return 'M' + [x1, y1] + ' C' + [cx1, cy1] + ' ' + [cx2, cy2] + ' ' + [x2, y2];
  }

  render() {
    return (
      <svg ref='container' width={width} height={height} />
    );
  }
}

export default Graph;
