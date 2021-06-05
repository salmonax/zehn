const $ = document.querySelector.bind(document);
const $$ = (...args) => [].slice.apply(document.querySelectorAll(...args));

Object.assign(window, { $, $$ });

console.log('globals loaded');