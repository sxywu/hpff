import React, { Component } from 'react';

import _ from 'lodash';
import * as d3 from 'd3';

import Graph from './visualizations/Graph';

class Intro extends Component {

  render() {
    var style = {
      width: 700,
      margin: '80px auto',
    };
    var images = _.map(['Harry', 'Hermione', 'Ginny'], character => {
      var style = {
        padding: 5,
        width: character === 'Hermione' ? 100 : 75,
      };
      character = _.find(this.props.characters, c => c.name === character);
      return (<img src={character.image} style={style} />);
    });

    var fontSize = 14;
    var canon = [['canon', this.props.pink], ['non-canon', this.props.purple]];
    canon = _.map(canon, c => {
      var [text, color] = c;
      var style = {
        lineHeight: fontSize + 'px',
        display: 'inline-block',
        margin: 5,
      }
      var lineStyle = {
        display: 'inline-block',
        backgroundColor: color,
        width: fontSize,
        height: 3,
        borderRadius: 3,
        verticalAlign: 'middle',
      }
      return (
        <span style={style}>
          <span style={lineStyle} /> {text}
        </span>
      )
    });

    var genres = _.chain(this.props.data).map('genres')
      .flatten().countBy().toPairs().sortBy(d => -d[1]).value();
    var years = _.chain(this.props.data).countBy(d => d.published.getFullYear()).value();

    return (
      <div style={style}>
        <h1>
          <div>{images}</div>
          <div>The Most Popular of Them All:</div>
          <div>a look at fanfiction’s favorite ships</div>
        </h1>
        <sup>
          BY <a href='http://twitter.com/sxywu' target='_new'>SHIRLEY WU</a>
        </sup>

        <p style={{lineHeight: 1.6}}>
There are many aspects to the <em>Harry Potter</em> franchise: books, movies, a new play, studio tours and theme parks.  But when it comes to gauging fan reaction, there’s probably no better place than fanfiction; with ~760,000 stories on <a href='https://www.fanfiction.net/book/Harry-Potter/' target='_new'>fanfiction.net</a>, ~110,000 on <a href='https://archiveofourown.org/tags/Harry%20Potter%20-%20J*d*%20K*d*%20Rowling/works' target='_new'>Archive of Our Own</a>, and ~80,000 on <a href='http://www.harrypotterfanfiction.com/' target='_new'>Harry Potter Fanfiction</a> - that's a lot of reactions.
        </p>

        <p style={{lineHeight: 1.6}}>
For this visualization, I looked into <a href='http://www.harrypotterfanfiction.com/' target='_new'>Harry Potter Fanfiction</a> because of its more manageable numbers, meaningful metadata, and (I’ll be real) relatively family-friendly content.  First interesting find: the number of stories peaked in <strong>2007</strong> at <strong>12,613</strong> stories, held steady at around 7,000 until <strong>2011</strong>, and have been rapidly declining since. Second interesting (though not unexpected) find: at <strong>52,908</strong> stories, <strong style={{color: this.props.pink}}>Romance</strong> is the most popular genre - almost twice as popular as the next biggest genre, <strong>Drama</strong> (<strong>29,429</strong>).
        </p>

        <p style={{lineHeight: 1.6}}>
So of course, I was curious about all the <a href='http://www.urbandictionary.com/define.php?term=ship&defid=95335' target='_new'>ships</a>: who does the fandom want to see with whom?  The top two - <strong>Lily</strong> and <strong>James</strong>, and <strong>Ginny</strong> and <strong>Harry</strong> - are definitely <strong style={{color: this.props.pink}}>canon</strong>, but the third - <strong>Hermione</strong> and <strong>Draco</strong> - is <strong style={{color: this.props.purple}}>non-canon</strong>.  (I have this theory that Dramione blew up after Hermione punched Draco in the third movie, but alas, the data is inconclusive.)  The most popular leading lady is undoubtedly <strong>Hermione</strong>, with a whopping <strong>six</strong> suitors.
        </p>

        <br />
        <br />
        <p style={{lineHeight: 1.6}}>
<em>Explore <strong>Hermione</strong>’s stories, or select another character to see theirs:</em>
        </p>

        <p style={{lineHeight: 1.6}}>
          {canon}
        </p>
        <p>
          <Graph {...this.props} />
        </p>
      </div>
    );
  }
}

export default Intro;
