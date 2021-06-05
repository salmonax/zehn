/*
  The engine shouldn't need to access audio or do *any* DOM business. It's responsibilities are as follows:
  1. Serve as the main broker between the game file, the realtime clock, and the runtime
  2. Dispatch events, for now mainly to the presenter.
 */
import { bus } from './utils';
const { emit } = bus;

const makeEngine = (world) => ({ // just following convention
  world,
  _startTime: null,
  _elapsed: 0,
  _gameClockInterval: null,
  _playerLoc: null,
  clock: {
    start: Date.parse(`5/7/2032 15:30:00 PDT`),
    end: Date.parse(`5/8/2032 15:30:00 PDT`),
    durationInMinutes: 25,
    getGameTime(elapsed) {
      return Math.round(
        this.start + (this.end - this.start)/1000/60/this.durationInMinutes*elapsed,
      );
    }
  },
  // Hrm, definitely shouldn't be handling DOM business here:
  get gameTime() {
    return this.clock.getGameTime(this._elapsed);
  },
  loadLoc(locName) {
    //- window.argh = this.world.description[locName].first;
    const trimAndSpace = t => t.trim().replace(/(\n+)\s*/g,'$1').replace(/\n{1}/g, '\n\n');
    const lastLocName = this._playerLoc;
    const room = this.world.description[locName] || this.world.description.any; // This is junk; can be either string or object. Fix.
    if (!room) return;
    if (typeof room === 'object') {
      if (!room._visitCount) room._visitCount = 0;
      room._visitCount++;
    }

    const description =
      ((typeof room === 'string') ?
        room :
        (room._visitCount === 1 ? (room.first ? trimAndSpace(room.first) + '\n\n' : '') : '') + trimAndSpace(room.always));

    emit('room:enter', locName, lastLocName, description);
    this._playerLoc = locName;
  },
  startLoop() {
    if (this._startTime) return;
    this._startTime = Date.now();
    this.loop();
    this._gameClockInterval = window.setInterval(this.loop.bind(this), 100);
  },
  stopLoop() {
    window.clearInterval(this._gameClockInterval);
    this._reset();
  },
  _reset() {
    this._gameClockInterval = null;
    this._startTime = null;
  },
  loop() {
    // Get current gameTime
    const { clock } = this;
    const elapsed = this._elapsed = Date.now() - this._startTime;
    const gameTime = clock.getGameTime(elapsed);
    // End game, if applicable
    if (gameTime > this.clock.end) {
      alert('GAME OVER');
      this.stopLoop();
    }
    emit('clock:tick', gameTime, clock.start, world); // let things react to this
  },
});

export default makeEngine;