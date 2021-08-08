// import data from "./game.yml";
import makeEngine from './engine';
import makePresenter, { makeDomBinding } from './presenter';
import makeAction from './action';
import { fetchWorld, bus } from './utils';

const { on } = bus;

// const pipe = (...fs) => fs.reduce((a, f) => f(a), null);

const _debug = {
  skipIntro: false,
};

async function init() {
  const world = window.world = await fetchWorld('/game.yml');
  const presenter =  window.presenter = makePresenter();
  const engine = window.engine =  makeEngine(world);
  const action = window.action =  makeAction(engine, presenter);

  // buildMap(world); // uhh.. this goes in the presenter?
  presenter.buildMap(world);
  presenter.bindEvents(makeDomBinding(action));
  on('clock:tick', presenter.game.handleUpdateClock);
  on('clock:slowtick',
    presenter.dex.handleCheckAndUpdate,
    presenter.room.handleCheckAndUpdate,
  );

  // on('dex:message',
  //   presenter.dex.update,
  // );
  // on('room:message',
  //   presenter.room.update,
  // );
  on('room:enter', presenter.room.handleEnter);

  if (_debug.skipIntro) action.wakeUp();
}

export default {
  init,
};