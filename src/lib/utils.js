// Bleh, just kludging this for now
export function parseTime(timeString, startTime = engine.clock.start) {
  if (!timeString.includes(':')) { // ugh...
    timeString = timeString.slice(0, timeString.length-2) + ':' + timeString.slice(-2);
  }
  const dateString =
    new Date(engine.clock.start).toLocaleDateString("en-US", {timeZone: "America/Los_Angeles"});
  let [hh, mm] = timeString.split(':');
  let dayOffset = 0;
  //- hh = +hh, mm = +mm;
  if (+hh > 24 || (+hh === 24 && +mm > 0)) {
    hh = (+hh - 24).toFixed().padStart(2, '0');
    dayOffset = 8.64e7;
  }
  return Date.parse(`${dateString} ${hh}:${mm}:00 PDT`) + dayOffset;
}

// DRY this with type function
export function pester(chum, texts, cb = console.log, delay = 500, slack = 500) {
  if (!pester.queue) pester.queue = {};
  if (!pester.queue[chum]) pester.queue[chum] = Promise.resolve();
  pester.queue[chum] = pester.queue[chum]
    .then(_ => texts
      .map((n, i) => _ =>
        new Promise(r => {
          const adjustedDelay = delay + Math.round((Math.random()*slack*2)-slack);
          setTimeout(_ => r(cb(n, i, adjustedDelay)), adjustedDelay);
        }),
      )
      .reduce((last, next) => last.then(next), Promise.resolve()),
    );
}

export function cap(txt) {
  return txt[0].toUpperCase() + txt.substr(1);
}

export function type(text, cb = console.log, delay = 200, slack = 100) {
  clearInterval(type.interval);
  return text.split('')
    .map((n, i) => _ =>
      new Promise(r => {
        const adjustedDelay = delay + Math.round((Math.random()*slack*2)-slack);
        type.interval = setTimeout(_ => r(cb(n, i, adjustedDelay)), adjustedDelay);
      }),
    )
    .reduce((last, next) => last.then(next), Promise.resolve());
}

export function fetchWorld(yml) {
    return fetch(yml).then(r => r.text()).then(window.jsyaml.load);
  }


export const bus = {
  emit(eventName, ...detail) {
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
  },
  on(eventName, ...cbs) {
    cbs.forEach(cb => {
      document.addEventListener(eventName, e => cb(...e.detail));
    });
  },
};