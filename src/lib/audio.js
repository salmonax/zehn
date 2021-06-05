const audio = {
  fx: {
    dexGet: new Audio('assets/sound/imrcv.ogg'),
    dexSend: new Audio('assets/sound/imsend.ogg'),
    telemetry: new Audio('assets/sound/type3.mp3'),
    crt: new Audio('assets/sound/crt.mp3'),
  },
  music: {
    apartment: new Audio('assets/sound/apartment.ogg'),
    'office building': new Audio('assets/sound/office.ogg'),
    street: new Audio('assets/sound/gangbusters.ogg'),
    bistro: new Audio('assets/sound/bistro.ogg'),
    'secret lab': new Audio('assets/sound/tech.ogg'),
    'chez fremp': new Audio('assets/sound/fremp.ogg'),
    zehn: new Audio('assets/sound/zehn.ogg'),
  },
};

export default audio;