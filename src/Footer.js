import React, { Component } from 'react';

import _ from 'lodash';
import shirley from './images/characters/Shirley.svg';

class Footer extends Component {

  render() {
    var style = {
      width: 700,
      margin: 'auto',
      padding: '120px 0',
    };
    return (
      <div style={style}>
        <h2>A tribute</h2>
        <p style={{lineHeight: 1.6}}>
My family immigrated to America when I was 10 years old, and I spoke no English.  I studied every day, motivated by the need to understand what was going on around me.  My dictionary-reading paid off and half a year later, I was deemed "fluent enough".  I was able to read most grade-school books by then, but the Harry Potter series eluded me; I had checked out <em>Sorcerer’s Stone</em> many times, but found it too difficult every time.
        </p>

        <p style={{lineHeight: 1.6}}>
When <em>Goblet of Fire</em> came out that summer, my parents came back from Costco with the hardcover. Money was still tight in our household back then, and I had never owned such a beautiful book; I was touched and determined to get through the whole book.  When I did, I was ecstatic.  I binged the first three books, and was proud when I joined my first Harry Potter conversation.
        </p>

        <p style={{lineHeight: 1.6}}>
I have only good memories associated with Harry Potter, from that first hardcover (my parents made it a tradition to buy me every hardcover since), to the 3am screenings with my college floormates, to the full-theatre standing ovation as the credits rolled on the final film.  It’s given me a whole other world to daydream about, and a sense of belonging in this one.
        </p>

        <p style={{lineHeight: 1.6}}>
This year is the 20th anniversary of <em>Philosopher’s Stone</em>.<br />
With all my love, thank you JKR <span style={{color: this.props.pink}}>♥</span>
        </p>

        <br />
        <br />
        <br />
        <br />
        <br />

        <p>
        <img src={shirley} style={{padding: 5, width: 75}} />
        <br />
        <br />
        <sup>
many many thank you’s to <a href='https://twitter.com/catmule' target='_new'>Catherine Madden</a> for<br />
the beautiful illustrations of every character (and of me)
        </sup>
        <br />
        <br />
        <sup>
made with 💖 for <a href='http://www.datasketch.es/january/' target='_new'>January</a>: <a href='http://www.datasketch.es/' target='_new'>datasketch|es</a><br />
a monthly collaboration between <a href='https://twitter.com/nadiehbremer' target='_new'>Nadieh Bremer</a> and <a href='https://twitter.com/sxywu' target='_new'>Shirley Wu</a>
        </sup>
        </p>
      </div>
    );
  }
}

export default Footer;
