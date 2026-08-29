(function () {
  var page = document.querySelector('#content');
  if (!page || document.querySelector('.page93-audio')) return;
  var audio = document.createElement('audio');
  audio.className = 'page93-audio';
  audio.controls = true;
  audio.preload = 'metadata';
  audio.src = './content/i18n/sw-TZ/audio/pg093_exercise5_read_aloud.mp3?v=20260829';
  audio.setAttribute('aria-label', 'Sauti ya Zoezi la tano, ukurasa wa 93');
  var label = document.createElement('p');
  label.textContent = 'Sikiliza maelekezo, maneno ya kuchagua na sentensi za Zoezi la tano.';
  label.className = 'sr-only';
  page.insertBefore(label, page.firstChild);
  page.insertBefore(audio, label.nextSibling);
}());
