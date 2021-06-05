const div = (selector, style, text) => {
  const _div = document.createElement('div');
  Array.isArray(selector) ?
    _div.classList.add(...selector) :
    _div.classList.add(selector);
  Object.assign(_div.style, style);
  if (text) _div.innerText = text;
  return _div;
};

console.log('wew')

const makePresenter = (binding) => ({
  bindEvents() {
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
  }
});

export const makeDomBinding = (action) => ({
  '.chum-bar .icon': action.selectChum,
  '.start': action.start,
  '.stop': action.stop,
  '.locale': action.changeLocation,
  '.awaken .link': action.wakeUp,
  '.go': action.go,
});

export function buildMap(world, $root = $('.map')) {
  const locMap = world.orientation;
  console.log(locMap);
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
      //- console.log(dir)
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
}

export default makePresenter;