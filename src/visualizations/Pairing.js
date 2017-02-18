import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

import Reviews from './Reviews';
import Genre from './Genre';

var radius = 75;
var dotSize = 5;
var margin = {top: 20, left: 20};
var width = 16 * 12 * dotSize + 2 * margin.left;
var legendWidth = 290;

class Pairing extends Component {

  constructor(props) {
    super(props);

    this.state = {update: true, hovered: null}
    this.hoverCanvas = this.hoverCanvas.bind(this);
  }

  componentDidMount() {
    // create legend
    var perWidth = 10;
    var numCubes = legendWidth / perWidth;
    var data = _.times(numCubes, i => i / (numCubes - 1));

    this.legend = d3.select(this.refs.legend)
      .append('g').attr('transform', 'translate(' + [margin.left, 0] + ')')
      .selectAll('.cube').data(data);

    this.legend.exit().remove();
    var enter = this.legend.enter().append('g')
      .classed('cube', true)
      .attr('transform', (d, i) => 'translate(' + [i * perWidth, 0]+ ')');
    enter.append('rect')
      .attr('width', perWidth)
      .attr('height', perWidth);
    enter.filter((d, i) => i === 0 || (i + 1) % 5 === 0)
      .append('text')
      .attr('y', 1.5 * perWidth + 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'start')
      .attr('font-size', perWidth);

    var color = this.props.annotations[this.props.pairing].canon ?
      this.props.colors1 : this.props.colors2;
    this.legend = enter.merge(this.legend);
    this.legend.select('rect')
      .attr('fill', color);

    this.legend.select('text')
      .text((d, i) => {
        var reviews = Math.round(this.props.colorScale.invert(d));
        if (reviews >= 1000) {
          return (reviews / 1000).toFixed(1) + 'k reviews';
        }
        return reviews;
      });
  }

  componentWillReceiveProps() {
    this.setState({update: true});
  }

  componentDidUpdate() {
    var color = this.props.annotations[this.props.pairing].canon ?
      this.props.colors1 : this.props.colors2;
    this.legend.select('rect')
      .attr('fill', color);
  }

  hoverCanvas(hovered) {
    this.setState({update: false, hovered});
  }

  render() {
    var style = {
      paddingTop: 80,
      width,
      margin: 'auto',
    };

    var other = this.props.pairing.replace(this.props.selected, '').replace('/', '');
    var imageStyle = {
      padding: 5,
      width: radius,
    };
    var images = _.map([this.props.selected, other], character => {
      character = _.find(this.props.characters, c => c.name === character);
      return (<img src={character.image} style={imageStyle} />);
    });

    var color = this.props.annotations[this.props.pairing].canon ?
      this.props.pink : this.props.purple;
    var heart = (<span style={{color}}>♥</span>);

    var genres = _.chain(this.props.genres)
      .map((stories, genre) => {
        return {
          genre,
          stories,
          months: _.groupBy(stories, story => story.publishGroup),
        };
      }).sortBy(d => d.genre)
      .map(data => <Genre {...this.props} {...this.state}
        {...data} hoverCanvas={this.hoverCanvas} />)
      .value();

    var fontSize = 12;
    var hoverStyle = {
      position: 'absolute',
      top: margin.top,
      right: 0,
      width: width * 0.25,
      textAlign: 'left',
      fontSize,
      fontFamily: 'Open Sans',
      backgroundColor: 'rgba(255,255,255,0.75)',
      borderRadius: 3,
    };
    var hovered;
    if (this.state.hovered) {
      var extent = this.state.hovered.extent;
      var month = d3.timeFormat('%b')(extent[0]);
      var dates = _.chain(extent).map(d => d.getDate()).uniq().value().join(' - ');
      var year = d3.timeFormat('%Y')(extent[0]);

      var stories = _.map(this.state.hovered.stories, (story, i) => {
        return (
          <li>
            <div>
              <strong>{story.title.text}</strong> ({d3.format(',')(story.reviews.text)} reviews)
            </div>
            <div>
              {story.genres.join(', ')}
            </div>
          </li>
        );
      });
      hovered = (
        <div style={hoverStyle}>
          <div>
            <strong>{month} {dates}, {year}</strong>
          </div>
          <sup>
            *click to open top story
          </sup>
          <ol style={{paddingLeft: 0, margin: 0}}>
            {stories}
          </ol>
        </div>
      );
    } else {
      var numStories = _.sumBy(_.values(this.props.stories), d => d.length);
      hovered = (
        <div style={hoverStyle}>
          <div><strong>Total ({d3.format(',')(numStories)} stories)</strong></div>
          <sup>*hover to see stories</sup>
        </div>
      );
    }

    return (
      <div style={style}>
        <div>{images}</div>
        <p>{this.props.selected} {heart} {other}</p>
        <p>
          <svg ref='legend' width={legendWidth + 2 * margin.left} height={22} />
        </p>
        <div style={{position: 'relative'}}>
          <Reviews {...this.props} {...this.state} hoverCanvas={this.hoverCanvas} />
          {genres}
          {hovered}
        </div>
      </div>
    );
  }
}

export default Pairing;
