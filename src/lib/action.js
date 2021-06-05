// This is glue between engine, dom, and input methods
// It would probably make sense to associate them with individual "components"
const makeAction = (engine, presenter) => ({
    start: _ => engine.startLoop(),
    stop: _ => engine.stopLoop(),
    wakeUp: _ => {
      presenter.intro.stop();
      presenter.game.init(engine);
    },
    go: _ => {
      presenter.intro.turnOn();
      setTimeout(() => presenter.intro.start(), 450);
    },
    selectChum: ({ target }) => {
      const chumName = target.innerText.toLowerCase(); // TODO: switch to class, make chum-bar creation programmatic
      $$('.chum-dex .body .chums > *').forEach($el => {
        presenter.dex.selectChum(chumName);
        $el.classList[$el.classList.contains(chumName) ? 'add' : 'remove']('on');
      });
    },
    changeLocation: (e, loc) => {
      const clickedLoc = loc || e.target.innerText.split('\n')[0];
      engine.loadLoc(clickedLoc);
      $('.status .location').innerText = clickedLoc;
    },
  });

export default makeAction;