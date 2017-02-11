import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

import Reviews from './Reviews';
import Genre from './Genre';

var radius = 75;

class Pairing extends Component {

  render() {
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
      .map(data => <Genre {...this.props} {...data} />)
      .value();

    return (
      <div>
        <div>{images}</div>
        <div>{this.props.selected} {heart} {other}</div>
        {genres}
        <Reviews {...this.props} />
      </div>
    );
  }
}

export default Pairing;
