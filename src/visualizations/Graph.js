import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

var radius = 60;
var margin = {top: 20, left: 20};
var width = 250;
var height = 700;

import positions from '../data/positions.json';
var nodes = _.map(positions, node => {
  return Object.assign(node, {
    image: require('../images/characters/' + node.name + '.svg'),
  })
});
var links = [];

var linkScale = d3.scaleLinear().range([2, 8]);

class Graph extends Component {

  componentDidMount() {
    this.container = d3.select(this.refs.container);

    this.calculateGraph(this.props);
  }

  shouldComponentUpdate(nextProps) {
    this.calculateGraph(nextProps);
    this.renderGraph(nextProps);

    return false;
  }

  calculateGraph(props) {
    var max = d3.max(_.values(props.pairings), months =>
      _.reduce(months, (sum, stories) => sum + stories.length, 0));
    linkScale.domain([1, max]);

    links = _.map(props.pairings, (months, pairing) => {
      var [source, target] = pairing.split('/');
      source = _.find(nodes, node => node.name === source);
      target = _.find(nodes, node => node.name === target);

      var length = _.reduce(months, (sum, stories) => sum + stories.length, 0);
      return {
        id: pairing,
        source,
        target,
        size: linkScale(length),
      };
    });
  }

  renderGraph(props) {
    // images
    this.circles = this.container.selectAll('.node')
      .data(nodes, d => d.name)
      .enter().append('g')
      .classed('node', true)
      .attr('transform', d => 'translate(' + [d.x, d.y] + ')')
      .style('cursor', 'pointer')
      .on('click', d => props.selectCharacter(d));

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
      .attr('stroke', d => props.annotations[d.id].canon ? props.pink : props.purple)
      .attr('stroke-width', d => d.size)
      .attr('opacity', 0.5)
      .attr('d', this.calculateLinkPath);

  }

  // modified from http://bl.ocks.org/mbostock/1153292
  calculateLinkPath(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = (Math.sqrt(dx * dx + dy * dy) * 2) / 2;
    return "M" + d.source.x + "," + d.source.y +
      "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  }

  render() {
    return (
      <svg ref='container' width={width} height={height} />
    );
  }
}

export default Graph;
