import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

import Reviews from './Reviews';
import Genre from './Genre';

var radius = 75;
var dotSize = 5;
var margin = {top: 20, left: 20};
var width = 16 * 12 * dotSize + 2 * margin.left;

class Pairing extends Component {

  constructor(props) {
    super(props);

    this.state = {update: true, hovered: null}
    this.hoverCanvas = this.hoverCanvas.bind(this);
  }

  componentWillReceiveProps() {
    this.setState({update: true});
  }

  hoverCanvas(hovered) {
    this.setState({update: false, hovered});
  }

  render() {
    var style = {
      paddingTop: 120,
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

    var color = this.props.annotations[this.props.pairing].canon ? this.props.pink : this.props.purple;
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
      top: 0,
      right: 0,
      width: width * 0.28,
      textAlign: 'left',
      fontSize,
      fontFamily: 'Open Sans',
      backgroundColor: 'rgba(255,255,255,0.75)',
      borderRadius: 3,
    };
    var hovered;
    if (this.state.hovered) {
      var extent = this.state.hovered.extent;
      var month = d3.timeFormat('%B')(extent[0]);
      var dates = _.chain(extent).map(d => d.getDate()).uniq().value().join(' - ');
      var year = d3.timeFormat('%Y')(extent[0]);

      var stories = _.map(this.state.hovered.stories, (story, i) => {
        var link = 'http://harrypotterfanfiction.com/' + story.title.link;
        return (
          <li>
            <div>
              <a href={link} target='_new'>
                <strong>{story.title.text}</strong>
              </a> ({story.reviews.text} reviews)
            </div>
            <div>
              {story.genres.join(', ')}
            </div>
          </li>
        );
      });
      hovered = (
        <div style={hoverStyle}>
          <p className='header'>{month} {dates}, {year}</p>
          <ol style={{paddingLeft: fontSize, margin: 0}}>
            {stories}
          </ol>
        </div>
      );
    }

    return (
      <div style={style}>
        <div>{images}</div>
        <div>{this.props.selected} {heart} {other}</div>
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
