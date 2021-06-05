import audio from './audio';
import { ascii } from './constants';
import { type, pester, bus, parseTime, cap } from './utils';

const { on } = bus;

const div = (selector, styleOrChild, textOrChild, ...children) => {
  const _div = document.createElement('div');
  Array.isArray(selector) ?
    _div.classList.add(...selector) :
    _div.classList.add(selector);

  if (textOrChild instanceof HTMLDivElement) {
    children.unshift(textOrChild);
  } else if (textOrChild) {
     _div.innerText = textOrChild;
  }
  if (styleOrChild instanceof HTMLDivElement) {
    children.unshift(styleOrChild);
  } else {
    Object.assign(_div.style, styleOrChild);
  }
  children.forEach(el => _div.appendChild(el));
  return _div;
};


// const d = div;
// d('.chum-dex',
//   d('.chum-bar',
//     d('.icon.quit', null, 'Quint'),
//     d('.icon.fremp', null, 'Fremp'),
//     d('.icon.bee', null, 'Bee'),
//   ),
//   d('.body',
//     d('.left',
//       d('.chums',
//         d('.quint'),
//         d(',fremp'),
//         d('.bee'),
//       ),
//       d('.respond'),
//     ),
//     d('.side'),
//   ),
// )

function pug(strings, ...values) {
  let divArgs = [];
  const nest = [];
  let minLeadingSpaceCount = Infinity;

  /* Might want to do this in two passes:
    1. string interpolation, in-place, check for "style=" and skip
    2. style interpolation, the way we're doing it before
  */
  let out = '';
  strings.forEach((str, i) => {
    const lines = str.replace(/(\(|\)|style=)/g, '').split('\n');
    lines.forEach((line, j) => {
      const match = line.match(/^ +/);
      if (!match) return null;
      const leadingSpaceCount = match[0].length;
      line = line.trim();

      // move to previous line if not starting with selector
      if (!['.', '#'].includes(line[0])) {
        divArgs[divArgs.length-1][3] = line;
        return;
      }
      const splitLine = line.split(' ');
      const classNames = splitLine[0].split('.').filter(n => n);
      const text = splitLine.slice(1).join(' ');
      const styles = j === lines.length-1 ?  values[i] : null;
      const lineData = [
        leadingSpaceCount,
        classNames,
        styles,
        text ? text : null,
      ];
      divArgs.push(lineData);
      if (minLeadingSpaceCount > leadingSpaceCount) minLeadingSpaceCount = leadingSpaceCount;
    });
    out += str;
  });
  divArgs.forEach(n => n[0] = n[0] - minLeadingSpaceCount);

  let lastParents = [];
  for (let i = 1; i < divArgs.length; i++) {
    const item = divArgs[i];
    if (item[0] > divArgs[i-1][0]) {
      lastParents.unshift(divArgs[i-1]);
      lastParents[0].push(item);
    } else if (item[0] < divArgs[i-1][0]) {
      lastParents.shift();
      lastParents[0][4].push(item);
    } else {
      lastParents[0][4].push(item);
    }
  }
  divArgs.forEach(n => n.shift());

  function divify(item) {
    if (!item[3]) return div(...item);
    return div(
      ...item.slice(0, 3),
      ...item.slice(3).map(child => divify(child)),
    );
  }
  // divArgs.forEach(n => console.log(n));
  console.log(divify(divArgs[0]));
  return out;
}

// console.log(pug`
//   .chum-dex Cool stuff I guess
//     .chum-bar(style=${{
//       background: 'green',
//     }}) Why did I do that?
//       .icon.quint Quint
//       .icon.fremp Fremp
//       .icon.bee Bee
//     .body
//       .left
//         .chums
//           .quint
//           .fremp.on
//           .bee
//         .respond
//       .side
// `);


export const makeDomBinding = (action) => ({
  '.chum-bar .icon': action.selectChum,
  '.start': action.start,
  '.stop': action.stop,
  '.locale': action.changeLocation,
  '.awaken .link': action.wakeUp,
  '.go': action.go,
});

const makePresenter = () => ({
  bindEvents(binding) {
    Object.keys(binding).forEach(selector => {
      if (typeof binding[selector] === 'function') {
        return $$(selector).forEach($el => $el.addEventListener('click', e => {
          e.stopPropagation();
          binding[selector](e);
        }));
      }
      Object.keys(binding[selector]).forEach(action => {
        $$(selector).forEach($el => $el.addEventListener(action, binding[selector][action]));
      });
    });
  },
  buildMap(world, $root = $('.map')) {
    const locMap = world.orientation;
    const offsets = {
      n: { top: -35 },
      s: { top: 35 },
      w: { left: -130 },
      e: { left: 130 },
    };
    const reg = {};
    Object.keys(locMap).forEach(loc => {
      const $parent = _addOrGet(loc);
      Object.keys(locMap[loc]).forEach(dir => {
        const subLoc = locMap[loc][dir];
        _addOrGet(subLoc, $parent, offsets[dir]);
      });
    });
    _fixPosition();

    function _addOrGet(loc, $parent = $root, style) {
      if (reg[loc]) {
        if ($parent !== $root) {
          Object.assign(reg[loc].style, style);
          $parent.appendChild(reg[loc]);
        }
        return reg[loc];
      }
      const locClass = loc.replace(/\s/,'-');
      let $el = reg[loc] = div(['locale', locClass], style, loc);
      $parent.appendChild($el);
      return $el;
    }
    function _fixPosition(_$root = $root) {
      const { x: xo, y: yo } = _$root.getBoundingClientRect();
      const $$locales = $$('.locale');
      const { width, height } = $$locales[0].getBoundingClientRect(); // assumes all same
      const relPos = $$locales.map($el => {
        const { x, y } = $el.getBoundingClientRect();
        return [x-xo,y-yo] ;
      });
      const [xMin, yMin]= Array(2).fill()
        .map((_, i) => Math.min.apply(null, relPos.map(n => n[i])))
      const [xMax, yMax]= Array(2).fill()
        .map((_, i) => Math.max.apply(null, relPos.map(n => n[i])));

      $$locales.forEach(($el, i) => {
        Object.assign($el.style, {
          left: relPos[i][0] - xMin,
          top: relPos[i][1] - yMin,
        });
        _$root.appendChild($el);
      });
      Object.assign(_$root.style, {
        width: xMax-xMin + width,
        height: yMax-yMin + height,
        bottom: 40,
        left: 40,
      });
    }
  },
  dex: {
    _texts: {},
    _selectedChum: null,
    _addText(chum, msg) {
      const texts = this._texts;
      if (!texts[chum]) texts[chum] = [];
      texts[chum].push(msg);
      this._render(chum);
    },
    _toHTML({ label, text }) {
      return `<div class="dex-msg"><span class="in">${label}</span> ${text}</div>`;
    },
    _render(chum, rootSelector = '.chum-dex .chums') {
      // This is append only and shouldn't be re-rendered from scratch every time. blargh.
      const html = this._texts[chum].map(this._toHTML).join(' ');
      const selector = `${rootSelector} .${chum}`; // NOOO!!!
      if ($(selector) === null) console.error(selector)
      $(selector).innerHTML = html;
      $(selector).scrollTo({ top: 1000, behavior: 'smooth' });
    },
    selectChum(chumName) {
      this._selectedChum = chumName;
    },
    checkAndUpdate(gameTime, startTime, { dex: dexData }) {
      Object.keys(dexData).forEach(chum => {
        Object.keys(dexData[chum]).forEach(time => {
          const texts = dexData[chum][time];
          const parsedMsgTime = parseTime(time);
          if (parsedMsgTime <= gameTime && !texts._triggered) {
            const startSecs = Math.random()*40;
            let delay, slack; // leave undefined, use function default by default
            const isBeforeGame = parsedMsgTime < startTime;
            if (isBeforeGame) delay = slack = 0;
            pester(chum, texts, (text, i, d) => {
              if (!isBeforeGame) audio.fx.dexGet.play();
              const secs = Math.min(59,((startSecs + i*d/25)|0)).toFixed().padStart(2, '0'); // formatting
              // bleh, move this into the dex:
              const label = `${time}:${secs} ${cap(chum)}:`;
              // console.log(msg);
              this._addText(chum, { label, text });
            }, delay, slack);
            texts._triggered = true;
          }
        });
      });
    },
  },
  game: {
    init(engine) {
      $('.chum-dex .side').innerText = ascii.chum;
      $('.status .location').innerText = 'bistro';
      engine.startLoop();
      engine.loadLoc('bistro');
    },
    updateClock(gameTime) {
      $('.time').innerText = (new Date(gameTime)).toLocaleString();
    },
    enterRoom(locName, lastLocName, description) {
      $('.description').innerText = '';
      audio.fx.telemetry.play();

      const lastRoomMusic = audio.music[lastLocName];
      const roomMusic = audio.music[locName];
      lastRoomMusic && lastRoomMusic.pause();
      if (roomMusic) {
        roomMusic.currentTime = 0;
        roomMusic.play();
      }

      type(description, c => {
        $('.description').innerText += c;
        audio.fx.telemetry.currentTime = 0;
      }, 10, 50); // This is dumb.
    },
  },
  intro: {
    turnOn() {
      audio.fx.crt.play();
      $('.white').classList.add('on');
      $('.go').classList.add('off');
    },
    start() {
      //- audio.music['office building'].play();
      $('.zehn .logo').innerText = ascii.zehn;
      $('.zehn .backdrop').innerText = ascii.introBackground.repeat(100);
      audio.music.zehn.play();

      setTimeout(() => {
        audio.fx.telemetry.play();
        type(`ARGH, STOP DREAMING ABOUT THIS KEYGEN INTRO STUFF!`, c => {
          audio.fx.telemetry.currentTime = 0;
          $('.awaken .comment').innerText += c;
        }, 10, 50)
          .then(_ => {
            type('WAKE UP!', c => {
              audio.fx.telemetry.currentTime = 0;
              $('.awaken .link').innerText += c;
            }, 10, 50);
          });
      }, 6000);

    },
    stop() {
      audio.music.zehn.pause();
      $('.zehn').classList.add('hidden');
    },
  },
});

export default makePresenter;