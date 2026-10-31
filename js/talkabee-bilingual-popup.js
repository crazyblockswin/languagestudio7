
(function(){
 if(window.__talkabeeBilingualPopup)return; window.__talkabeeBilingualPopup=true;
 var pop=document.createElement('div');pop.id='talkabee-object-popup';document.body.appendChild(pop);var timer=0;
 function lang(){var s=document.getElementById('lang')||document.getElementById('adventureLanguage')||document.getElementById('language')||document.querySelector('select[id*="Language"],select[id*="language"]');var v=s&&s.value?s.value:'en';return v==='nb'?'no':v}
 function first(v){return Array.isArray(v)?String(v[0]??''):String(v??'')}
 function engval(v){return Array.isArray(v)?String((v.length>1&&v[1]?v[1]:v[0])??''):String(v??'')}
 function cleanEnglish(el,key){
  var x=(el&&el.dataset&&(el.dataset.en||el.dataset.english||el.dataset.tbEn||el.dataset.name))||'';if(x)return String(x).replace(/^(the|a|an)\s+/i,'').trim();
  try{if(typeof EN!=='undefined'&&EN[key])return engval(EN[key]).replace(/^(the|a|an)\s+/i,'').trim()}catch(e){}
  try{if(typeof englishWords!=='undefined'&&englishWords[key])return engval(englishWords[key]).replace(/^(the|a|an)\s+/i,'').trim()}catch(e){}
  try{if(typeof wordEN!=='undefined'&&wordEN[key])return engval(wordEN[key]).replace(/^(the|a|an)\s+/i,'').trim()}catch(e){}
  try{if(typeof WORDS!=='undefined'&&WORDS.en&&!Array.isArray(WORDS.en)&&WORDS.en[key])return engval(WORDS.en[key]).replace(/^(the|a|an)\s+/i,'').trim()}catch(e){}
  try{if(typeof WORDS7!=='undefined'&&WORDS7.en&&WORDS7.en[key])return engval(WORDS7.en[key]).replace(/^(the|a|an)\s+/i,'').trim()}catch(e){}
  try{if(typeof LANGS!=='undefined'&&LANGS.en&&LANGS.en.words&&LANGS.en.words[key])return engval(LANGS.en.words[key]).replace(/^(the|a|an)\s+/i,'').trim()}catch(e){}
  try{if(typeof words!=='undefined'&&words.en&&words.en[key])return engval(words.en[key]).replace(/^(the|a|an)\s+/i,'').trim()}catch(e){}
  try{if(typeof languageData!=='undefined'&&languageData.en){if(languageData.en.objects&&languageData.en.objects[key])return engval(languageData.en.objects[key]).replace(/^(the|a|an)\s+/i,'').trim();if(languageData.en.words&&languageData.en.words[key])return engval(languageData.en.words[key]).replace(/^(the|a|an)\s+/i,'').trim()}}catch(e){}
  try{if(typeof objects!=='undefined'&&objects.en&&objects.en[key])return engval(objects.en[key]).replace(/^(the|a|an)\s+/i,'').trim()}catch(e){}
  try{if(typeof discoveryEnglish!=='undefined'&&discoveryEnglish[key])return engval(discoveryEnglish[key]).replace(/^(the|a|an)\s+/i,'').trim()}catch(e){}
  try{if(typeof EXTRA_WORDS!=='undefined'&&EXTRA_WORDS.en&&EXTRA_WORDS.en[key])return engval(EXTRA_WORDS.en[key]).replace(/^(the|a|an)\s+/i,'').trim()}catch(e){}
  return String(key||'').replace(/^(the|a|an)\s+/i,'').trim();
 }
 function lookup(el,key,l){
  if(el&&el.dataset){if(el.dataset[l])return el.dataset[l];var tb=el.dataset['tb'+l.charAt(0).toUpperCase()+l.slice(1)];if(tb)return tb}
  try{if(typeof languageData!=='undefined'&&languageData[l]){if(languageData[l].objects&&languageData[l].objects[key])return first(languageData[l].objects[key]);if(languageData[l].words&&languageData[l].words[key])return first(languageData[l].words[key])}}catch(e){}
  try{if(typeof objects!=='undefined'&&objects[l]&&objects[l][key])return first(objects[l][key])}catch(e){}
  try{if(typeof extraDiscovery!=='undefined'&&extraDiscovery[l]&&extraDiscovery[l][key])return first(extraDiscovery[l][key])}catch(e){}
  try{if(typeof WORDS!=='undefined'&&WORDS[l]){var w=WORDS[l];if(!Array.isArray(w)&&w[key])return first(w[key]);if(Array.isArray(w)&&WORDS.en){var en=cleanEnglish(el,key).toLowerCase(),ix=WORDS.en.findIndex(function(x){return engval(x).replace(/^(the|a|an)\s+/i,'').toLowerCase()===en});if(ix>=0&&w[ix])return first(w[ix])}}}catch(e){}
  try{if(typeof WORDS7!=='undefined'&&WORDS7[l]&&WORDS7[l][key])return first(WORDS7[l][key])}catch(e){}
  try{if(typeof LANGS!=='undefined'&&LANGS[l]&&LANGS[l].words&&LANGS[l].words[key])return first(LANGS[l].words[key])}catch(e){}
  try{if(typeof words!=='undefined'&&words[l]&&words[l][key])return first(words[l][key])}catch(e){}
  try{if(typeof W!=='undefined'&&W[l]&&W[l][key])return first(W[l][key])}catch(e){}
  try{if(typeof EXTRA_WORDS!=='undefined'&&EXTRA_WORDS[l]&&EXTRA_WORDS[l][key])return first(EXTRA_WORDS[l][key])}catch(e){}
  return (el&&el.dataset&&(el.dataset.word||el.dataset.object||el.dataset.en))||key||'';
 }
 function show(el,e){if(document.body.classList.contains('tb-hs-editing'))return;var key=(el.dataset&&(el.dataset.word||el.dataset.key||el.dataset.object||el.dataset.en))||el.id||(el.dataset&&el.dataset.name)||el.getAttribute('aria-label')||'';if(!key)return;var l=lang(),en=cleanEnglish(el,key),word=lookup(el,key,l);if(!word)return;var same=String(word).replace(/^(the|a|an)\s+/i,'').toLowerCase()===String(en).toLowerCase();pop.textContent=(l==='en'||same)?en:(word+' — '+en);pop.style.display='block';var r=el.getBoundingClientRect(),x=(e&&e.clientX)||r.left+r.width/2,y=(e&&e.clientY)||r.top+r.height/2;var pr=pop.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(innerWidth-pr.width-8,x+12))+'px';pop.style.top=Math.max(8,Math.min(innerHeight-pr.height-8,y-pr.height-10))+'px';clearTimeout(timer);timer=setTimeout(function(){pop.style.display='none'},1800)}
 document.addEventListener('click',function(e){var el=e.target.closest&&e.target.closest('.hotspot,.home-hotspot,.yacht-hotspot,.hotspots button,.train-hotspots button');if(el)show(el,e)},true);
})();
