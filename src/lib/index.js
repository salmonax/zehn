// import data from "./game.yml";
import makeEngine from './engine';
import makePresenter, { makeDomBinding, buildMap } from './presenter';
import makeAction from './action';
import { fetchWorld } from './utils';


const pipe = (...fs) => fs.reduce((a, f) => f(a), null);

const _debug = {
  skipIntro: true,
};

async function init() {
  const world = window.world = await fetchWorld('/game.yml');
  const engine = window.engine =  makeEngine(world);
  const action = window.action =  makeAction(engine);
  const domBinding = window.domBinding =  makeDomBinding(action);
  const presenter =  window.presenter = makePresenter(domBinding);

  buildMap(world); // uhh.. this goes in the presenter?
  presenter.bindEvents();
  if (_debug.skipIntro) action.wakeUp();
}

export default {
  init,
};