(function () {
  var page = document.querySelector('#content');
  if (!page || document.querySelector('.page3-pronunciation')) return;
  var audio = document.createElement('audio'); audio.className='page3-pronunciation'; audio.controls=true; audio.preload='metadata'; audio.src='./content/i18n/sw-TZ/audio/pg003_consonant_pronunciation_guide.mp3?v=20260829-syllables-v2'; audio.setAttribute('aria-label','Mwongozo wa matamshi ya konsonanti kwa Kiswahili Tanzania');
  var label=document.createElement('p'); label.textContent='Sikiliza mwongozo wa kutamka konsonanti.'; label.className='sr-only'; page.insertBefore(label,page.firstChild); page.insertBefore(audio,label.nextSibling);
}());

