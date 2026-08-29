(function () {
  "use strict";

  // Ensure every instructional image in the early writing lessons is wired to
  // its existing Swahili audio-description catalogue entry.  Some legacy
  // pages had the description/caption but omitted this linking attribute.
  function ensureImageAudioDescriptionIds() {
    document.querySelectorAll("img[data-adt-description]").forEach(function (image) {
      if (image.dataset.adtAudioDescriptionId) return;
      var id = image.dataset.id;
      if (!id && /pg016_trace_m_source/.test(image.src)) id = "pg016_im004";
      if (!id && /pg022_trace_n_source/.test(image.src)) id = "pg022_im002";
      if (!id) return;
      image.dataset.id = id;
      image.dataset.adtAudioDescriptionId = id + "_audio_description";
    });
  }

  ensureImageAudioDescriptionIds();
  const KEY = "kuandika-mwaka-1-responses:" + location.pathname;
  let state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));

  function placeWritingOnLetterModel(card) {
    const model = card.querySelector(".sample-letter-model");
    const wrap = card.querySelector(".canvas-wrap");
    const canvas = wrap && wrap.querySelector("canvas");
    if (!model || !wrap || !canvas) return false;

    model.classList.remove("sample-letter-model");
    model.classList.add("trace-letter-model");
    wrap.classList.remove("canvas-wrap");
    wrap.classList.add("trace-canvas-wrap", "model-writing-wrap");
    canvas.classList.add("trace-canvas", "handwriting-canvas");
    wrap.insertBefore(model, canvas);
    card.classList.add("trace-response", "write-on-model");

    const caption = card.querySelector(".sample-model-caption");
    if (caption) caption.textContent = "Andika juu ya mfano";
    return true;
  }

  function sourcePrompt(card) {
    let node = card.previousElementSibling;
    while (node && !node.matches("p,h1,h2,h3,h4")) node = node.previousElementSibling;
    return (node && node.textContent || "").trim();
  }
  function rowCount(prompt) {
    const lower = prompt.toLocaleLowerCase("sw-TZ");
    if (/habari|hadithi|insha|barua|aya\b/.test(lower)) return 5;
    if (/sentensi/.test(lower)) {
      const numbers = { moja: 1, mbili: 2, tatu: 3, nne: 4, tano: 5, sita: 6, saba: 7, nane: 8, tisa: 9, kumi: 10 };
      for (const [word, value] of Object.entries(numbers)) if (lower.includes(word)) return Math.max(2, value);
      return 3;
    }
    if (/maneno|majina/.test(lower)) return 2;
    return 1;
  }
  function setupCard(card, index) {
    const canvas = card.querySelector("canvas");
    const clear = card.querySelector(".clear-response");
    const id = card.dataset.responseId || String(index);
    const prompt = sourcePrompt(card);
    const isDrawing = /^chora\b/i.test(prompt) && !/andika|nakili|fuatisha/i.test(prompt);
    card.classList.toggle("drawing-response", isDrawing);
    card.dataset.writingRows = String(isDrawing ? 1 : rowCount(prompt));
    const wrap = card.querySelector(".canvas-wrap,.trace-canvas-wrap") || canvas.parentElement;
    wrap.style.setProperty("--writing-row-count", card.dataset.writingRows);
    const rows = Number(card.dataset.writingRows);
    if (!isDrawing && rows > 1) canvas.height = Math.max(canvas.height, rows * 180);
    const ctx = canvas.getContext("2d");
    let drawing = false, last = null;
    function point(event) {
      const rect = canvas.getBoundingClientRect();
      const source = event.touches && event.touches[0] || event;
      return { x: (source.clientX - rect.left) * canvas.width / rect.width, y: (source.clientY - rect.top) * canvas.height / rect.height };
    }
    function start(event) { drawing = true; last = point(event); event.preventDefault(); }
    function move(event) {
      if (!drawing) return;
      const next = point(event);
      ctx.strokeStyle = "#153d4a"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(next.x, next.y); ctx.stroke(); last = next;
      state[id] = { ...(state[id] || {}), drawing: canvas.toDataURL("image/png"), submitted: false };
      save(); updateFeedback(); event.preventDefault();
    }
    function stop() { drawing = false; last = null; }
    for (const name of ["pointerdown", "touchstart"]) canvas.addEventListener(name, start, { passive: false });
    for (const name of ["pointermove", "touchmove"]) canvas.addEventListener(name, move, { passive: false });
    for (const name of ["pointerup", "pointercancel", "pointerleave", "touchend"]) canvas.addEventListener(name, stop);
    const saved = state[id] && state[id].drawing;
    if (saved) { const image = new Image(); image.onload = () => ctx.drawImage(image, 0, 0, canvas.width, canvas.height); image.src = saved; }

    const actions = document.createElement("div"); actions.className = "response-actions";
    const submit = document.createElement("button"); submit.type = "button"; submit.className = "submit-response"; submit.textContent = "Wasilisha jibu";
    const feedback = document.createElement("p"); feedback.className = "response-feedback"; feedback.setAttribute("aria-live", "polite");
    clear.parentNode.insertBefore(actions, clear); actions.append(clear, submit); actions.parentNode.insertBefore(feedback, actions.nextSibling);
    function answered() { return Boolean(state[id] && state[id].drawing); }
    function updateFeedback() {
      feedback.textContent = state[id] && state[id].submitted ? "Jibu limehifadhiwa kwa ajili ya kukaguliwa na mwalimu." : "";
      card.classList.toggle("response-missing", feedback.dataset.missing === "true" && !answered());
    }
    submit.addEventListener("click", () => {
      if (!answered()) { feedback.textContent = "Kamilisha jibu kabla ya kuwasilisha."; feedback.dataset.missing = "true"; card.classList.add("response-missing"); return; }
      state[id] = { ...(state[id] || {}), submitted: true }; save(); feedback.dataset.missing = "false"; card.classList.remove("response-missing"); updateFeedback();
    });
    clear.addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); delete state[id]; save(); feedback.textContent = "Jibu limefutwa."; feedback.dataset.missing = "false"; card.classList.remove("response-missing");
    });
    updateFeedback();
    return { id, answered, card, feedback };
  }
  const responseCards = Array.from(document.querySelectorAll(".response-card"));
  window.KuandikaWritingActivities = window.KuandikaWritingActivities || {};
  window.KuandikaWritingActivities.setupCard = function (card) {
    if (!card || card.dataset.writingReady === "true") return null;
    placeWritingOnLetterModel(card);
    const controller = setupCard(card, document.querySelectorAll(".response-card").length);
    card.dataset.writingReady = "true";
    return controller;
  };
  responseCards.forEach(placeWritingOnLetterModel);
  const controllers = responseCards.map(function (card, index) {
    const controller = setupCard(card, index);
    card.dataset.writingReady = "true";
    return controller;
  });
  if (controllers.length) {
    const action = document.createElement("div"); action.className = "page-submit-action";
    const submit = document.createElement("button"); submit.type = "button"; submit.className = "page-submit-button"; submit.textContent = "Wasilisha majibu ya ukurasa";
    const feedback = document.createElement("p"); feedback.className = "page-submit-feedback"; feedback.setAttribute("aria-live", "polite");
    action.append(submit, feedback); document.querySelector("#content section").append(action);
    submit.addEventListener("click", () => {
      let missing = 0;
      controllers.forEach(controller => {
        if (!controller.answered()) { missing++; controller.feedback.textContent = "Kamilisha jibu kabla ya kuwasilisha."; controller.card.classList.add("response-missing"); }
        else { state[controller.id] = { ...(state[controller.id] || {}), submitted: true }; controller.card.classList.remove("response-missing"); controller.feedback.textContent = "Jibu limehifadhiwa kwa ajili ya kukaguliwa na mwalimu."; }
      });
      save(); feedback.textContent = missing ? `Majibu ${missing} bado hayajakamilika.` : "Majibu yote yamehifadhiwa kwa ajili ya kukaguliwa na mwalimu.";
    });
  }
})();

/* Pages 41-105: keep every PDF example, but present handwriting work with the
   same quiet notebook pattern established on page 33. */
(function () {
  const match = location.pathname.match(/\/pg(0(?:4[1-9]|[5-9]\d)|10[0-5])_sec\d+\.html$/i);
  if (!match) return;

  const pageNumber = Number(match[1]);
  const page = document.querySelector("#content section") || document.querySelector("[data-section-id]");
  if (!page) return;
  document.documentElement.classList.add("pages-41-60-standard");
  page.classList.add("batch-v2-page", "batch-v2-page-" + pageNumber);

  const modelDescriptionMap = {
    pg060_im001: "Herufi kubwa K iko upande wa kushoto na mifano ya K yenye nukta iko upande wa kulia kwenye mistari ya mwandiko.",
    pg060_im002: "Majina ya mfano yameandikwa kwa mwandiko wa kuunga kwenye mistari ya daftari.",
    pg060_im003: "Sentensi za mfano zimeandikwa kwa mwandiko wa kuunga kwenye mistari ya daftari.",
    pg061_im001: "Herufi kubwa N inaonekana pamoja na mifano ya N yenye nukta kwenye mistari ya mwandiko.",
    pg061_im002: "Majina ya mfano yamepangwa kwenye mistari ya mwandiko wa kuunga ili yanakiliwe.",
    pg061_im003: "Sentensi za mfano zimepangwa kwenye mistari ya daftari ili ziandikwe tena.",
    pg064_im001: "Herufi kubwa L iko pamoja na mifano ya L yenye nukta ya kufuatisha kwenye mistari ya mwandiko.",
    pg064_im002: "Majina ya mfano yameandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg064_im003: "Sentensi za mfano zimeandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg065_im001: "Herufi kubwa T iko pamoja na mifano ya T yenye nukta ya kufuatisha kwenye mistari ya mwandiko.",
    pg065_im002: "Majina ya mfano yameandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg065_im003: "Mistari ya daftari iliyo wazi imetengwa kwa mwanafunzi kuandika majibu ya zoezi.",
    pg066_im001: "Herufi kubwa P iko pamoja na mifano ya P yenye nukta ya kufuatisha kwenye mistari ya mwandiko.",
    pg066_im002: "Majina ya mfano yameandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg066_im003: "Sentensi za mfano zimeandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg067_im001: "Herufi kubwa S iko pamoja na mifano ya S yenye nukta ya kufuatisha kwenye mistari ya mwandiko.",
    pg067_im002: "Majina ya mfano yameandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg067_im003: "Sentensi za mfano zimeandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg068_im002: "Herufi F, majina na sentensi za mfano zimepangwa kwenye mistari ya mwandiko wa kuunga.",
    pg068_im003: "Majina ya mfano yameandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg068_im004: "Sentensi za mfano zimeandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg052_im001: "Herufi kubwa A iko pamoja na mifano ya A yenye nukta ya kufuatisha kwenye mistari ya mwandiko.",
    pg053_im001: "Herufi kubwa E iko pamoja na mifano ya E yenye nukta ya kufuatisha kwenye mistari ya mwandiko.",
    pg055_im001: "Herufi kubwa O iko pamoja na mifano ya O yenye nukta ya kufuatisha kwenye mistari ya mwandiko.",
    pg056_im001: "Herufi kubwa U iko pamoja na mifano ya U yenye nukta ya kufuatisha kwenye mistari ya mwandiko.",
    pg073_im001: "Herufi kubwa Z iko pamoja na mifano ya Z yenye nukta ya kufuatisha kwenye mistari ya mwandiko.",
    pg073_im002: "Majina ya mfano yameandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg075_im002: "Herufi kubwa H iko pamoja na mifano ya H yenye nukta ya kufuatisha kwenye mistari ya mwandiko.",
    pg075_im003: "Majina ya mfano yameandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg075_im004: "Sentensi za mfano zimeandikwa kwenye mistari ya mwandiko wa kuunga.",
    pg078_im001: "Majina ya mfano yanayoanza kwa CH yameandikwa kwenye mistari ya mwandiko.",
    pg078_im003: "Konsonanti CH iko pamoja na mifano yake yenye nukta ya kufuatisha kwenye mistari ya mwandiko.",
    pg069_im001: "Herufi kubwa J iko upande wa kushoto na mifano ya herufi J za kufuatisha kwenye mistari ya mwandiko.",
    pg069_im002: "Mifano ya majina yanayoanza kwa herufi J imeandikwa kwenye mstari wa mwandiko.",
    pg069_im003: "Mifano ya sentensi zenye herufi J imeandikwa kwenye mistari ya mwandiko.",
    pg071_im001: "Herufi kubwa G iko upande wa kushoto na mifano ya herufi G za kufuatisha kwenye mistari ya mwandiko.",
    pg071_im002: "Mifano ya majina yanayoanza kwa herufi G imeandikwa kwenye mstari wa mwandiko.",
    pg072_im001: "Mifano ya sentensi zenye herufi Y imeandikwa kwenye mistari ya mwandiko.",
    pg072_im002: "Herufi kubwa Y iko upande wa kushoto na mifano ya herufi Y za kufuatisha kwenye mistari ya mwandiko.",
    pg072_im003: "Mifano ya majina yanayoanza kwa herufi Y imeandikwa kwenye mstari wa mwandiko.",
    pg074_im001: "Herufi kubwa R iko upande wa kushoto na mifano ya herufi R za kufuatisha kwenye mistari ya mwandiko.",
    pg074_im002: "Mifano ya majina yanayoanza kwa herufi R imeandikwa kwenye mstari wa mwandiko.",
    pg074_im003: "Mifano ya sentensi zenye herufi R imeandikwa kwenye mistari ya mwandiko.",
    pg076_im001: "Herufi kubwa W iko upande wa kushoto na mifano ya herufi W za kufuatisha kwenye mistari ya mwandiko.",
    pg076_im002: "Mifano ya majina yanayoanza kwa herufi W imeandikwa kwenye mstari wa mwandiko.",
    pg076_im003: "Mifano ya sentensi zenye herufi W imeandikwa kwenye mistari ya mwandiko.",
    pg077_im001: "Herufi kubwa V iko upande wa kushoto na mifano ya herufi V za kufuatisha kwenye mistari ya mwandiko.",
    pg085_im001: "Mchoro una mistari minne ya mwandiko wa kuunga: a, ch, d na m zikirudiwa na kuungana kutoka kushoto kwenda kulia.",
    pg086_im001: "Mchoro una mistari mitatu ya mwandiko wa kuunga yenye silabi me, ne na na zinazorudiwa.",
    pg086_im002: "Mchoro una maneno tembo, bege, ondoa, kondoo, papai na kitanda kwenye mistari ya mwandiko wa kuunga."
  };
  Object.keys(modelDescriptionMap).forEach(function (id) {
    document.querySelectorAll('[data-id="' + id + '"]').forEach(function (node) {
      const image = node.matches("img") ? node : node.querySelector("img");
      if (image) { image.alt = modelDescriptionMap[id]; image.setAttribute("data-adt-description", modelDescriptionMap[id]); }
      if (node.matches("figcaption")) node.textContent = modelDescriptionMap[id];
    });
  });
  const applyModelDescriptions = function () {
    Object.keys(modelDescriptionMap).forEach(function (id) {
      document.querySelectorAll('[data-id="' + id + '"]').forEach(function (node) {
        const image = node.matches("img") ? node : node.querySelector("img");
        if (image) { image.alt = modelDescriptionMap[id]; image.setAttribute("data-adt-description", modelDescriptionMap[id]); }
        if (node.matches("figcaption")) node.textContent = modelDescriptionMap[id];
      });
    });
  };
  requestAnimationFrame(applyModelDescriptions);
  setTimeout(applyModelDescriptions, 500);
  setTimeout(applyModelDescriptions, 1200);

  if (pageNumber === 102) {
    const describeScene = function () {
      const scene = document.querySelector(".page102-original-sheet img");
      if (!scene) return;
      scene.alt = "Mchoro unaonyesha wanaume wawili na mwanamke wakizungumza. Mwanamume aliye kushoto anauliza kwa nini hawakuonana kwenye sherehe; mwanamume aliye kulia amebeba fimbo begani na anaeleza kuwa alizuiwa na majukumu. Chini, wanaendelea kuzungumza kuhusu mambo yaliyotokea. Soma mazungumzo na tambua alama za uandishi kwenye sentensi.";
      scene.setAttribute("data-adt-description", scene.alt);
      scene.setAttribute("data-adt-audio-description-id", "pg102_original_layout_audio_description");
    };
    describeScene();
    requestAnimationFrame(describeScene);
    setTimeout(describeScene, 500);
    setTimeout(describeScene, 1200);
    const sheet = document.querySelector(".page102-original-sheet");
    if (sheet && !sheet.querySelector(".page102-audio-control")) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.preload = "metadata";
      audio.className = "page102-audio-player";
      audio.src = "./content/i18n/sw-TZ/audio/pg102_original_layout_audio_description.mp3?v=20260829-natural-dialogue-v5";
      audio.style.cssText = "display:block;width:min(100%,520px);margin:8px auto";
      const control = document.createElement("button");
      control.type = "button";
      control.className = "page102-audio-control";
      control.textContent = "Sikiliza maelezo ya picha";
      control.setAttribute("aria-label", "Sikiliza maelezo ya picha ya ukurasa 102 kwa sauti ya Rehema");
      control.style.cssText = "display:block;margin:8px auto;padding:6px 12px;border:2px solid #08a8ed;border-radius:16px;background:#fff;color:#087aa8;font-weight:700;cursor:pointer";
      control.addEventListener("click", function () {
        if (audio.paused) { audio.play().then(function () { control.textContent = "Sitisha maelezo"; }).catch(function () {}); }
        else { audio.pause(); control.textContent = "Endelea kusikiliza"; }
      });
      audio.addEventListener("ended", function () { control.textContent = "Sikiliza maelezo ya picha"; });
      sheet.insertBefore(audio, sheet.firstChild);
      sheet.insertBefore(control, audio.nextSibling);
    }
  }

  // The original page 96 sheet sits outside #content, so the normal reader
  // cannot discover its data-id values. Provide one compact, accessible
  // Rehema playlist for the complete sheet instead of adding many controls.
  if (pageNumber === 96) {
    const sheet = document.querySelector(".page96-pdf-sheet");
    if (sheet && !sheet.querySelector(".page96-audio-control")) {
      const ids = [
        "pg096_s001_n0001", "pg096_s001_n0002", "pg096_s001_n0003",
        "pg096_s001_n0004", "pg096_s002_n0001", "pg096_s002_n0002",
        "pg096_s002_n0003", "pg096_s002_n0004", "pg096_s002_n0006"
      ];
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.preload = "metadata";
      audio.className = "page96-audio-player";
      audio.style.cssText = "display:block;width:min(100%,420px);margin:0 auto 8px";
      let index = 0;
      const control = document.createElement("button");
      control.type = "button";
      control.className = "page96-audio-control";
      control.textContent = "Sikiliza ukurasa";
      control.setAttribute("aria-label", "Sikiliza maudhui yote ya ukurasa 96 kwa sauti ya Rehema");
      control.style.cssText = "display:block;margin:0 auto 8px;padding:6px 12px;border:2px solid #08a8ed;border-radius:16px;background:#fff;color:#087aa8;font-weight:700;cursor:pointer";
      const playNext = function () {
        if (index >= ids.length) { index = 0; control.textContent = "Sikiliza ukurasa"; return; }
        const id = ids[index++];
        audio.src = "./content/i18n/sw-TZ/audio/" + id + ".mp3?v=20260827-page96-playlist";
        audio.play().catch(function () { control.textContent = "Bonyeza tena kusikiliza"; });
        control.textContent = "Inasoma…";
      };
      audio.addEventListener("ended", playNext);
      control.addEventListener("click", function () {
        if (!audio.paused) { audio.pause(); control.textContent = "Endelea kusikiliza"; return; }
        if (index >= ids.length) index = 0;
        playNext();
      });
      sheet.insertBefore(audio, sheet.firstChild);
      sheet.insertBefore(control, audio.nextSibling);
    }
  }

  function promptOf(card) {
    const node = card.querySelector(".source-line.question-prompt,.source-heading.question-prompt,.question-prompt");
    return node ? node.textContent.trim().replace(/\s+/g, " ") : "";
  }

  function makeAnswerLines() {
    const answer = document.createElement("div");
    answer.className = "batch-v2-answer-lines";
    answer.setAttribute("aria-hidden", "true");
    return answer;
  }

  function makeImageModel(card, figure, sourceImage, canvas, wrap) {
    if (card.querySelector(".batch-v2-sequence")) return;
    figure.hidden = true;
    figure.style.display = "none";
    const sequence = document.createElement("div");
    sequence.className = "batch-v2-sequence";
    const originalSource = sourceImage.getAttribute("src");
    const cleanSource = originalSource.replace(/_source_model\.png(?:\?.*)?$/, "_source_model_clean.png");
    const model = sourceImage.cloneNode(false);
    model.className = "batch-v2-model-image";
    model.src = cleanSource;
    model.addEventListener("error", function () { model.src = originalSource; }, { once: true });
    model.removeAttribute("data-id");
    const answer = makeAnswerLines();
    const guide = sourceImage.cloneNode(false);
    guide.className = "batch-v2-guide-image";
    guide.src = cleanSource;
    guide.addEventListener("error", function () { guide.src = originalSource; }, { once: true });
    guide.alt = "";
    guide.removeAttribute("data-id");
    guide.setAttribute("aria-hidden", "true");
    answer.appendChild(guide);
    sequence.append(model, answer);
    wrap.className = "handwriting-canvas-wrap batch-v2-model-wrap";
    wrap.removeAttribute("style");
    wrap.replaceChildren(sequence, canvas);
  }

  function makeTextModel(card, letterModel, canvas, wrap) {
    if (card.querySelector(".batch-v2-sequence")) return;
    const values = Array.from(letterModel.querySelectorAll("span")).map(function (span) {
      return span.textContent.trim();
    }).filter(Boolean);
    if (!values.length) return;
    const sequence = document.createElement("div");
    sequence.className = "batch-v2-sequence";
    const model = document.createElement("div");
    model.className = "batch-v2-text-model batch-v2-ruled-lines";
    values.forEach(function (value) {
      const span = document.createElement("span");
      span.textContent = value;
      model.appendChild(span);
    });
    const answer = makeAnswerLines();
    const guide = document.createElement("span");
    guide.className = "batch-v2-guide-text";
    guide.textContent = values[0];
    answer.appendChild(guide);
    sequence.append(model, answer);
    wrap.className = "handwriting-canvas-wrap batch-v2-model-wrap";
    wrap.removeAttribute("style");
    wrap.replaceChildren(sequence, canvas);
  }

  function standardizeCard(card) {
    if (card.classList.contains("batch-v2-card")) return;
    card.classList.add("batch-v2-card");
    const prompt = promptOf(card);
    const canvas = card.querySelector("canvas");
    const wrap = canvas && (canvas.closest(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap") || canvas.parentElement);
    const figure = card.querySelector("figure.practice-model,figure.model-figure,figure.source-model-crop");
    const sourceImage = figure && figure.querySelector('img[src*="_source_model"]');
    const ordinaryImages = Array.from(card.querySelectorAll("figure img")).filter(function (img) {
      return !/_source_model/.test(img.getAttribute("src") || "");
    });

    card.querySelectorAll(".inclusive-instruction").forEach(function (node) {
      if (/Andika jibu kwa mkono/i.test(node.textContent)) node.hidden = true;
    });
    card.querySelectorAll(".submit-response").forEach(function (button) { button.hidden = true; });
    card.querySelectorAll(".clear-response,.drawing-clear").forEach(function (button) { button.textContent = "Futa"; });

    if (!canvas || !wrap) return;
    if (/^Fuatisha\b/i.test(prompt)) {
      card.classList.add("batch-v2-trace-card");
      wrap.classList.add("batch-v2-trace-wrap");
      return;
    }
    if (ordinaryImages.length) {
      card.classList.add("batch-v2-picture-card");
      wrap.classList.add("batch-v2-answer-only");
      return;
    }
    if (sourceImage && figure) {
      makeImageModel(card, figure, sourceImage, canvas, wrap);
      return;
    }
    const letterModel = card.querySelector(".trace-letter-model");
    if (letterModel) {
      makeTextModel(card, letterModel, canvas, wrap);
      return;
    }
    card.classList.add("batch-v2-plain-card");
    wrap.classList.add("batch-v2-answer-only");
  }

  page.querySelectorAll("[data-response-id]").forEach(standardizeCard);

  if (pageNumber === 86) {
    const wordGuide = page.querySelector('[data-response-id="pg086_sec001_response_01"] .batch-v2-guide-image');
    if (wordGuide) wordGuide.src = "images/pg086_tembo_kondoo_guides.svg?v=2";
  }

  if (pageNumber === 87) {
    const firstExercise = page.querySelector('[data-id="pg087_s001_n0001"]');
    if (firstExercise && !page.querySelector('.page87-continuation-model')) {
      const continuation = document.createElement('div');
      continuation.className = 'page87-continuation-model page87-notebook-model';
      continuation.setAttribute('aria-label', 'Maneno yanayoendelea kutoka ukurasa uliopita: lala, hema, punda');
      ['lala', 'hema', 'punda'].forEach(function (text) {
        const span = document.createElement('span');
        span.textContent = text;
        continuation.appendChild(span);
      });
      firstExercise.insertAdjacentElement('beforebegin', continuation);

      const practice = document.createElement('section');
      practice.className = 'page87-continuation-practice';
      practice.setAttribute('aria-label', 'Sehemu ya kujaribu kuandika lala, hema na punda');
      const sheet = document.createElement('div');
      sheet.className = 'page87-continuation-sheet';
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 105;
      canvas.setAttribute('aria-label', 'Andika kwa mkono kwenye mistari');
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'clear-response page87-continuation-clear';
      clear.textContent = 'Futa';
      sheet.appendChild(canvas);
      practice.append(sheet, clear);
      continuation.insertAdjacentElement('afterend', practice);

      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 4;
      context.strokeStyle = '#163f4d';
      let drawing = false;
      const storageKey = 'pg087_continuation_practice';
      const point = function (event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height
        };
      };
      canvas.addEventListener('pointerdown', function (event) {
        drawing = true;
        canvas.setPointerCapture(event.pointerId);
        const start = point(event);
        context.beginPath();
        context.moveTo(start.x, start.y);
        event.preventDefault();
      });
      canvas.addEventListener('pointermove', function (event) {
        if (!drawing) return;
        const next = point(event);
        context.lineTo(next.x, next.y);
        context.stroke();
        event.preventDefault();
      });
      const save = function () {
        drawing = false;
        try { localStorage.setItem(storageKey, canvas.toDataURL('image/png')); } catch (_) {}
      };
      canvas.addEventListener('pointerup', save);
      canvas.addEventListener('pointercancel', save);
      clear.addEventListener('click', function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
        try { localStorage.removeItem(storageKey); } catch (_) {}
      });
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const image = new Image();
          image.onload = function () { context.drawImage(image, 0, 0, canvas.width, canvas.height); };
          image.src = saved;
        }
      } catch (_) {}
    }

    const exampleLabel = page.querySelector('[data-id="pg087_s001_n0015"]');
    if (exampleLabel && !page.querySelector('.page87-example-sentence')) {
      const example = document.createElement('div');
      example.className = 'page87-example-sentence page87-notebook-model';
      example.setAttribute('aria-label', 'Mfano: kaka na dada wanasoma.');
      const sentence = document.createElement('span');
      sentence.textContent = 'kaka na dada wanasoma.';
      example.appendChild(sentence);
      exampleLabel.insertAdjacentElement('afterend', example);
    }
  }

  if (pageNumber === 42) {
    const wordCard = page.querySelector('[data-response-id="pg042_sec001_response_01"]');
    const wordGuideImage = wordCard && wordCard.querySelector(".batch-v2-guide-image");
    if (wordGuideImage && !wordCard.querySelector(".page42-word-guide")) {
      const wordGuide = document.createElement("img");
      wordGuide.className = "page42-word-guide";
      wordGuide.src = "images/pg042_raba_guide.png?v=1";
      wordGuide.alt = "";
      wordGuide.setAttribute("aria-hidden", "true");
      wordGuideImage.replaceWith(wordGuide);
    }

    const pictureCard = page.querySelector('[data-response-id="pg042_sec001_response_02"]');
    const pictureWrap = pictureCard && pictureCard.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
    const pictureCanvas = pictureWrap && pictureWrap.querySelector("canvas");
    const pictureFigures = pictureCard ? Array.from(pictureCard.querySelectorAll(":scope > figure.source-figure")) : [];
    if (pictureCard && pictureWrap && pictureCanvas && pictureFigures.length && !pictureCard.querySelector(".page42-picture-images")) {
      pictureCard.classList.add("page42-picture-exercise-panel");
      const exerciseLabel = pictureCard.previousElementSibling && pictureCard.previousElementSibling.matches(".activity-label")
        ? pictureCard.previousElementSibling
        : page.querySelector(":scope > .activity-label");
      if (exerciseLabel) {
        exerciseLabel.classList.add("page42-picture-exercise-label");
        pictureCard.insertBefore(exerciseLabel, pictureCard.firstChild);
      }

      const imageGrid = document.createElement("div");
      imageGrid.className = "page42-picture-images";
      function setupExtraPictureCanvas(canvas) {
        const context = canvas.getContext("2d");
        let drawing = false;
        let last = null;
        function point(event) {
          const rect = canvas.getBoundingClientRect();
          const source = event.touches && event.touches[0] || event;
          return {
            x: (source.clientX - rect.left) * canvas.width / rect.width,
            y: (source.clientY - rect.top) * canvas.height / rect.height
          };
        }
        function start(event) {
          drawing = true;
          last = point(event);
          event.preventDefault();
        }
        function move(event) {
          if (!drawing) return;
          const next = point(event);
          context.strokeStyle = "#153d4a";
          context.lineWidth = 4;
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(last.x, last.y);
          context.lineTo(next.x, next.y);
          context.stroke();
          last = next;
          event.preventDefault();
        }
        function stop() {
          drawing = false;
          last = null;
        }
        canvas.addEventListener("pointerdown", start, { passive: false });
        canvas.addEventListener("pointermove", move, { passive: false });
        ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
          canvas.addEventListener(name, stop);
        });
      }
      const pictureCanvases = [];
      pictureFigures.forEach(function (figure, index) {
        const item = document.createElement("div");
        item.className = "page42-picture-item";
        const box = document.createElement("span");
        box.className = "page42-picture-box";
        const boxCanvas = index === 0 ? pictureCanvas : pictureCanvas.cloneNode(false);
        boxCanvas.dataset.pictureBox = String(index + 1);
        if (index > 0) setupExtraPictureCanvas(boxCanvas);
        pictureCanvases.push(boxCanvas);
        box.appendChild(boxCanvas);
        item.append(figure, box);
        imageGrid.appendChild(item);
      });
      pictureWrap.className = "handwriting-canvas-wrap page42-picture-input-layer";
      pictureWrap.removeAttribute("style");
      pictureWrap.replaceChildren(imageGrid);
      const clearButton = pictureCard.querySelector(".clear-response,.drawing-clear");
      if (clearButton) {
        clearButton.addEventListener("click", function () {
          pictureCanvases.forEach(function (canvas) {
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          });
        });
      }
    }
  }

  if (pageNumber === 43) {
    page.classList.add("page43-complete");
    const duplicateLetter = page.querySelector('[data-id="pg043_s001_n0002"]');
    const lessonHeading = page.querySelector('[data-id="pg043_s001_n0003"]');
    const lessonIntro = page.querySelector('[data-id="pg043_s001_n0004"]');
    const splitIntro = page.querySelector('[data-id="pg043_s001_n0005"]');
    const tracePrompt = page.querySelector('[data-id="pg043_s001_n0006"]');
    const syllableGuide = page.querySelector('[data-response-id="pg043_sec001_response_02"] .batch-v2-guide-image');
    const wordGuide = page.querySelector('[data-response-id="pg043_sec001_response_04"] .batch-v2-guide-image');
    const enforcePage43Content = function () {
      if (duplicateLetter) duplicateLetter.hidden = true;
      if (lessonHeading) lessonHeading.textContent = "Kuandika herufi ya konsonanti h";
      if (lessonIntro) lessonIntro.textContent = "Katika somo hili utajifunza kuandika herufi ya konsonanti h.";
      if (splitIntro) splitIntro.hidden = true;
      if (tracePrompt) tracePrompt.textContent = "Fuatisha herufi ya konsonanti h.";
      if (syllableGuide) syllableGuide.src = "images/pg043_syllables_notebook_guide.png?v=2";
      if (wordGuide) wordGuide.src = "images/pg043_words_notebook_guide.png?v=2";
    };
    enforcePage43Content();
    requestAnimationFrame(enforcePage43Content);
    setTimeout(enforcePage43Content, 250);
    setTimeout(enforcePage43Content, 900);
  }

  if (pageNumber === 44) {
    page.classList.add("page44-complete");
    const card = page.querySelector('[data-response-id="pg044_sec001_response_01"]');
    const label = page.querySelector(":scope > .activity-label");
    const wrap = card && card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
    const originalCanvas = wrap && wrap.querySelector("canvas");
    const figures = card ? Array.from(card.querySelectorAll(":scope > figure.source-figure")) : [];
    figures.slice(0, 3).forEach(function (figure, index) {
      const image = figure.querySelector("img");
      if (image) image.src = "images/pg047_im" + String(index + 1).padStart(3, "0") + "_clean.png?v=1";
    });

    function setupPage44Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let last = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height
        };
      }
      canvas.addEventListener("pointerdown", function (event) {
        drawing = true;
        last = point(event);
        event.preventDefault();
      }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(last.x, last.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        last = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; last = null; });
      });
    }

    if (card && label) {
      label.classList.add("page44-exercise-label");
      card.insertBefore(label, card.firstChild);
    }
    ["pg044_s001_n0003", "pg044_s001_n0004", "pg044_s001_n0005", "pg044_s001_n0006", "pg044_s001_n0007"].forEach(function (id) {
      const artifact = page.querySelector('[data-id="' + id + '"]');
      if (artifact) artifact.hidden = true;
    });

    if (card && wrap && originalCanvas && figures.length === 3 && !card.querySelector(".page44-picture-panel")) {
      const panel = document.createElement("div");
      panel.className = "page44-picture-panel";
      const currencyArea = document.createElement("div");
      currencyArea.className = "page44-currency-area";
      const currencyImages = document.createElement("div");
      currencyImages.className = "page44-currency-images";
      currencyImages.append(figures[0], figures[1]);
      const currencyBox = document.createElement("div");
      currencyBox.className = "page44-handwriting-box";
      currencyBox.appendChild(originalCanvas);
      currencyArea.append(currencyImages, currencyBox);

      const divider = document.createElement("div");
      divider.className = "page44-picture-divider";
      const tentArea = document.createElement("div");
      tentArea.className = "page44-tent-area";
      const tentBox = document.createElement("div");
      tentBox.className = "page44-handwriting-box";
      const tentCanvas = originalCanvas.cloneNode(false);
      tentCanvas.dataset.practiceStorage = "pg044_sec001_response_01_tent";
      tentCanvas.setAttribute("aria-label", "Andika jina la picha ya hema kwa mkono");
      setupPage44Canvas(tentCanvas);
      tentBox.appendChild(tentCanvas);
      tentArea.append(figures[2], tentBox);
      panel.append(currencyArea, divider, tentArea);

      wrap.className = "handwriting-canvas-wrap page44-picture-inputs";
      wrap.removeAttribute("style");
      wrap.replaceChildren(panel);
      const clear = card.querySelector(".clear-response,.drawing-clear");
      if (clear) clear.addEventListener("click", function () {
        tentCanvas.getContext("2d").clearRect(0, 0, tentCanvas.width, tentCanvas.height);
      });
    }

    const enforcePage44Content = function () {
      const lessonHeading = page.querySelector('[data-id="pg044_s002_n0002"]');
      const lessonIntro = page.querySelector('[data-id="pg044_s002_n0003"]');
      const lessonIntroTail = page.querySelector('[data-id="pg044_s002_n0004"]');
      if (lessonHeading && lessonHeading.textContent !== "Kuandika herufi ya konsonanti w") {
        lessonHeading.textContent = "Kuandika herufi ya konsonanti w";
      }
      if (lessonIntro && lessonIntro.textContent !== "Katika somo hili utajifunza kuandika herufi ya konsonanti w.") {
        lessonIntro.textContent = "Katika somo hili utajifunza kuandika herufi ya konsonanti w.";
      }
      if (lessonIntroTail && !lessonIntroTail.hidden) lessonIntroTail.hidden = true;
    };
    enforcePage44Content();
    requestAnimationFrame(enforcePage44Content);
    setTimeout(enforcePage44Content, 250);
    setTimeout(enforcePage44Content, 900);
    const page44ContentObserver = new MutationObserver(enforcePage44Content);
    page44ContentObserver.observe(page, { attributes: true, childList: true, characterData: true, subtree: true });
  }

  if (pageNumber === 45) {
    page.classList.add("page45-complete");

    function buildPage45Practice(responseId, modelSrc, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page45Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;

      card.dataset.page45Ready = "true";
      card.classList.add("page45-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,.sample-model-caption,:scope > .inclusive-instruction:not(.source-line)").forEach(function (node) {
        node.hidden = true;
      });

      const model = document.createElement("div");
      model.className = "page45-model";
      const image = document.createElement("img");
      image.src = modelSrc;
      image.alt = "Mfano wa uandishi kutoka kwenye kitabu";
      model.appendChild(image);

      const answer = document.createElement("div");
      answer.className = "page45-notebook-answer";
      const guide = document.createElement("span");
      guide.className = "page45-guide";
      guide.textContent = guideText;
      guide.setAttribute("aria-hidden", "true");
      answer.append(guide, canvas);

      wrap.className = "handwriting-canvas-wrap page45-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    buildPage45Practice("pg045_sec001_response_01", "images/pg045_pattern_model.png?v=1", "w");
    buildPage45Practice("pg045_sec001_response_02", "images/pg045_letter_w_model.png?v=1", "w");
    buildPage45Practice("pg045_sec001_response_03", "images/pg045_syllables_w_model.png?v=1", "wa");
    buildPage45Practice("pg045_sec001_response_04", "images/pg045_words_w_model.png?v=1", "wewe");

    const traceCard = page.querySelector('[data-response-id="pg045_sec001_response_06"]');
    if (traceCard && traceCard.dataset.page45Ready !== "true") {
      const traceWrap = traceCard.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap");
      const traceCanvas = traceWrap && traceWrap.querySelector("canvas");
      if (traceWrap && traceCanvas) {
        traceCard.dataset.page45Ready = "true";
        traceCard.classList.add("page45-trace-card");
        traceCard.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
        const traceImage = document.createElement("img");
        traceImage.src = "images/pg045_trace_w_model.png?v=1";
        traceImage.alt = "Herufi w za kufuatisha kwenye mistari mikubwa na midogo";
        traceWrap.className = "handwriting-canvas-wrap page45-trace-wrap";
        traceWrap.removeAttribute("style");
        traceWrap.replaceChildren(traceImage, traceCanvas);
      }
    }

    const exerciseCard = page.querySelector('[data-response-id="pg045_sec001_response_05"]');
    const exerciseLabel = page.querySelector(':scope > [data-id="pg045_s001_n0006"]');
    if (exerciseCard) {
      exerciseCard.classList.add("page45-exercise-panel");
      if (exerciseLabel && !exerciseCard.contains(exerciseLabel)) {
        exerciseLabel.classList.add("page45-exercise-label");
        exerciseCard.insertBefore(exerciseLabel, exerciseCard.firstChild);
      }
      const exercisePrompt = exerciseCard.querySelector('[data-id="pg045_s001_n0007"]');
      const exerciseTail = exerciseCard.querySelector('[data-id="pg045_s001_n0008"]');
      if (exercisePrompt) exercisePrompt.textContent = "Andika maneno matano yenye herufi ya konsonanti w katika daftari.";
      if (exerciseTail) exerciseTail.hidden = true;
      const exerciseHint = exerciseCard.querySelector(":scope > .inclusive-instruction:not(.source-line)");
      if (exerciseHint) exerciseHint.hidden = true;
      const exerciseWrap = exerciseCard.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      if (exerciseWrap) {
        exerciseWrap.className = "handwriting-canvas-wrap page45-exercise-answer";
        exerciseWrap.removeAttribute("style");
      }
    }

    const enforcePage45Content = function () {
      const tracePrompt = page.querySelector('[data-id="pg045_s001_n0002"]');
      if (tracePrompt && tracePrompt.textContent !== "Fuatisha herufi ya konsonanti w.") {
        tracePrompt.textContent = "Fuatisha herufi ya konsonanti w.";
      }
      const letterPrompt = page.querySelector('[data-id="pg045_s001_n0003"]');
      if (letterPrompt && letterPrompt.textContent !== "Andika herufi ya konsonanti hii kwenye daftari.") {
        letterPrompt.textContent = "Andika herufi ya konsonanti hii kwenye daftari.";
      }
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
      const exercisePrompt = page.querySelector('[data-id="pg045_s001_n0007"]');
      const exerciseTail = page.querySelector('[data-id="pg045_s001_n0008"]');
      if (exercisePrompt && exercisePrompt.textContent !== "Andika maneno matano yenye herufi ya konsonanti w katika daftari.") {
        exercisePrompt.textContent = "Andika maneno matano yenye herufi ya konsonanti w katika daftari.";
      }
      if (exerciseTail && !exerciseTail.hidden) exerciseTail.hidden = true;
    };
    enforcePage45Content();
    requestAnimationFrame(enforcePage45Content);
    setTimeout(enforcePage45Content, 300);
    setTimeout(enforcePage45Content, 900);
    const page45ContentObserver = new MutationObserver(enforcePage45Content);
    page45ContentObserver.observe(page, { attributes: true, childList: true, characterData: true, subtree: true });
  }

  if (pageNumber === 46) {
    // Page 46 uses the same proven notebook geometry as page 45.
    page.classList.add("page46-complete", "batch-v2-page-45");

    function buildPage46Practice(responseId, modelSrc, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page46Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;

      card.dataset.page46Ready = "true";
      card.classList.add("page45-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,.sample-model-caption,:scope > .inclusive-instruction:not(.source-line)").forEach(function (node) {
        node.hidden = true;
      });

      const model = document.createElement("div");
      model.className = "page45-model";
      const image = document.createElement("img");
      image.src = modelSrc;
      image.alt = "Mfano wa uandishi kutoka kwenye kitabu";
      model.appendChild(image);

      const answer = document.createElement("div");
      answer.className = "page45-notebook-answer";
      const guide = document.createElement("span");
      guide.className = "page45-guide";
      guide.textContent = guideText;
      guide.setAttribute("aria-hidden", "true");
      answer.append(guide, canvas);

      wrap.className = "handwriting-canvas-wrap page45-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    buildPage46Practice("pg046_sec001_response_01", "images/pg046_pattern_model.png?v=1", "v");
    buildPage46Practice("pg046_sec001_response_02", "images/pg046_letter_v_model.png?v=1", "v");
    buildPage46Practice("pg046_sec001_response_03", "images/pg046_syllables_v_model.png?v=1", "va");
    buildPage46Practice("pg046_sec001_response_04", "images/pg046_words_v_model.png?v=1", "vaa");

    const traceCard = page.querySelector('[data-response-id="pg046_sec001_response_05"]');
    if (traceCard && traceCard.dataset.page46Ready !== "true") {
      const traceWrap = traceCard.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap");
      const traceCanvas = traceWrap && traceWrap.querySelector("canvas");
      if (traceWrap && traceCanvas) {
        traceCard.dataset.page46Ready = "true";
        traceCard.classList.add("page45-trace-card");
        traceCard.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
        const traceImage = document.createElement("img");
        traceImage.src = "images/pg046_trace_v_model.png?v=1";
        traceImage.alt = "Herufi v za kufuatisha kwenye mistari mikubwa na midogo";
        traceWrap.className = "handwriting-canvas-wrap page45-trace-wrap";
        traceWrap.removeAttribute("style");
        traceWrap.replaceChildren(traceImage, traceCanvas);
      }
    }

    const enforcePage46Content = function () {
      const heading = page.querySelector('[data-id="pg046_s001_n0002"]');
      const intro = page.querySelector('[data-id="pg046_s001_n0003"]');
      const introTail = page.querySelector('[data-id="pg046_s001_n0004"]');
      const tracePrompt = page.querySelector('[data-id="pg046_s001_n0006"]');
      if (heading && heading.textContent !== "Kuandika herufi ya konsonanti v") heading.textContent = "Kuandika herufi ya konsonanti v";
      if (intro && intro.textContent !== "Katika somo hili utajifunza kuandika herufi ya konsonanti v.") {
        intro.textContent = "Katika somo hili utajifunza kuandika herufi ya konsonanti v.";
      }
      if (introTail && !introTail.hidden) introTail.hidden = true;
      if (tracePrompt && tracePrompt.textContent !== "Fuatisha herufi ya konsonanti v.") tracePrompt.textContent = "Fuatisha herufi ya konsonanti v.";
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage46Content();
    requestAnimationFrame(enforcePage46Content);
    setTimeout(enforcePage46Content, 300);
    setTimeout(enforcePage46Content, 900);
    const page46ContentObserver = new MutationObserver(enforcePage46Content);
    page46ContentObserver.observe(page, { attributes: true, childList: true, characterData: true, subtree: true });
  }

  if (pageNumber === 47) {
    page.classList.add("page47-complete");
    const card = page.querySelector('[data-response-id="pg047_sec001_response_01"]');
    const label = page.querySelector(':scope > [data-id="pg047_s001_n0001"]');
    const wrap = card && card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
    const originalCanvas = wrap && wrap.querySelector("canvas");
    const figures = card ? Array.from(card.querySelectorAll(":scope > figure.source-figure")) : [];

    function setupPage47Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let last = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height
        };
      }
      canvas.addEventListener("pointerdown", function (event) {
        drawing = true;
        last = point(event);
        event.preventDefault();
      }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(last.x, last.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        last = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; last = null; });
      });
    }

    if (card && label && !card.contains(label)) {
      label.classList.add("page47-exercise-label");
      card.insertBefore(label, card.firstChild);
    }

    if (card && wrap && originalCanvas && figures.length === 5 && !card.querySelector(".page47-picture-panel")) {
      card.classList.add("page47-exercise-panel");
      const hint = card.querySelector(":scope > .inclusive-instruction:not(.source-line)");
      if (hint) hint.hidden = true;

      const panel = document.createElement("div");
      panel.className = "page47-picture-panel";
      const canvases = [];

      function makeBox(canvas, storageKey, labelText) {
        canvas.dataset.practiceStorage = storageKey;
        canvas.setAttribute("aria-label", labelText);
        const box = document.createElement("div");
        box.className = "page47-handwriting-box";
        box.appendChild(canvas);
        canvases.push(canvas);
        return box;
      }

      const chairRow = document.createElement("div");
      chairRow.className = "page47-picture-row page47-chair-row";
      const chairImages = document.createElement("div");
      chairImages.className = "page47-chair-images";
      figures.slice(0, 3).forEach(function (figure) { figure.remove(); });
      const chairGroupFigure = document.createElement("figure");
      chairGroupFigure.className = "source-figure page47-clean-chair-group";
      const chairGroupImage = document.createElement("img");
      chairGroupImage.src = "images/pg047_chairs_group_clean.png?v=2";
      chairGroupImage.alt = "Viti vitatu vya mbao";
      chairGroupFigure.appendChild(chairGroupImage);
      chairImages.appendChild(chairGroupFigure);
      chairRow.append(chairImages, makeBox(originalCanvas, "pg047_sec001_response_01_chairs", "Andika jina la viti kwa mkono"));

      const potatoCanvas = originalCanvas.cloneNode(false);
      setupPage47Canvas(potatoCanvas);
      const potatoRow = document.createElement("div");
      potatoRow.className = "page47-picture-row";
      potatoRow.append(figures[3], makeBox(potatoCanvas, "pg047_sec001_response_01_potatoes", "Andika jina la viazi kwa mkono"));

      const spoonCanvas = originalCanvas.cloneNode(false);
      setupPage47Canvas(spoonCanvas);
      const spoonRow = document.createElement("div");
      spoonRow.className = "page47-picture-row";
      spoonRow.append(figures[4], makeBox(spoonCanvas, "pg047_sec001_response_01_spoons", "Andika jina la vijiko kwa mkono"));

      panel.append(chairRow, potatoRow, spoonRow);
      wrap.className = "handwriting-canvas-wrap page47-picture-inputs";
      wrap.removeAttribute("style");
      wrap.replaceChildren(panel);

      const clear = card.querySelector(".clear-response,.drawing-clear");
      if (clear) clear.addEventListener("click", function () {
        canvases.forEach(function (canvas) {
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        });
      });
    }

    const printedPage = page.querySelector(".printed-page-number");
    if (printedPage) printedPage.hidden = true;
  }

  if (pageNumber === 48) {
    page.classList.add("page48-complete", "batch-v2-page-45");

    function buildPage48Practice(responseId, modelSrc, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page48Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;

      card.dataset.page48Ready = "true";
      card.classList.add("page45-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,.sample-model-caption,:scope > .handwriting-model,:scope > .inclusive-instruction:not(.source-line)").forEach(function (node) {
        node.hidden = true;
      });

      const model = document.createElement("div");
      model.className = "page45-model";
      const image = document.createElement("img");
      image.src = modelSrc;
      image.alt = "Mfano wa uandishi kutoka kwenye kitabu";
      model.appendChild(image);

      const answer = document.createElement("div");
      answer.className = "page45-notebook-answer";
      const guide = document.createElement("span");
      guide.className = "page45-guide";
      guide.textContent = guideText;
      guide.setAttribute("aria-hidden", "true");
      answer.append(guide, canvas);

      wrap.className = "handwriting-canvas-wrap page45-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    buildPage48Practice("pg048_sec001_response_01", "images/pg048_letter_ch_model.png?v=1", "ch");
    buildPage48Practice("pg048_sec001_response_02", "images/pg048_syllables_ch_model.png?v=1", "cha");
    buildPage48Practice("pg048_sec001_response_03", "images/pg048_words_ch_model.png?v=1", "chai");

    const traceCard = page.querySelector('[data-response-id="pg048_sec001_response_04"]');
    if (traceCard && traceCard.dataset.page48Ready !== "true") {
      const traceWrap = traceCard.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap");
      const traceCanvas = traceWrap && traceWrap.querySelector("canvas");
      if (traceWrap && traceCanvas) {
        traceCard.dataset.page48Ready = "true";
        traceCard.classList.add("page45-trace-card");
        traceCard.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
        const traceImage = document.createElement("img");
        traceImage.src = "images/pg048_trace_ch_model.png?v=1";
        traceImage.alt = "Konsonanti ch za kufuatisha kwenye mistari mikubwa na midogo";
        traceWrap.className = "handwriting-canvas-wrap page45-trace-wrap";
        traceWrap.removeAttribute("style");
        traceWrap.replaceChildren(traceImage, traceCanvas);
      }
    }

    const enforcePage48Content = function () {
      const heading = page.querySelector('[data-id="pg048_s001_n0002"]');
      const intro = page.querySelector('[data-id="pg048_s001_n0003"]');
      const introTail = page.querySelector('[data-id="pg048_s001_n0004"]');
      const tracePrompt = page.querySelector('[data-id="pg048_s001_n0005"]');
      if (heading && heading.textContent !== "Kuandika herufi ya konsonanti ch") heading.textContent = "Kuandika herufi ya konsonanti ch";
      if (intro && intro.textContent !== "Katika somo hili utajifunza kuandika herufi ya konsonanti ch.") {
        intro.textContent = "Katika somo hili utajifunza kuandika herufi ya konsonanti ch.";
      }
      if (introTail && !introTail.hidden) introTail.hidden = true;
      if (tracePrompt && tracePrompt.textContent !== "Fuatisha herufi ya konsonanti ch.") tracePrompt.textContent = "Fuatisha herufi ya konsonanti ch.";
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage48Content();
    requestAnimationFrame(enforcePage48Content);
    setTimeout(enforcePage48Content, 300);
    setTimeout(enforcePage48Content, 900);
    const page48ContentObserver = new MutationObserver(enforcePage48Content);
    page48ContentObserver.observe(page, { attributes: true, childList: true, characterData: true, subtree: true });
  }

  if (pageNumber === 49) {
    page.classList.add("page49-complete", "batch-v2-page-47");
    const card = page.querySelector('[data-response-id="pg049_sec001_response_01"]');
    const label = page.querySelector(':scope > [data-id="pg049_s001_n0001"]');
    const wrap = card && card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
    const originalCanvas = wrap && wrap.querySelector("canvas");
    const figures = card ? Array.from(card.querySelectorAll(":scope > figure.source-figure")) : [];

    function setupPage49Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let last = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height
        };
      }
      canvas.addEventListener("pointerdown", function (event) {
        drawing = true;
        last = point(event);
        event.preventDefault();
      }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(last.x, last.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        last = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; last = null; });
      });
    }

    if (card && label && !card.contains(label)) {
      label.classList.add("page47-exercise-label");
      card.insertBefore(label, card.firstChild);
    }

    if (card && wrap && originalCanvas && figures.length === 3 && !card.querySelector(".page49-picture-panel")) {
      card.classList.add("page47-exercise-panel", "page49-exercise-panel");
      const hint = card.querySelector(":scope > .inclusive-instruction:not(.source-line)");
      if (hint) hint.hidden = true;
      const panel = document.createElement("div");
      panel.className = "page47-picture-panel page49-picture-panel";
      const canvases = [];

      figures.forEach(function (figure, index) {
        const row = document.createElement("div");
        row.className = "page47-picture-row page49-picture-row";
        const canvas = index === 0 ? originalCanvas : originalCanvas.cloneNode(false);
        if (index > 0) setupPage49Canvas(canvas);
        canvas.dataset.practiceStorage = "pg049_sec001_response_01_" + String(index + 1);
        canvas.setAttribute("aria-label", ["Andika jina la chui kwa mkono", "Andika jina la chura kwa mkono", "Andika jina la chupa kwa mkono"][index]);
        const box = document.createElement("div");
        box.className = "page47-handwriting-box";
        box.appendChild(canvas);
        canvases.push(canvas);
        row.append(figure, box);
        panel.appendChild(row);
      });

      wrap.className = "handwriting-canvas-wrap page47-picture-inputs";
      wrap.removeAttribute("style");
      wrap.replaceChildren(panel);
      const clear = card.querySelector(".clear-response,.drawing-clear");
      if (clear) clear.addEventListener("click", function () {
        canvases.forEach(function (canvas) {
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        });
      });
    }

    const printedPage = page.querySelector(".printed-page-number");
    if (printedPage) printedPage.hidden = true;
  }

  if (pageNumber === 50) {
    page.classList.add("page50-complete");
    const label = page.querySelector(':scope > [data-id="pg050_s001_n0001"]');
    const panel = page.querySelector('[data-response-id="pg050_sec001_response_01"]');
    const instruction = panel && panel.querySelector('[data-id="pg050_s001_n0002"]');
    const instructionTail = panel && panel.querySelector('[data-id="pg050_s001_n0003"]');
    const fruitHeading = page.querySelector(':scope > [data-id="pg050_s001_n0004"]');
    const fruitFigure = page.querySelector(':scope > figure:has([data-id="pg050_im001"])');
    const nameCard = page.querySelector(':scope > [data-response-id="pg050_sec001_response_02"]');
    const drawCard = page.querySelector(':scope > [data-response-id="pg050_sec001_response_03"]');
    const letterCard = page.querySelector(':scope > [data-response-id="pg050_sec001_response_04"]');
    const animalHeading = page.querySelector(':scope > [data-id="pg050_s001_n0008"]');
    const animalFigure = page.querySelector(':scope > figure:has([data-id="pg050_im002"])');

    if (panel) {
      panel.classList.add("page50-exercise-panel");
      if (label && !panel.contains(label)) {
        label.classList.add("page50-exercise-label");
        panel.insertBefore(label, panel.firstChild);
      }
      if (instruction) instruction.textContent = "Tazama na chunguza picha hizi kisha jibu maswali yanayofuata kwa kila picha.";
      if (instructionTail) instructionTail.hidden = true;
      panel.querySelectorAll(":scope > .inclusive-instruction:not(.source-line),:scope > .handwriting-canvas-wrap,:scope > .canvas-wrap,:scope > .response-actions,:scope > .response-feedback").forEach(function (node) {
        node.hidden = true;
      });
      [fruitHeading, fruitFigure, nameCard, drawCard, letterCard, animalHeading, animalFigure].forEach(function (node) {
        if (node) panel.appendChild(node);
      });
    }

    if (fruitHeading) fruitHeading.classList.add("page50-subheading");
    if (animalHeading) animalHeading.classList.add("page50-subheading");
    if (fruitFigure) fruitFigure.classList.add("page50-main-figure", "page50-fruit-figure");
    if (animalFigure) animalFigure.classList.add("page50-main-figure", "page50-animal-figure");

    function preparePage50Card(card, answerClass) {
      if (!card) return;
      card.classList.add("page50-question-card");
      card.querySelectorAll(":scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption,:scope > .handwriting-model,:scope > figure.source-figure").forEach(function (node) {
        node.hidden = true;
      });
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (wrap && canvas) {
        wrap.className = "handwriting-canvas-wrap " + answerClass;
        wrap.removeAttribute("style");
        wrap.replaceChildren(canvas);
      }
    }

    preparePage50Card(nameCard, "page50-writing-answer page50-name-answer");
    preparePage50Card(drawCard, "page50-drawing-board");
    preparePage50Card(letterCard, "page50-writing-answer page50-letter-answer");

    const enforcePage50Content = function () {
      const liveInstruction = page.querySelector('[data-id="pg050_s001_n0002"]');
      const liveTail = page.querySelector('[data-id="pg050_s001_n0003"]');
      if (liveInstruction && liveInstruction.textContent !== "Tazama na chunguza picha hizi kisha jibu maswali yanayofuata kwa kila picha.") {
        liveInstruction.textContent = "Tazama na chunguza picha hizi kisha jibu maswali yanayofuata kwa kila picha.";
      }
      if (liveTail && !liveTail.hidden) liveTail.hidden = true;
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage50Content();
    requestAnimationFrame(enforcePage50Content);
    setTimeout(enforcePage50Content, 300);
    setTimeout(enforcePage50Content, 900);
    const page50ContentObserver = new MutationObserver(enforcePage50Content);
    page50ContentObserver.observe(page, { attributes: true, childList: true, characterData: true, subtree: true });
  }

  if (pageNumber === 51) {
    page.classList.add("page51-complete");
    const animalQ1 = page.querySelector(':scope > [data-id="pg051_s001_n0001"]');
    const animalQ1Tail = page.querySelector(':scope > [data-id="pg051_s001_n0002"]');
    const animalQ2 = page.querySelector(':scope > [data-response-id="pg051_sec001_response_01"]');
    const animalQ3 = page.querySelector(':scope > [data-response-id="pg051_sec001_response_02"]');
    const householdHeading = page.querySelector(':scope > [data-id="pg051_s001_n0006"]');
    const householdFigures = Array.from(page.querySelectorAll(':scope > figure:has([data-id^="pg051_im"])'));
    const householdQ1 = page.querySelector(':scope > [data-response-id="pg051_sec001_response_03"]');
    const householdQ2 = page.querySelector(':scope > [data-response-id="pg051_sec001_response_04"]');
    const householdQ3 = page.querySelector(':scope > [data-response-id="pg051_sec001_response_05"]');
    const exerciseLabel = page.querySelector(':scope > [data-id="pg051_s001_n0010"]');
    const exerciseQ1 = page.querySelector(':scope > [data-response-id="pg051_sec001_response_06"]');
    const exerciseQ2 = page.querySelector(':scope > [data-response-id="pg051_sec001_response_07"]');

    function setupPage51Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let last = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height
        };
      }
      canvas.addEventListener("pointerdown", function (event) {
        drawing = true;
        last = point(event);
        event.preventDefault();
      }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(last.x, last.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        last = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; last = null; });
      });
    }

    function preparePage51Card(card, extraClass) {
      if (!card) return;
      card.classList.add("page51-question-card");
      card.querySelectorAll(":scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption,:scope > .handwriting-model,:scope > figure.source-figure").forEach(function (node) {
        node.hidden = true;
      });
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (wrap && canvas) {
        wrap.className = "handwriting-canvas-wrap page51-writing-answer " + (extraClass || "");
        wrap.removeAttribute("style");
        wrap.replaceChildren(canvas);
      }
    }

    preparePage51Card(animalQ2, "");
    preparePage51Card(animalQ3, "");
    preparePage51Card(householdQ1, "page51-multi-answer");
    preparePage51Card(householdQ2, "");
    preparePage51Card(householdQ3, "page51-two-line-answer");
    preparePage51Card(exerciseQ1, "");
    preparePage51Card(exerciseQ2, "");

    const baseCanvas = animalQ2 && animalQ2.querySelector("canvas");
    const mainPanel = document.createElement("section");
    mainPanel.className = "page51-main-panel";
    if (animalQ1) page.insertBefore(mainPanel, animalQ1);

    if (animalQ1 && baseCanvas) {
      const q1Card = document.createElement("section");
      q1Card.className = "page51-question-card page51-manual-question";
      animalQ1.textContent = "1. Taja majina ya wanyama unaowaona katika picha hiyo.";
      animalQ1.classList.add("question-prompt");
      if (animalQ1Tail) animalQ1Tail.hidden = true;
      const q1Wrap = document.createElement("div");
      q1Wrap.className = "handwriting-canvas-wrap page51-writing-answer page51-multi-answer";
      const q1Canvas = baseCanvas.cloneNode(false);
      q1Canvas.dataset.practiceStorage = "pg051_sec001_animal_q1";
      q1Canvas.setAttribute("aria-label", "Andika majina ya wanyama kwa mkono");
      setupPage51Canvas(q1Canvas);
      q1Wrap.appendChild(q1Canvas);
      const actions = document.createElement("div");
      actions.className = "response-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () {
        q1Canvas.getContext("2d").clearRect(0, 0, q1Canvas.width, q1Canvas.height);
      });
      actions.appendChild(clear);
      q1Card.append(animalQ1, q1Wrap, actions);
      mainPanel.appendChild(q1Card);
    }

    [animalQ2, animalQ3].forEach(function (node) { if (node) mainPanel.appendChild(node); });
    if (householdHeading) {
      householdHeading.classList.add("page51-subheading");
      mainPanel.appendChild(householdHeading);
    }
    householdFigures.forEach(function (figure) { figure.remove(); });
    const householdGroup = document.createElement("figure");
    householdGroup.className = "page51-household-figure";
    const householdImage = document.createElement("img");
    householdImage.src = "images/pg051_household_group.png?v=1";
    householdImage.alt = "Vifaa vya nyumbani: meza, viti, bakuli, sahani na kijiko";
    householdGroup.appendChild(householdImage);
    mainPanel.appendChild(householdGroup);
    [householdQ1, householdQ2, householdQ3].forEach(function (node) { if (node) mainPanel.appendChild(node); });

    if (householdQ3) {
      const wrap = householdQ3.querySelector(".page51-two-line-answer");
      const canvas = wrap && wrap.querySelector("canvas");
      if (wrap && canvas) {
        const mGuide = document.createElement("span");
        mGuide.className = "page51-row-guide page51-m-guide";
        mGuide.textContent = "m";
        const kGuide = document.createElement("span");
        kGuide.className = "page51-row-guide page51-k-guide";
        kGuide.textContent = "k";
        wrap.replaceChildren(mGuide, kGuide, canvas);
      }
    }

    if (exerciseLabel && exerciseQ1 && exerciseQ2) {
      const exercisePanel = document.createElement("section");
      exercisePanel.className = "page51-exercise11-panel";
      page.insertBefore(exercisePanel, exerciseLabel);
      exerciseLabel.classList.add("page51-exercise11-label");
      exercisePanel.append(exerciseLabel, exerciseQ1, exerciseQ2);
    }

    const enforcePage51Content = function () {
      const q1 = page.querySelector('[data-id="pg051_s001_n0001"]');
      const q1Tail = page.querySelector('[data-id="pg051_s001_n0002"]');
      const q3 = page.querySelector('[data-id="pg051_s001_n0004"]');
      const q3Tail = page.querySelector('[data-id="pg051_s001_n0005"]');
      const homeQ3 = page.querySelector('[data-id="pg051_s001_n0009"]');
      const exQ1 = page.querySelector('[data-id="pg051_s001_n0011"]');
      const exQ1Tail = page.querySelector('[data-id="pg051_s001_n0012"]');
      const exQ2 = page.querySelector('[data-id="pg051_s001_n0013"]');
      const exQ2Tail = page.querySelector('[data-id="pg051_s001_n0014"]');
      if (q1 && q1.textContent !== "1. Taja majina ya wanyama unaowaona katika picha hiyo.") q1.textContent = "1. Taja majina ya wanyama unaowaona katika picha hiyo.";
      if (q1Tail && !q1Tail.hidden) q1Tail.hidden = true;
      if (q3 && q3.textContent !== "3. Andika herufi ya mwanzo ya kila mnyama unayemwona.") q3.textContent = "3. Andika herufi ya mwanzo ya kila mnyama unayemwona.";
      if (q3Tail && !q3Tail.hidden) q3Tail.hidden = true;
      if (homeQ3 && homeQ3.textContent !== "3. Andika mistari miwili ya herufi m na k.") homeQ3.textContent = "3. Andika mistari miwili ya herufi m na k.";
      if (exQ1 && exQ1.textContent !== "1. Andika herufi za mwanzo za majina ya vyakula unavyovipenda.") exQ1.textContent = "1. Andika herufi za mwanzo za majina ya vyakula unavyovipenda.";
      if (exQ1Tail && !exQ1Tail.hidden) exQ1Tail.hidden = true;
      if (exQ2 && exQ2.textContent !== "2. Andika herufi za mwanzo za majina ya rangi unazozijua.") exQ2.textContent = "2. Andika herufi za mwanzo za majina ya rangi unazozijua.";
      if (exQ2Tail && !exQ2Tail.hidden) exQ2Tail.hidden = true;
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage51Content();
    requestAnimationFrame(enforcePage51Content);
    setTimeout(enforcePage51Content, 300);
    setTimeout(enforcePage51Content, 900);
    const page51ContentObserver = new MutationObserver(enforcePage51Content);
    page51ContentObserver.observe(page, { attributes: true, childList: true, characterData: true, subtree: true });
  }

  if (pageNumber === 52) {
    page.classList.add("page52-complete");
    const unitImage = page.querySelector('.original-unit-header[src*="original-unit-pg052"]');
    if (unitImage) {
      unitImage.src = "images/semantic/pg052-chapter-header.png?v=1";
      unitImage.alt = "Sura ya Sita: Kuandika herufi kubwa za irabu A, E, I, O na U";
    }

    function buildPage52Practice(responseId, modelSource, guides, multiLine) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page52Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;

      card.dataset.page52Ready = "true";
      card.classList.add("page52-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,:scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption").forEach(function (node) {
        node.hidden = true;
      });

      const model = document.createElement("div");
      model.className = "page52-model";
      if (modelSource) {
        const image = document.createElement("img");
        image.src = modelSource;
        image.alt = "Mfano halisi wa uandishi kutoka kwenye kitabu";
        model.appendChild(image);
      } else {
        model.classList.add("page52-letter-model");
        ["A", "A", "A", "A", "A"].forEach(function (letter) {
          const span = document.createElement("span");
          span.textContent = letter;
          model.appendChild(span);
        });
      }

      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer" + (multiLine ? " page52-multi-answer" : "");
      guides.forEach(function (text, index) {
        const guide = document.createElement("span");
        guide.className = "page52-answer-guide page52-answer-guide-" + (index + 1);
        guide.textContent = text;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      });
      answer.appendChild(canvas);

      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    function buildPage52Trace() {
      const card = page.querySelector('[data-response-id="pg052_sec002_response_04"]');
      if (!card || card.dataset.page52Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.dataset.page52Ready = "true";
      card.classList.add("page52-trace-card");
      card.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      const image = document.createElement("img");
      image.src = "images/pg052_im001_source_model_clean.png?v=1";
      image.alt = "Herufi kubwa A za kufuatisha kwenye mistari mikubwa na midogo";
      wrap.className = "handwriting-canvas-wrap page52-trace-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(image, canvas);
    }

    buildPage52Trace();
    buildPage52Practice("pg052_sec002_response_01", "", ["A"], false);
    buildPage52Practice("pg052_sec002_response_02", "images/pg052_im002_source_model_clean.png?v=1", ["Amina"], false);
    buildPage52Practice("pg052_sec002_response_03", "images/pg052_im003_source_model_clean.png?v=1", [], false);

    function setupPage52Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function getPoint(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height
        };
      }
      canvas.addEventListener("pointerdown", function (event) {
        drawing = true;
        lastPoint = getPoint(event);
        event.preventDefault();
      }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const point = getPoint(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(point.x, point.y);
        context.stroke();
        lastPoint = point;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () {
          drawing = false;
          lastPoint = null;
        });
      });
    }

    function splitPage52SentenceAnswers() {
      const card = page.querySelector('[data-response-id="pg052_sec002_response_03"]');
      const wrap = card && card.querySelector(".page52-practice-wrap");
      const model = wrap && wrap.querySelector(".page52-model");
      const firstAnswer = wrap && wrap.querySelector(".page52-notebook-answer");
      const firstCanvas = firstAnswer && firstAnswer.querySelector("canvas");
      const firstActions = card && card.querySelector(":scope > .response-actions");
      if (!card || !wrap || !model || !firstAnswer || !firstCanvas || !firstActions) return;

      firstAnswer.querySelectorAll(".page52-answer-guide").forEach(function (node) { node.remove(); });
      firstAnswer.classList.add("page52-sentence-answer");
      firstCanvas.dataset.practiceStorage = "pg052_sec002_response_03_sentence_1";
      firstActions.classList.add("page52-sentence-actions");
      firstActions.querySelectorAll(".submit-response").forEach(function (node) { node.hidden = true; });

      const secondAnswer = document.createElement("div");
      secondAnswer.className = "page52-notebook-answer page52-sentence-answer";
      const secondCanvas = firstCanvas.cloneNode(false);
      secondCanvas.dataset.practiceStorage = "pg052_sec002_response_03_sentence_2";
      secondCanvas.setAttribute("aria-label", "Andika sentensi ya pili kwa mkono");
      setupPage52Canvas(secondCanvas);
      secondAnswer.appendChild(secondCanvas);

      const secondActions = document.createElement("div");
      secondActions.className = "response-actions page52-sentence-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () {
        secondCanvas.getContext("2d").clearRect(0, 0, secondCanvas.width, secondCanvas.height);
      });
      secondActions.appendChild(clear);

      wrap.classList.add("page52-sentence-fields");
      wrap.replaceChildren(model, firstAnswer, firstActions, secondAnswer, secondActions);
    }

    splitPage52SentenceAnswers();

    const enforcePage52Content = function () {
      const lessonTitle = page.querySelector('[data-id="pg052_s002_n0002"]');
      if (lessonTitle && lessonTitle.textContent.trim() !== "Kuandika herufi ya irabu A") {
        lessonTitle.textContent = "Kuandika herufi ya irabu A";
      }

      const intro = page.querySelector('[data-id="pg052_s001_n0003"]');
      if (intro && intro.textContent.trim() !== "Katika sura hii utajifunza kuandika herufi kubwa za") {
        intro.textContent = "Katika sura hii utajifunza kuandika herufi kubwa za";
      }
      if (intro) intro.classList.add("page52-semantic-only");

      const vowelText = page.querySelector('[data-id="pg052_s001_n0004"]');
      if (vowelText) {
        if (vowelText.textContent.trim() !== "irabu A E I O U") vowelText.textContent = "irabu A E I O U";
        vowelText.classList.add("page52-semantic-only");
      }
      page.querySelectorAll(".page52-vowel-row").forEach(function (node) { node.remove(); });

      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) {
        if (!node.hidden) node.hidden = true;
      });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };

    enforcePage52Content();
    requestAnimationFrame(enforcePage52Content);
    setTimeout(enforcePage52Content, 300);
    setTimeout(enforcePage52Content, 900);
  }

  if (pageNumber === 53) {
    // Page 53 follows the approved page 52 handwriting geometry.
    page.classList.add("page53-complete", "page52-complete", "batch-v2-page-52");

    function buildPage53Practice(responseId, modelSource, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page53Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;

      card.dataset.page53Ready = "true";
      card.classList.add("page52-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,:scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption").forEach(function (node) {
        node.hidden = true;
      });

      const model = document.createElement("div");
      model.className = "page52-model";
      if (modelSource) {
        const image = document.createElement("img");
        image.src = modelSource;
        image.alt = "Mfano halisi wa uandishi kutoka kwenye kitabu";
        model.appendChild(image);
      } else {
        model.classList.add("page52-letter-model");
        ["E", "E", "E", "E", "E"].forEach(function (letter) {
          const span = document.createElement("span");
          span.textContent = letter;
          model.appendChild(span);
        });
      }

      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer";
      if (guideText) {
        const guide = document.createElement("span");
        guide.className = "page52-answer-guide page52-answer-guide-1";
        guide.textContent = guideText;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      }
      answer.appendChild(canvas);
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    function buildPage53Trace() {
      const card = page.querySelector('[data-response-id="pg053_sec001_response_04"]');
      if (!card || card.dataset.page53Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.dataset.page53Ready = "true";
      card.classList.add("page52-trace-card");
      card.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      const image = document.createElement("img");
      image.src = "images/pg053_im001_source_model_clean.png?v=1";
      image.alt = "Herufi kubwa E za kufuatisha kwenye mistari mikubwa na midogo";
      wrap.className = "handwriting-canvas-wrap page52-trace-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(image, canvas);
    }

    function setupPage53Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function getPoint(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height
        };
      }
      canvas.addEventListener("pointerdown", function (event) {
        drawing = true;
        lastPoint = getPoint(event);
        event.preventDefault();
      }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const point = getPoint(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(point.x, point.y);
        context.stroke();
        lastPoint = point;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    buildPage53Trace();
    buildPage53Practice("pg053_sec001_response_01", "", "E");
    buildPage53Practice("pg053_sec001_response_02", "images/pg053_im002_source_model_clean.png?v=1", "Edina");
    buildPage53Practice("pg053_sec001_response_03", "images/pg053_im003_source_model_compact.png?v=1", "");

    const sentenceCard = page.querySelector('[data-response-id="pg053_sec001_response_03"]');
    const sentenceWrap = sentenceCard && sentenceCard.querySelector(".page52-practice-wrap");
    const sentenceModel = sentenceWrap && sentenceWrap.querySelector(".page52-model");
    const firstAnswer = sentenceWrap && sentenceWrap.querySelector(".page52-notebook-answer");
    const firstCanvas = firstAnswer && firstAnswer.querySelector("canvas");
    const firstActions = sentenceCard && sentenceCard.querySelector(":scope > .response-actions");
    if (sentenceCard && sentenceWrap && sentenceModel && firstAnswer && firstCanvas && firstActions) {
      firstAnswer.classList.add("page52-sentence-answer");
      firstCanvas.dataset.practiceStorage = "pg053_sec001_response_03_sentence_1";
      firstActions.classList.add("page52-sentence-actions");
      firstActions.querySelectorAll(".submit-response").forEach(function (node) { node.hidden = true; });

      const secondAnswer = document.createElement("div");
      secondAnswer.className = "page52-notebook-answer page52-sentence-answer";
      const secondCanvas = firstCanvas.cloneNode(false);
      secondCanvas.dataset.practiceStorage = "pg053_sec001_response_03_sentence_2";
      secondCanvas.setAttribute("aria-label", "Andika sentensi ya pili kwa mkono");
      setupPage53Canvas(secondCanvas);
      secondAnswer.appendChild(secondCanvas);

      const secondActions = document.createElement("div");
      secondActions.className = "response-actions page52-sentence-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () {
        secondCanvas.getContext("2d").clearRect(0, 0, secondCanvas.width, secondCanvas.height);
      });
      secondActions.appendChild(clear);
      sentenceWrap.classList.add("page52-sentence-fields");
      sentenceWrap.replaceChildren(sentenceModel, firstAnswer, firstActions, secondAnswer, secondActions);
    }

    const enforcePage53Content = function () {
      const title = page.querySelector('[data-id="pg053_s001_n0002"]');
      if (title && title.textContent.trim() !== "Kuandika herufi ya irabu E") title.textContent = "Kuandika herufi ya irabu E";
      const introOne = page.querySelector('[data-id="pg053_s001_n0003"]');
      const introTwo = page.querySelector('[data-id="pg053_s001_n0004"]');
      if (introOne && introOne.textContent.trim() !== "Katika somo hili utajifunza kuandika herufi ya") introOne.textContent = "Katika somo hili utajifunza kuandika herufi ya";
      if (introTwo && introTwo.textContent.trim() !== "irabu E.") introTwo.textContent = "irabu E.";
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) {
        if (!node.hidden) node.hidden = true;
      });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage53Content();
    requestAnimationFrame(enforcePage53Content);
    setTimeout(enforcePage53Content, 300);
    setTimeout(enforcePage53Content, 900);
  }

  if (pageNumber === 54) {
    page.classList.add("page54-complete", "page52-complete", "batch-v2-page-52");

    function buildPage54Practice(responseId, modelSource, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page54Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.dataset.page54Ready = "true";
      card.classList.add("page52-practice-card");
      card.querySelectorAll("figure.source-figure,:scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption").forEach(function (node) { node.hidden = true; });

      const model = document.createElement("div");
      model.className = "page52-model";
      if (modelSource) {
        const image = document.createElement("img");
        image.src = modelSource;
        image.alt = "Mfano halisi wa uandishi kutoka kwenye kitabu";
        model.appendChild(image);
      } else {
        model.classList.add("page52-letter-model");
        ["I", "I", "I", "I", "I"].forEach(function (letter) {
          const span = document.createElement("span");
          span.textContent = letter;
          model.appendChild(span);
        });
      }

      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer";
      if (guideText) {
        const guide = document.createElement("span");
        guide.className = "page52-answer-guide page52-answer-guide-1";
        guide.textContent = guideText;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      }
      answer.appendChild(canvas);
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    const traceCard54 = page.querySelector('[data-response-id="pg054_sec001_response_04"]');
    const traceWrap54 = traceCard54 && traceCard54.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
    const traceCanvas54 = traceWrap54 && traceWrap54.querySelector("canvas");
    if (traceCard54 && traceWrap54 && traceCanvas54) {
      traceCard54.dataset.page54Ready = "true";
      traceCard54.classList.add("page52-trace-card");
      traceCard54.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      const traceImage = document.createElement("img");
      traceImage.src = "images/pg054_im001_source_model_clean.png?v=1";
      traceImage.alt = "Herufi kubwa I za kufuatisha kwenye mistari mikubwa na midogo";
      traceWrap54.className = "handwriting-canvas-wrap page52-trace-wrap";
      traceWrap54.removeAttribute("style");
      traceWrap54.replaceChildren(traceImage, traceCanvas54);
    }

    function setupPage54Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function getPoint(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = getPoint(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const point = getPoint(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(point.x, point.y);
        context.stroke();
        lastPoint = point;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    buildPage54Practice("pg054_sec001_response_01", "", "I");
    buildPage54Practice("pg054_sec001_response_02", "images/pg054_im002_source_model_clean.png?v=1", "Isaya");
    buildPage54Practice("pg054_sec001_response_03", "images/pg054_im003_source_model_compact.png?v=1", "");

    const sentenceCard54 = page.querySelector('[data-response-id="pg054_sec001_response_03"]');
    const sentenceWrap54 = sentenceCard54 && sentenceCard54.querySelector(".page52-practice-wrap");
    const sentenceModel54 = sentenceWrap54 && sentenceWrap54.querySelector(".page52-model");
    const firstAnswer54 = sentenceWrap54 && sentenceWrap54.querySelector(".page52-notebook-answer");
    const firstCanvas54 = firstAnswer54 && firstAnswer54.querySelector("canvas");
    const firstActions54 = sentenceCard54 && sentenceCard54.querySelector(":scope > .response-actions");
    if (sentenceCard54 && sentenceWrap54 && sentenceModel54 && firstAnswer54 && firstCanvas54 && firstActions54) {
      firstAnswer54.classList.add("page52-sentence-answer");
      firstCanvas54.dataset.practiceStorage = "pg054_sec001_response_03_sentence_1";
      firstActions54.classList.add("page52-sentence-actions");
      firstActions54.querySelectorAll(".submit-response").forEach(function (node) { node.hidden = true; });
      const secondAnswer = document.createElement("div");
      secondAnswer.className = "page52-notebook-answer page52-sentence-answer";
      const secondCanvas = firstCanvas54.cloneNode(false);
      secondCanvas.dataset.practiceStorage = "pg054_sec001_response_03_sentence_2";
      secondCanvas.setAttribute("aria-label", "Andika sentensi ya pili kwa mkono");
      setupPage54Canvas(secondCanvas);
      secondAnswer.appendChild(secondCanvas);
      const secondActions = document.createElement("div");
      secondActions.className = "response-actions page52-sentence-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () { secondCanvas.getContext("2d").clearRect(0, 0, secondCanvas.width, secondCanvas.height); });
      secondActions.appendChild(clear);
      sentenceWrap54.classList.add("page52-sentence-fields");
      sentenceWrap54.replaceChildren(sentenceModel54, firstAnswer54, firstActions54, secondAnswer, secondActions);
    }

    const enforcePage54Content = function () {
      const title = page.querySelector('[data-id="pg054_s001_n0002"]');
      if (title && title.textContent.trim() !== "Kuandika herufi ya irabu i") title.innerHTML = "Kuandika herufi ya irabu <strong class=\"vowel-focus\">i</strong>";
      const intro = page.querySelector('[data-id="pg054_s001_n0003"]');
      if (intro && intro.textContent.trim() !== "Katika somo hili utajifunza kuandika herufi ya irabu i.") intro.innerHTML = "Katika somo hili utajifunza kuandika herufi ya irabu <strong class=\"vowel-focus\">i</strong>.";
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) { if (!node.hidden) node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage54Content();
    requestAnimationFrame(enforcePage54Content);
    setTimeout(enforcePage54Content, 300);
    setTimeout(enforcePage54Content, 900);
  }

  if (pageNumber === 55) {
    page.classList.add("page55-complete", "page52-complete", "batch-v2-page-52");

    function buildPage55Practice(responseId, modelSource, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page55Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.dataset.page55Ready = "true";
      card.classList.add("page52-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,:scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption").forEach(function (node) { node.hidden = true; });
      const model = document.createElement("div");
      model.className = "page52-model";
      if (modelSource) {
        const image = document.createElement("img");
        image.src = modelSource;
        image.alt = "Mfano halisi wa uandishi kutoka kwenye kitabu";
        model.appendChild(image);
      } else {
        model.classList.add("page52-letter-model");
        ["O", "O", "O", "O", "O"].forEach(function (letter) {
          const span = document.createElement("span");
          span.textContent = letter;
          model.appendChild(span);
        });
      }
      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer";
      if (guideText) {
        const guide = document.createElement("span");
        guide.className = "page52-answer-guide page52-answer-guide-1";
        guide.textContent = guideText;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      }
      answer.appendChild(canvas);
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    const traceCard55 = page.querySelector('[data-response-id="pg055_sec001_response_04"]');
    const traceWrap55 = traceCard55 && traceCard55.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
    const traceCanvas55 = traceWrap55 && traceWrap55.querySelector("canvas");
    if (traceCard55 && traceWrap55 && traceCanvas55) {
      traceCard55.classList.add("page52-trace-card");
      traceCard55.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      const traceImage = document.createElement("img");
      traceImage.src = "images/pg055_im001_source_model_clean.png?v=1";
      traceImage.alt = "Herufi kubwa O za kufuatisha kwenye mistari mikubwa na midogo";
      traceWrap55.className = "handwriting-canvas-wrap page52-trace-wrap";
      traceWrap55.removeAttribute("style");
      traceWrap55.replaceChildren(traceImage, traceCanvas55);
    }

    function setupPage55Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = point(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        lastPoint = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    buildPage55Practice("pg055_sec001_response_01", "", "O");
    buildPage55Practice("pg055_sec001_response_02", "images/pg055_im002_source_model_clean.png?v=1", "Okumu");
    buildPage55Practice("pg055_sec001_response_03", "images/pg055_im003_source_model_compact.png?v=1", "");

    const sentenceCard55 = page.querySelector('[data-response-id="pg055_sec001_response_03"]');
    const sentenceWrap55 = sentenceCard55 && sentenceCard55.querySelector(".page52-practice-wrap");
    const sentenceModel55 = sentenceWrap55 && sentenceWrap55.querySelector(".page52-model");
    const firstAnswer55 = sentenceWrap55 && sentenceWrap55.querySelector(".page52-notebook-answer");
    const firstCanvas55 = firstAnswer55 && firstAnswer55.querySelector("canvas");
    const firstActions55 = sentenceCard55 && sentenceCard55.querySelector(":scope > .response-actions");
    if (sentenceCard55 && sentenceWrap55 && sentenceModel55 && firstAnswer55 && firstCanvas55 && firstActions55) {
      firstAnswer55.classList.add("page52-sentence-answer");
      firstCanvas55.dataset.practiceStorage = "pg055_sec001_response_03_sentence_1";
      firstActions55.classList.add("page52-sentence-actions");
      firstActions55.querySelectorAll(".submit-response").forEach(function (node) { node.hidden = true; });
      const secondAnswer = document.createElement("div");
      secondAnswer.className = "page52-notebook-answer page52-sentence-answer";
      const secondCanvas = firstCanvas55.cloneNode(false);
      secondCanvas.dataset.practiceStorage = "pg055_sec001_response_03_sentence_2";
      secondCanvas.setAttribute("aria-label", "Andika sentensi ya pili kwa mkono");
      setupPage55Canvas(secondCanvas);
      secondAnswer.appendChild(secondCanvas);
      const secondActions = document.createElement("div");
      secondActions.className = "response-actions page52-sentence-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () { secondCanvas.getContext("2d").clearRect(0, 0, secondCanvas.width, secondCanvas.height); });
      secondActions.appendChild(clear);
      sentenceWrap55.classList.add("page52-sentence-fields");
      sentenceWrap55.replaceChildren(sentenceModel55, firstAnswer55, firstActions55, secondAnswer, secondActions);
    }

    const enforcePage55Content = function () {
      const title = page.querySelector('[data-id="pg055_s001_n0002"]');
      if (title && title.textContent.trim() !== "Kuandika herufi ya irabu O") title.textContent = "Kuandika herufi ya irabu O";
      const intro = page.querySelector('[data-id="pg055_s001_n0003"]');
      if (intro && intro.textContent.trim() !== "Katika somo hili utajifunza kuandika herufi ya irabu O.") intro.textContent = "Katika somo hili utajifunza kuandika herufi ya irabu O.";
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) { if (!node.hidden) node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage55Content();
    requestAnimationFrame(enforcePage55Content);
    setTimeout(enforcePage55Content, 300);
    setTimeout(enforcePage55Content, 900);
  }

  if (pageNumber === 56) {
    page.classList.add("page56-complete", "page52-complete", "batch-v2-page-52");

    function buildPage56Practice(responseId, modelSource, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page56Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.dataset.page56Ready = "true";
      card.classList.add("page52-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,:scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption").forEach(function (node) { node.hidden = true; });
      const model = document.createElement("div");
      model.className = "page52-model";
      if (modelSource) {
        const image = document.createElement("img");
        image.src = modelSource;
        image.alt = "Mfano halisi wa uandishi kutoka kwenye kitabu";
        model.appendChild(image);
      } else {
        model.classList.add("page52-letter-model");
        ["U", "U", "U", "U", "U"].forEach(function (letter) {
          const span = document.createElement("span");
          span.textContent = letter;
          model.appendChild(span);
        });
      }
      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer";
      if (guideText) {
        const guide = document.createElement("span");
        guide.className = "page52-answer-guide page52-answer-guide-1";
        guide.textContent = guideText;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      }
      answer.appendChild(canvas);
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    const traceCard56 = page.querySelector('[data-response-id="pg056_sec001_response_05"]');
    const traceWrap56 = traceCard56 && traceCard56.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
    const traceCanvas56 = traceWrap56 && traceWrap56.querySelector("canvas");
    if (traceCard56 && traceWrap56 && traceCanvas56) {
      traceCard56.classList.add("page52-trace-card");
      traceCard56.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      const traceImage = document.createElement("img");
      traceImage.src = "images/pg056_im001_source_model_clean.png?v=1";
      traceImage.alt = "Herufi kubwa U za kufuatisha kwenye mistari mikubwa na midogo";
      traceWrap56.className = "handwriting-canvas-wrap page52-trace-wrap";
      traceWrap56.removeAttribute("style");
      traceWrap56.replaceChildren(traceImage, traceCanvas56);
    }

    function setupPage56Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = point(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        lastPoint = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    buildPage56Practice("pg056_sec001_response_01", "", "U");
    buildPage56Practice("pg056_sec001_response_02", "images/pg056_im002_source_model_clean.png?v=1", "Ujiji");
    buildPage56Practice("pg056_sec001_response_03", "images/pg056_im003_source_model_clean.png?v=1", "");

    const sentenceCard56 = page.querySelector('[data-response-id="pg056_sec001_response_03"]');
    const sentenceWrap56 = sentenceCard56 && sentenceCard56.querySelector(".page52-practice-wrap");
    const sentenceModel56 = sentenceWrap56 && sentenceWrap56.querySelector(".page52-model");
    const firstAnswer56 = sentenceWrap56 && sentenceWrap56.querySelector(".page52-notebook-answer");
    const firstCanvas56 = firstAnswer56 && firstAnswer56.querySelector("canvas");
    const firstActions56 = sentenceCard56 && sentenceCard56.querySelector(":scope > .response-actions");
    if (sentenceCard56 && sentenceWrap56 && sentenceModel56 && firstAnswer56 && firstCanvas56 && firstActions56) {
      firstAnswer56.classList.add("page52-sentence-answer");
      firstCanvas56.dataset.practiceStorage = "pg056_sec001_response_03_sentence_1";
      firstActions56.classList.add("page52-sentence-actions");
      firstActions56.querySelectorAll(".submit-response").forEach(function (node) { node.hidden = true; });
      const secondAnswer = document.createElement("div");
      secondAnswer.className = "page52-notebook-answer page52-sentence-answer";
      const secondCanvas = firstCanvas56.cloneNode(false);
      secondCanvas.dataset.practiceStorage = "pg056_sec001_response_03_sentence_2";
      secondCanvas.setAttribute("aria-label", "Andika sentensi ya pili kwa mkono");
      setupPage56Canvas(secondCanvas);
      secondAnswer.appendChild(secondCanvas);
      const secondActions = document.createElement("div");
      secondActions.className = "response-actions page52-sentence-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () { secondCanvas.getContext("2d").clearRect(0, 0, secondCanvas.width, secondCanvas.height); });
      secondActions.appendChild(clear);
      sentenceWrap56.classList.add("page52-sentence-fields");
      sentenceWrap56.replaceChildren(sentenceModel56, firstAnswer56, firstActions56, secondAnswer, secondActions);
    }

    const exerciseCard56 = page.querySelector('[data-response-id="pg056_sec001_response_04"]');
    const exerciseLabel56 = page.querySelector(':scope > [data-id="pg056_s001_n0008"]');
    const exerciseWrap56 = exerciseCard56 && exerciseCard56.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
    if (exerciseCard56 && exerciseWrap56) {
      exerciseCard56.classList.add("page56-exercise-panel");
      if (exerciseLabel56 && !exerciseCard56.contains(exerciseLabel56)) {
        exerciseLabel56.classList.add("page56-exercise-label");
        exerciseCard56.insertBefore(exerciseLabel56, exerciseCard56.firstChild);
      }
      exerciseCard56.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      exerciseWrap56.className = "handwriting-canvas-wrap page56-exercise-answer";
      exerciseWrap56.removeAttribute("style");
    }

    const enforcePage56Content = function () {
      const title = page.querySelector('[data-id="pg056_s001_n0002"]');
      if (title && title.textContent.trim() !== "Kuandika herufi ya irabu U") title.textContent = "Kuandika herufi ya irabu U";
      const intro = page.querySelector('[data-id="pg056_s001_n0003"]');
      if (intro && intro.textContent.trim() !== "Katika somo hili utajifunza kuandika herufi ya irabu U.") intro.textContent = "Katika somo hili utajifunza kuandika herufi ya irabu U.";
      const prompt = page.querySelector('[data-id="pg056_s001_n0009"]');
      const words = page.querySelector('[data-id="pg056_s001_n0010"]');
      if (prompt && prompt.textContent.trim() !== "Nakili maneno haya kisha pigia mstari irabu zote.") prompt.textContent = "Nakili maneno haya kisha pigia mstari irabu zote.";
      if (words && words.textContent.trim() !== "1. BUIBUI   2. KONDOA   3. BEBA   4. MEI   5. UBUYU") words.textContent = "1. BUIBUI   2. KONDOA   3. BEBA   4. MEI   5. UBUYU";
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) { if (!node.hidden) node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage56Content();
    requestAnimationFrame(enforcePage56Content);
    setTimeout(enforcePage56Content, 300);
    setTimeout(enforcePage56Content, 900);
  }

  if (pageNumber === 57) {
    page.classList.add("page57-complete", "page52-complete", "batch-v2-page-52");

    function buildPage57Practice(responseId, modelSource, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page57Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.dataset.page57Ready = "true";
      card.classList.add("page52-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,:scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption").forEach(function (node) { node.hidden = true; });

      const model = document.createElement("div");
      model.className = "page52-model";
      const image = document.createElement("img");
      image.src = modelSource;
      image.alt = "Mfano halisi wa uandishi kutoka kwenye kitabu";
      model.appendChild(image);

      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer";
      if (guideText) {
        const guide = document.createElement("span");
        guide.className = "page52-answer-guide page52-answer-guide-1";
        guide.textContent = guideText;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      }
      answer.appendChild(canvas);
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    const traceCard57 = page.querySelector('[data-response-id="pg057_sec002_response_03"]');
    const traceWrap57 = traceCard57 && traceCard57.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
    const traceCanvas57 = traceWrap57 && traceWrap57.querySelector("canvas");
    if (traceCard57 && traceWrap57 && traceCanvas57) {
      traceCard57.classList.add("page52-trace-card");
      traceCard57.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      const traceImage = document.createElement("img");
      traceImage.src = "images/pg057_im001_source_model.png?v=2";
      traceImage.alt = "Herufi kubwa B za kufuatisha kwenye mistari mikubwa na midogo";
      traceWrap57.className = "handwriting-canvas-wrap page52-trace-wrap";
      traceWrap57.removeAttribute("style");
      traceWrap57.replaceChildren(traceImage, traceCanvas57);
    }

    buildPage57Practice("pg057_sec002_response_01", "images/pg057_letter_model_clean.png?v=1", "B");
    buildPage57Practice("pg057_sec002_response_02", "images/pg057_im002_source_model_clean.png?v=1", "Beda");

    const enforcePage57Content = function () {
      const title = page.querySelector('[data-id="pg057_s002_n0002"]');
      if (title && title.textContent.trim() !== "Kuandika herufi ya konsonanti B") title.textContent = "Kuandika herufi ya konsonanti B";
      const intro = page.querySelector('[data-id="pg057_s002_n0003"]');
      if (intro && intro.textContent.trim() !== "Katika somo hili utajifunza kuandika herufi ya konsonanti B.") intro.textContent = "Katika somo hili utajifunza kuandika herufi ya konsonanti B.";
      const introTail = page.querySelector('[data-id="pg057_s002_n0004"]');
      if (introTail && !introTail.hidden) introTail.hidden = true;
      const traceDescription = page.querySelector('[data-response-id="pg057_sec002_response_03"] img');
      if (traceDescription) traceDescription.alt = "Herufi kubwa B iko upande wa kushoto. Upande wa kulia kuna herufi B sita zilizochorwa kwa nukta kati ya mistari ya mwandiko; fuatisha kila B kutoka kushoto kwenda kulia.";
      const namesDescription = page.querySelector('[data-response-id="pg057_sec002_response_02"] img');
      if (namesDescription) namesDescription.alt = "Mstari unaonyesha majina Beda, Bukoba, Benedeta na Baraka. Soma kila jina kutoka kushoto kwenda kulia, kisha liandike kwenye daftari.";
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) { if (!node.hidden) node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage57Content();
    requestAnimationFrame(enforcePage57Content);
    setTimeout(enforcePage57Content, 300);
    setTimeout(enforcePage57Content, 900);
  }

  if (pageNumber === 58) {
    page.classList.add("page58-complete", "page52-complete", "batch-v2-page-52");

    function setupPage58Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = point(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        lastPoint = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    function buildPage58Practice(responseId, modelSource, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page58Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.dataset.page58Ready = "true";
      card.classList.add("page52-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,:scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption").forEach(function (node) { node.hidden = true; });
      const model = document.createElement("div");
      model.className = "page52-model";
      const image = document.createElement("img");
      image.src = modelSource;
      image.alt = "Mfano halisi wa uandishi kutoka kwenye kitabu";
      model.appendChild(image);
      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer";
      if (guideText) {
        const guide = document.createElement("span");
        guide.className = "page52-answer-guide page52-answer-guide-1";
        guide.textContent = guideText;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      }
      answer.appendChild(canvas);
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    const traceCard58 = page.querySelector('[data-response-id="pg058_sec001_response_05"]');
    const traceWrap58 = traceCard58 && traceCard58.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
    const traceCanvas58 = traceWrap58 && traceWrap58.querySelector("canvas");
    if (traceCard58 && traceWrap58 && traceCanvas58) {
      traceCard58.classList.add("page52-trace-card");
      traceCard58.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      const traceImage = document.createElement("img");
      traceImage.src = "images/pg058_im002_source_model.png?v=2";
      traceImage.alt = "Herufi kubwa M iko upande wa kushoto; upande wa kulia kuna herufi M za kufuatisha kwa nukta kwenye mistari mikubwa na midogo.";
      traceWrap58.className = "handwriting-canvas-wrap page52-trace-wrap";
      traceWrap58.removeAttribute("style");
      traceWrap58.replaceChildren(traceImage, traceCanvas58);
    }

    buildPage58Practice("pg058_sec001_response_01", "images/pg058_im001_source_model_clean.png?v=1", "");
    buildPage58Practice("pg058_sec001_response_02", "images/pg058_letter_model_clean.png?v=1", "M");
    buildPage58Practice("pg058_sec001_response_03", "images/pg058_im003_source_model.png?v=2", "Monika");
    buildPage58Practice("pg058_sec001_response_04", "images/pg058_sentence_model_clean.png?v=1", "");

    const continuationCard58 = page.querySelector('[data-response-id="pg058_sec001_response_01"]');
    const continuationWrap58 = continuationCard58 && continuationCard58.querySelector(".page52-practice-wrap");
    const continuationModel58 = continuationWrap58 && continuationWrap58.querySelector(".page52-model");
    const firstAnswer58 = continuationWrap58 && continuationWrap58.querySelector(".page52-notebook-answer");
    const firstCanvas58 = firstAnswer58 && firstAnswer58.querySelector("canvas");
    const firstActions58 = continuationCard58 && continuationCard58.querySelector(":scope > .response-actions");
    if (continuationCard58 && continuationWrap58 && continuationModel58 && firstAnswer58 && firstCanvas58 && firstActions58) {
      firstAnswer58.classList.add("page52-sentence-answer");
      firstCanvas58.dataset.practiceStorage = "pg058_sec001_response_01_sentence_1";
      firstActions58.classList.add("page52-sentence-actions");
      firstActions58.querySelectorAll(".submit-response").forEach(function (node) { node.hidden = true; });
      const secondAnswer = document.createElement("div");
      secondAnswer.className = "page52-notebook-answer page52-sentence-answer";
      const secondCanvas = firstCanvas58.cloneNode(false);
      secondCanvas.dataset.practiceStorage = "pg058_sec001_response_01_sentence_2";
      secondCanvas.setAttribute("aria-label", "Andika sentensi ya pili kwa mkono");
      setupPage58Canvas(secondCanvas);
      secondAnswer.appendChild(secondCanvas);
      const secondActions = document.createElement("div");
      secondActions.className = "response-actions page52-sentence-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () { secondCanvas.getContext("2d").clearRect(0, 0, secondCanvas.width, secondCanvas.height); });
      secondActions.appendChild(clear);
      continuationWrap58.classList.add("page52-sentence-fields");
      continuationWrap58.replaceChildren(continuationModel58, firstAnswer58, firstActions58, secondAnswer, secondActions);
    }

    const enforcePage58Content = function () {
      const title = page.querySelector('[data-id="pg058_s001_n0003"]');
      if (title && title.textContent.trim() !== "Kuandika herufi ya konsonanti M") title.textContent = "Kuandika herufi ya konsonanti M";
      const intro = page.querySelector('[data-id="pg058_s001_n0004"]');
      if (intro && intro.textContent.trim() !== "Katika somo hili utajifunza kuandika herufi ya konsonanti M.") intro.textContent = "Katika somo hili utajifunza kuandika herufi ya konsonanti M.";
      const introTail = page.querySelector('[data-id="pg058_s001_n0005"]');
      if (introTail && !introTail.hidden) introTail.hidden = true;
      const model58 = page.querySelector('[data-response-id="pg058_sec001_response_03"] img');
      if (model58) model58.alt = "Mstari wa mwandiko unaonyesha mifano ya majina yanayoanza kwa herufi M. Soma kutoka kushoto kwenda kulia, kisha yaandike kwenye daftari.";
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) { if (!node.hidden) node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage58Content();
    requestAnimationFrame(enforcePage58Content);
    setTimeout(enforcePage58Content, 300);
    setTimeout(enforcePage58Content, 900);
  }

  if (pageNumber === 59) {
    page.classList.add("page59-complete", "page52-complete", "batch-v2-page-52");

    function setupPage59Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = point(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        lastPoint = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    function buildPage59Practice(responseId, modelSource, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page59Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.dataset.page59Ready = "true";
      card.classList.add("page52-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,:scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption").forEach(function (node) { node.hidden = true; });
      const model = document.createElement("div");
      model.className = "page52-model";
      const image = document.createElement("img");
      image.src = modelSource;
      image.alt = "Mfano halisi wa uandishi kutoka kwenye kitabu";
      model.appendChild(image);
      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer";
      if (guideText) {
        const guide = document.createElement("span");
        guide.className = "page52-answer-guide page52-answer-guide-1";
        guide.textContent = guideText;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      }
      answer.appendChild(canvas);
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    const lesson59 = page.querySelector(":scope > .lesson-card");
    if (lesson59 && !page.querySelector('[data-response-id="pg059_added_response_00"]')) {
      const continuation = document.createElement("section");
      continuation.className = "response-card handwriting-response sample-response practice-card page52-practice-card page59-continuation";
      continuation.dataset.responseId = "pg059_added_response_00";
      const prompt = document.createElement("h1");
      prompt.className = "source-line source-heading question-prompt inclusive-instruction";
      prompt.textContent = "Andika sentensi hizi kwenye daftari.";
      const wrap = document.createElement("div");
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      const model = document.createElement("div");
      model.className = "page52-model";
      const image = document.createElement("img");
      image.src = "images/pg059_m_sentence_model_clean.png?v=1";
      image.alt = "Mfano wa sentensi: Musa amechuma maua.";
      model.appendChild(image);
      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer page52-sentence-answer";
      const canvas = document.createElement("canvas");
      canvas.className = "drawing-canvas handwriting-canvas";
      canvas.width = 900;
      canvas.height = 260;
      canvas.tabIndex = 0;
      canvas.dataset.practiceStorage = "pg059_added_response_00";
      canvas.setAttribute("aria-label", "Andika sentensi kwa mkono");
      setupPage59Canvas(canvas);
      answer.appendChild(canvas);
      const actions = document.createElement("div");
      actions.className = "response-actions page52-sentence-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () { canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); });
      actions.appendChild(clear);
      wrap.append(model, answer);
      continuation.append(prompt, wrap, actions);
      page.insertBefore(continuation, lesson59);
    }

    const traceCard59 = page.querySelector('[data-response-id="pg059_sec001_response_04"]');
    const traceWrap59 = traceCard59 && traceCard59.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
    const traceCanvas59 = traceWrap59 && traceWrap59.querySelector("canvas");
    if (traceCard59 && traceWrap59 && traceCanvas59) {
      traceCard59.classList.add("page52-trace-card");
      traceCard59.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      const traceImage = document.createElement("img");
      traceImage.src = "images/pg059_im001_source_model.png?v=2";
      traceImage.alt = "Herufi kubwa D za kufuatisha kwenye mistari mikubwa na midogo";
      traceWrap59.className = "handwriting-canvas-wrap page52-trace-wrap";
      traceWrap59.removeAttribute("style");
      traceWrap59.replaceChildren(traceImage, traceCanvas59);
    }

    buildPage59Practice("pg059_sec001_response_01", "images/pg059_letter_model_clean.png?v=1", "D");
    buildPage59Practice("pg059_sec001_response_02", "images/pg059_im002_source_model.png?v=2", "Diana");
    buildPage59Practice("pg059_sec001_response_03", "images/pg059_im003_source_model_clean.png?v=1", "");

    const enforcePage59Content = function () {
      const title = page.querySelector('[data-id="pg059_s001_n0002"]');
      if (title && title.textContent.trim() !== "Kuandika herufi ya konsonanti D") title.textContent = "Kuandika herufi ya konsonanti D";
      const intro = page.querySelector('[data-id="pg059_s001_n0003"]');
      if (intro && intro.textContent.trim() !== "Katika somo hili utajifunza kuandika herufi ya konsonanti D.") intro.textContent = "Katika somo hili utajifunza kuandika herufi ya konsonanti D.";
      const introTail = page.querySelector('[data-id="pg059_s001_n0004"]');
      if (introTail && !introTail.hidden) introTail.hidden = true;
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) { if (!node.hidden) node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage59Content();
    requestAnimationFrame(enforcePage59Content);
    setTimeout(enforcePage59Content, 300);
    setTimeout(enforcePage59Content, 900);
  }

  if (pageNumber === 60) {
    page.classList.add("page60-complete", "page52-complete", "batch-v2-page-52");

    function setupPage60Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = point(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        lastPoint = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    function buildPage60Practice(responseId, modelSource, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page60Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.dataset.page60Ready = "true";
      card.classList.add("page52-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,:scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption").forEach(function (node) { node.hidden = true; });
      const model = document.createElement("div");
      model.className = "page52-model";
      const image = document.createElement("img");
      image.src = modelSource;
      image.alt = "Mfano halisi wa uandishi kutoka kwenye kitabu";
      model.appendChild(image);
      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer";
      if (guideText) {
        const guide = document.createElement("span");
        guide.className = "page52-answer-guide page52-answer-guide-1";
        guide.textContent = guideText;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      }
      answer.appendChild(canvas);
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    const lesson60 = page.querySelector(":scope > .lesson-card");
    if (lesson60 && !page.querySelector('[data-response-id="pg060_added_response_00"]')) {
      const continuation = document.createElement("section");
      continuation.className = "response-card handwriting-response sample-response practice-card page52-practice-card page60-continuation";
      continuation.dataset.responseId = "pg060_added_response_00";
      const prompt = document.createElement("h1");
      prompt.className = "source-line source-heading question-prompt inclusive-instruction";
      prompt.textContent = "Andika sentensi hizi kwenye daftari.";
      const wrap = document.createElement("div");
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      const model = document.createElement("div");
      model.className = "page52-model";
      const image = document.createElement("img");
      image.src = "images/pg060_d_sentence_model_clean.png?v=1";
      image.alt = "Mfano wa sentensi: Diana anapikua dagaa.";
      model.appendChild(image);
      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer page52-sentence-answer";
      const canvas = document.createElement("canvas");
      canvas.className = "drawing-canvas handwriting-canvas";
      canvas.width = 900;
      canvas.height = 260;
      canvas.tabIndex = 0;
      canvas.dataset.practiceStorage = "pg060_added_response_00";
      canvas.setAttribute("aria-label", "Andika sentensi kwa mkono");
      setupPage60Canvas(canvas);
      answer.appendChild(canvas);
      const actions = document.createElement("div");
      actions.className = "response-actions page52-sentence-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () { canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); });
      actions.appendChild(clear);
      wrap.append(model, answer);
      continuation.append(prompt, wrap, actions);
      page.insertBefore(continuation, lesson60);
    }

    const traceCard60 = page.querySelector('[data-response-id="pg060_sec001_response_04"]');
    const traceWrap60 = traceCard60 && traceCard60.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
    const traceCanvas60 = traceWrap60 && traceWrap60.querySelector("canvas");
    if (traceCard60 && traceWrap60 && traceCanvas60) {
      traceCard60.classList.add("page52-trace-card");
      traceCard60.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      const traceImage = document.createElement("img");
      traceImage.src = "images/pg060_im001_source_model.png?v=2";
      traceImage.alt = "Herufi kubwa K iko upande wa kushoto; upande wa kulia kuna herufi K za kufuatisha kwa nukta kwenye mistari mikubwa na midogo.";
      traceWrap60.className = "handwriting-canvas-wrap page52-trace-wrap";
      traceWrap60.removeAttribute("style");
      traceWrap60.replaceChildren(traceImage, traceCanvas60);
    }

    buildPage60Practice("pg060_sec001_response_01", "images/pg060_letter_model_clean.png?v=1", "K");
    buildPage60Practice("pg060_sec001_response_02", "images/pg060_im002_source_model.png?v=2", "Kibibi");
    buildPage60Practice("pg060_sec001_response_03", "images/pg060_im003_source_model_clean.png?v=1", "");

    const sentenceCard60 = page.querySelector('[data-response-id="pg060_sec001_response_03"]');
    const sentenceWrap60 = sentenceCard60 && sentenceCard60.querySelector(".page52-practice-wrap");
    const sentenceModel60 = sentenceWrap60 && sentenceWrap60.querySelector(".page52-model");
    const firstAnswer60 = sentenceWrap60 && sentenceWrap60.querySelector(".page52-notebook-answer");
    const firstCanvas60 = firstAnswer60 && firstAnswer60.querySelector("canvas");
    const firstActions60 = sentenceCard60 && sentenceCard60.querySelector(":scope > .response-actions");
    if (sentenceCard60 && sentenceWrap60 && sentenceModel60 && firstAnswer60 && firstCanvas60 && firstActions60) {
      firstAnswer60.classList.add("page52-sentence-answer");
      firstCanvas60.dataset.practiceStorage = "pg060_sec001_response_03_sentence_1";
      firstActions60.classList.add("page52-sentence-actions");
      firstActions60.querySelectorAll(".submit-response").forEach(function (node) { node.hidden = true; });
      const secondAnswer = document.createElement("div");
      secondAnswer.className = "page52-notebook-answer page52-sentence-answer";
      const secondCanvas = firstCanvas60.cloneNode(false);
      secondCanvas.dataset.practiceStorage = "pg060_sec001_response_03_sentence_2";
      secondCanvas.setAttribute("aria-label", "Andika sentensi ya pili kwa mkono");
      setupPage60Canvas(secondCanvas);
      secondAnswer.appendChild(secondCanvas);
      const secondActions = document.createElement("div");
      secondActions.className = "response-actions page52-sentence-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () { secondCanvas.getContext("2d").clearRect(0, 0, secondCanvas.width, secondCanvas.height); });
      secondActions.appendChild(clear);
      sentenceWrap60.classList.add("page52-sentence-fields");
      sentenceWrap60.replaceChildren(sentenceModel60, firstAnswer60, firstActions60, secondAnswer, secondActions);
    }

    const enforcePage60Content = function () {
      const title = page.querySelector('[data-id="pg060_s001_n0002"]');
      if (title && title.textContent.trim() !== "Kuandika herufi ya konsonanti K") title.textContent = "Kuandika herufi ya konsonanti K";
      const intro = page.querySelector('[data-id="pg060_s001_n0003"]');
      if (intro && intro.textContent.trim() !== "Katika somo hili utajifunza kuandika herufi ya konsonanti K.") intro.textContent = "Katika somo hili utajifunza kuandika herufi ya konsonanti K.";
      const introTail = page.querySelector('[data-id="pg060_s001_n0004"]');
      if (introTail && !introTail.hidden) introTail.hidden = true;
      const names60 = page.querySelector('[data-response-id="pg060_sec001_response_02"] img');
      if (names60) names60.alt = "Mstari wa mwandiko unaonyesha mifano ya majina yanayoanza kwa herufi K. Soma kutoka kushoto kwenda kulia, kisha yaandike kwenye daftari.";
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) { if (!node.hidden) node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage60Content();
    requestAnimationFrame(enforcePage60Content);
    setTimeout(enforcePage60Content, 300);
    setTimeout(enforcePage60Content, 900);
  }

  if (pageNumber === 61) {
    page.classList.add("page61-complete", "page52-complete", "batch-v2-page-52");

    function setupPage61Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = point(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        lastPoint = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    function buildPage61Practice(responseId, modelSource, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page61Ready === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.dataset.page61Ready = "true";
      card.classList.add("page52-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,:scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption").forEach(function (node) { node.hidden = true; });
      const model = document.createElement("div");
      model.className = "page52-model";
      const image = document.createElement("img");
      image.src = modelSource;
      image.alt = "Mfano halisi wa uandishi kutoka kwenye kitabu";
      model.appendChild(image);
      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer";
      if (guideText) {
        const guide = document.createElement("span");
        guide.className = "page52-answer-guide page52-answer-guide-1";
        guide.textContent = guideText;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      }
      answer.appendChild(canvas);
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    const traceCard61 = page.querySelector('[data-response-id="pg061_sec001_response_04"]');
    const traceWrap61 = traceCard61 && traceCard61.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
    const traceCanvas61 = traceWrap61 && traceWrap61.querySelector("canvas");
    if (traceCard61 && traceWrap61 && traceCanvas61) {
      traceCard61.classList.add("page52-trace-card");
      traceCard61.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      const traceImage = document.createElement("img");
      traceImage.src = "images/pg061_im001_source_model.png?v=2";
      traceImage.alt = "Herufi kubwa N za kufuatisha kwenye mistari mikubwa na midogo";
      traceWrap61.className = "handwriting-canvas-wrap page52-trace-wrap";
      traceWrap61.removeAttribute("style");
      traceWrap61.replaceChildren(traceImage, traceCanvas61);
    }

    buildPage61Practice("pg061_sec001_response_01", "images/pg061_letter_model_clean.png?v=1", "N");
    buildPage61Practice("pg061_sec001_response_02", "images/pg061_im002_source_model.png?v=2", "Naomi");
    buildPage61Practice("pg061_sec001_response_03", "images/pg061_im003_source_model_clean.png?v=1", "");

    const sentenceCard61 = page.querySelector('[data-response-id="pg061_sec001_response_03"]');
    const sentenceWrap61 = sentenceCard61 && sentenceCard61.querySelector(".page52-practice-wrap");
    const sentenceModel61 = sentenceWrap61 && sentenceWrap61.querySelector(".page52-model");
    const firstAnswer61 = sentenceWrap61 && sentenceWrap61.querySelector(".page52-notebook-answer");
    const firstCanvas61 = firstAnswer61 && firstAnswer61.querySelector("canvas");
    const firstActions61 = sentenceCard61 && sentenceCard61.querySelector(":scope > .response-actions");
    if (sentenceCard61 && sentenceWrap61 && sentenceModel61 && firstAnswer61 && firstCanvas61 && firstActions61) {
      firstAnswer61.classList.add("page52-sentence-answer");
      firstCanvas61.dataset.practiceStorage = "pg061_sec001_response_03_sentence_1";
      firstActions61.classList.add("page52-sentence-actions");
      firstActions61.querySelectorAll(".submit-response").forEach(function (node) { node.hidden = true; });
      const secondAnswer = document.createElement("div");
      secondAnswer.className = "page52-notebook-answer page52-sentence-answer";
      const secondCanvas = firstCanvas61.cloneNode(false);
      secondCanvas.dataset.practiceStorage = "pg061_sec001_response_03_sentence_2";
      secondCanvas.setAttribute("aria-label", "Andika sentensi ya pili kwa mkono");
      setupPage61Canvas(secondCanvas);
      secondAnswer.appendChild(secondCanvas);
      const secondActions = document.createElement("div");
      secondActions.className = "response-actions page52-sentence-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () { secondCanvas.getContext("2d").clearRect(0, 0, secondCanvas.width, secondCanvas.height); });
      secondActions.appendChild(clear);
      sentenceWrap61.classList.add("page52-sentence-fields");
      sentenceWrap61.replaceChildren(sentenceModel61, firstAnswer61, firstActions61, secondAnswer, secondActions);
    }

    const enforcePage61Content = function () {
      const title = page.querySelector('[data-id="pg061_s001_n0002"]');
      if (title && title.textContent.trim() !== "Kuandika herufi ya konsonanti N") title.textContent = "Kuandika herufi ya konsonanti N";
      const intro = page.querySelector('[data-id="pg061_s001_n0003"]');
      if (intro && intro.textContent.trim() !== "Katika somo hili utajifunza kuandika herufi ya konsonanti N.") intro.textContent = "Katika somo hili utajifunza kuandika herufi ya konsonanti N.";
      const introTail = page.querySelector('[data-id="pg061_s001_n0004"]');
      if (introTail && !introTail.hidden) introTail.hidden = true;
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) { if (!node.hidden) node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage61Content();
    requestAnimationFrame(enforcePage61Content);
    setTimeout(enforcePage61Content, 300);
    setTimeout(enforcePage61Content, 900);
  }

  if (pageNumber === 62) {
    page.classList.add("page62-complete");

    function setupPage62InlineCanvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = point(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        lastPoint = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    function buildPage62IntroFields() {
      const nameLineOne62 = page.querySelector('[data-id="pg062_s001_n0005"]');
      const nameLineTwo62 = page.querySelector('[data-id="pg062_s001_n0006"]');
      if (!nameLineOne62 || !nameLineTwo62) return;
      let group = page.querySelector(".page62-intro-fill-group");
      if (!group) {
        group = document.createElement("div");
        group.className = "page62-intro-fill-group";
        nameLineOne62.parentNode.insertBefore(group, nameLineOne62);
      }
      if (nameLineOne62.parentNode !== group) group.appendChild(nameLineOne62);
      if (nameLineTwo62.parentNode !== group) group.appendChild(nameLineTwo62);
      nameLineOne62.classList.add("page62-intro-fill-line");
      nameLineTwo62.classList.add("page62-intro-fill-line");
      if (group.querySelectorAll(".page62-inline-field").length === 3) return;
      group.querySelectorAll(".page62-inline-actions").forEach(function (node) { node.remove(); });

      function makeField(storageKey, label) {
        const field = document.createElement("span");
        field.className = "page62-inline-field";
        const canvas = document.createElement("canvas");
        canvas.className = "drawing-canvas handwriting-canvas page62-inline-canvas";
        canvas.width = 600;
        canvas.height = 180;
        canvas.tabIndex = 0;
        canvas.dataset.practiceStorage = storageKey;
        canvas.setAttribute("aria-label", label);
        setupPage62InlineCanvas(canvas);
        field.appendChild(canvas);
        return field;
      }

      const myName = makeField("pg062_intro_name_1", "Andika jina lako kwa mkono");
      const friendOne = makeField("pg062_intro_name_2", "Andika jina la rafiki wa kwanza kwa mkono");
      const friendTwo = makeField("pg062_intro_name_3", "Andika jina la rafiki wa pili kwa mkono");
      nameLineOne62.replaceChildren(document.createTextNode("Mimi ninaitwa "), myName, document.createTextNode(" Wewe unaitwa "), friendOne);
      nameLineTwo62.replaceChildren(document.createTextNode("na huyu anaitwa "), friendTwo);

      const actions = document.createElement("div");
      actions.className = "page62-inline-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear page62-inline-clear";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () {
        [myName, friendOne, friendTwo].forEach(function (field) {
          const canvas = field.querySelector("canvas");
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        });
      });
      actions.appendChild(clear);
      group.appendChild(actions);
    }
    buildPage62IntroFields();
    requestAnimationFrame(buildPage62IntroFields);
    setTimeout(buildPage62IntroFields, 300);
    setTimeout(buildPage62IntroFields, 900);

    const exerciseCard62 = page.querySelector('[data-response-id="pg062_sec001_response_01"]');
    const exerciseLabel62 = page.querySelector(":scope > .activity-label");
    const exerciseWrap62 = exerciseCard62 && exerciseCard62.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
    if (exerciseCard62 && exerciseWrap62) {
      exerciseCard62.classList.add("page62-exercise-panel");
      if (exerciseLabel62 && !exerciseCard62.contains(exerciseLabel62)) {
        exerciseLabel62.classList.add("page62-exercise-label");
        exerciseCard62.insertBefore(exerciseLabel62, exerciseCard62.firstChild);
      }
      exerciseCard62.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      exerciseWrap62.className = "handwriting-canvas-wrap page62-names-answer";
      exerciseWrap62.removeAttribute("style");
    }
    const enforcePage62Content = function () {
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) { if (!node.hidden) node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage62Content();
    requestAnimationFrame(enforcePage62Content);
    setTimeout(enforcePage62Content, 300);
    setTimeout(enforcePage62Content, 900);
  }

  if (pageNumber === 63) {
    page.classList.add("page63-complete");

    function setupPage63Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = point(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        lastPoint = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    const songCard63 = page.querySelector('[data-response-id="pg063_sec001_response_01"]');
    const songLabel63 = page.querySelector(":scope > .activity-label");
    if (songCard63) {
      songCard63.classList.add("page63-song-panel");
      if (songLabel63 && !songCard63.contains(songLabel63)) {
        songLabel63.classList.add("page63-song-label");
        songCard63.insertBefore(songLabel63, songCard63.firstChild);
      }
      songCard63.querySelectorAll(":scope > .handwriting-canvas-wrap,:scope > .canvas-wrap,:scope > .response-actions,:scope > .inclusive-instruction:not(.source-line),:scope > .response-feedback").forEach(function (node) { node.hidden = true; });
    }

    const questionCard63 = page.querySelector('[data-response-id="pg063_sec001_response_02"]');
    const questionTwo63 = questionCard63 && questionCard63.querySelector('[data-id="pg063_s001_n0012"]');
    const firstWrap63 = questionCard63 && questionCard63.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
    const firstCanvas63 = firstWrap63 && firstWrap63.querySelector("canvas");
    const firstActions63 = questionCard63 && questionCard63.querySelector(":scope > .response-actions");
    if (questionCard63 && questionTwo63 && firstWrap63 && firstCanvas63 && firstActions63 && questionCard63.dataset.page63Ready !== "true") {
      questionCard63.dataset.page63Ready = "true";
      questionCard63.classList.add("page63-question-card");
      questionCard63.querySelectorAll(":scope > .inclusive-instruction:not(.source-line),:scope > .response-feedback").forEach(function (node) { node.hidden = true; });
      firstWrap63.className = "handwriting-canvas-wrap page63-question-answer";
      firstWrap63.removeAttribute("style");
      firstCanvas63.dataset.practiceStorage = "pg063_sec001_response_02_question_1";
      firstActions63.classList.add("page63-question-actions");
      questionCard63.insertBefore(firstWrap63, questionTwo63);
      questionCard63.insertBefore(firstActions63, questionTwo63);

      const secondAnswer = document.createElement("div");
      secondAnswer.className = "handwriting-canvas-wrap page63-question-answer";
      const secondCanvas = firstCanvas63.cloneNode(false);
      secondCanvas.dataset.practiceStorage = "pg063_sec001_response_02_question_2";
      secondCanvas.setAttribute("aria-label", "Jibu swali la pili kwa mkono");
      setupPage63Canvas(secondCanvas);
      secondAnswer.appendChild(secondCanvas);
      const secondActions = document.createElement("div");
      secondActions.className = "response-actions page63-question-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () { secondCanvas.getContext("2d").clearRect(0, 0, secondCanvas.width, secondCanvas.height); });
      secondActions.appendChild(clear);
      questionCard63.append(secondAnswer, secondActions);
    }

    const questionThreeCard63 = page.querySelector('[data-response-id="pg063_sec001_response_03"]');
    const questionThreeWrap63 = questionThreeCard63 && questionThreeCard63.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
    const questionThreeActions63 = questionThreeCard63 && questionThreeCard63.querySelector(":scope > .response-actions");
    if (questionThreeCard63 && questionThreeWrap63 && questionThreeActions63) {
      questionThreeCard63.classList.add("page63-question-card");
      questionThreeCard63.querySelectorAll(":scope > .inclusive-instruction:not(.source-line),:scope > .response-feedback").forEach(function (node) { node.hidden = true; });
      questionThreeWrap63.className = "handwriting-canvas-wrap page63-question-answer";
      questionThreeWrap63.removeAttribute("style");
      questionThreeActions63.classList.add("page63-question-actions");
    }

    const enforcePage63Content = function () {
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) { if (!node.hidden) node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage63Content();
    requestAnimationFrame(enforcePage63Content);
    setTimeout(enforcePage63Content, 300);
    setTimeout(enforcePage63Content, 900);
  }

  if (pageNumber >= 64 && pageNumber <= 69) {
    const letterLessonConfig = {
      64: { letter: "L", name: "Lina", section: "s002", response: "pg064_sec002", trace: "pg064_sec002_response_04" },
      65: { letter: "T", name: "Tina", section: "s001", response: "pg065_sec001", trace: "pg065_sec001_response_04" },
      66: { letter: "P", name: "Paulina", section: "s001", response: "pg066_sec001", trace: "pg066_sec001_response_04" },
      67: { letter: "S", name: "Subira", section: "s001", response: "pg067_sec001", trace: "pg067_sec001_response_04" },
      68: { letter: "F", name: "Fatuma", section: "s001", response: "pg068_sec001", trace: "pg068_sec001_response_05" },
      69: { letter: "J", name: "Jakaya", section: "s001", response: "pg069_sec001", trace: "pg069_sec001_response_05" }
    }[pageNumber];
    const pageStem = "pg" + String(pageNumber).padStart(3, "0");
    page.classList.add("page" + pageNumber + "-complete", "page52-complete", "batch-v2-page-52");

    function setupLetterLessonCanvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = point(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        lastPoint = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    function buildLetterLessonPractice(responseId, modelSource, guideText) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.letterLessonReady === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.dataset.letterLessonReady = "true";
      card.classList.add("page52-practice-card");
      card.querySelectorAll(":scope > figure.source-figure,:scope > .inclusive-instruction:not(.source-line),:scope > .sample-model-caption").forEach(function (node) { node.hidden = true; });
      const model = document.createElement("div");
      model.className = "page52-model";
      const image = document.createElement("img");
      image.src = modelSource;
      image.alt = "Mfano halisi wa uandishi kutoka kwenye kitabu";
      model.appendChild(image);
      const answer = document.createElement("div");
      answer.className = "page52-notebook-answer";
      if (guideText) {
        const guide = document.createElement("span");
        guide.className = "page52-answer-guide page52-answer-guide-1";
        guide.textContent = guideText;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      }
      answer.appendChild(canvas);
      wrap.className = "handwriting-canvas-wrap page52-practice-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren(model, answer);
    }

    const traceCard = page.querySelector('[data-response-id="' + letterLessonConfig.trace + '"]');
    const traceWrap = traceCard && traceCard.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
    const traceCanvas = traceWrap && traceWrap.querySelector("canvas");
    if (traceCard && traceWrap && traceCanvas) {
      traceCard.classList.add("page52-trace-card");
      traceCard.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
      const traceImage = document.createElement("img");
      traceImage.src = "images/" + pageStem + "_trace_model_clean.png?v=1";
      traceImage.alt = "Herufi kubwa " + letterLessonConfig.letter + " za kufuatisha kwenye mistari mikubwa na midogo";
      traceWrap.className = "handwriting-canvas-wrap page52-trace-wrap";
      traceWrap.removeAttribute("style");
      traceWrap.replaceChildren(traceImage, traceCanvas);
    }

    buildLetterLessonPractice(letterLessonConfig.response + "_response_01", "images/" + pageStem + "_letter_model_clean.png?v=1", letterLessonConfig.letter);
    buildLetterLessonPractice(letterLessonConfig.response + "_response_02", "images/" + pageStem + "_names_model_clean.png?v=1", letterLessonConfig.name);
    buildLetterLessonPractice(letterLessonConfig.response + "_response_03", "images/" + pageStem + "_sentence_model_clean.png?v=1", "");

    const sentenceCard = page.querySelector('[data-response-id="' + letterLessonConfig.response + '_response_03"]');
    const sentenceWrap = sentenceCard && sentenceCard.querySelector(".page52-practice-wrap");
    const sentenceModel = sentenceWrap && sentenceWrap.querySelector(".page52-model");
    const firstAnswer = sentenceWrap && sentenceWrap.querySelector(".page52-notebook-answer");
    const firstCanvas = firstAnswer && firstAnswer.querySelector("canvas");
    const firstActions = sentenceCard && sentenceCard.querySelector(":scope > .response-actions");
    if (sentenceCard && sentenceWrap && sentenceModel && firstAnswer && firstCanvas && firstActions) {
      firstAnswer.classList.add("page52-sentence-answer");
      firstCanvas.dataset.practiceStorage = letterLessonConfig.response + "_sentence_1";
      firstActions.classList.add("page52-sentence-actions");
      firstActions.querySelectorAll(".submit-response").forEach(function (node) { node.hidden = true; });
      const secondAnswer = document.createElement("div");
      secondAnswer.className = "page52-notebook-answer page52-sentence-answer";
      const secondCanvas = firstCanvas.cloneNode(false);
      secondCanvas.dataset.practiceStorage = letterLessonConfig.response + "_sentence_2";
      secondCanvas.setAttribute("aria-label", "Andika sentensi ya pili kwa mkono");
      setupLetterLessonCanvas(secondCanvas);
      secondAnswer.appendChild(secondCanvas);
      const secondActions = document.createElement("div");
      secondActions.className = "response-actions page52-sentence-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () { secondCanvas.getContext("2d").clearRect(0, 0, secondCanvas.width, secondCanvas.height); });
      secondActions.appendChild(clear);
      sentenceWrap.classList.add("page52-sentence-fields");
      sentenceWrap.replaceChildren(sentenceModel, firstAnswer, firstActions, secondAnswer, secondActions);
    }

    if (pageNumber === 69) {
      const exerciseCard69 = page.querySelector('[data-response-id="pg069_sec001_response_04"]');
      const exerciseLabel69 = page.querySelector(":scope > .activity-label");
      const exerciseWrap69 = exerciseCard69 && exerciseCard69.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      if (exerciseCard69 && exerciseWrap69) {
        exerciseCard69.classList.add("page69-exercise-panel");
        if (exerciseLabel69 && !exerciseCard69.contains(exerciseLabel69)) {
          exerciseLabel69.classList.add("page69-exercise-label");
          exerciseCard69.insertBefore(exerciseLabel69, exerciseCard69.firstChild);
        }
        exerciseCard69.querySelectorAll(":scope > .inclusive-instruction:not(.source-line)").forEach(function (node) { node.hidden = true; });
        exerciseWrap69.className = "handwriting-canvas-wrap page69-exercise-answer";
        exerciseWrap69.removeAttribute("style");
      }
    }

    const enforceLetterLessonContent = function () {
      const title = page.querySelector('[data-id="' + pageStem + '_' + letterLessonConfig.section + '_n0002"]');
      if (title && title.textContent.trim() !== "Kuandika herufi ya konsonanti " + letterLessonConfig.letter) title.textContent = "Kuandika herufi ya konsonanti " + letterLessonConfig.letter;
      const intro = page.querySelector('[data-id="' + pageStem + '_' + letterLessonConfig.section + '_n0003"]');
      if (intro && intro.textContent.trim() !== "Katika somo hili utajifunza kuandika herufi ya konsonanti " + letterLessonConfig.letter + ".") intro.textContent = "Katika somo hili utajifunza kuandika herufi ya konsonanti " + letterLessonConfig.letter + ".";
      const introTail = page.querySelector('[data-id="' + pageStem + '_' + letterLessonConfig.section + '_n0004"]');
      if (introTail && !introTail.hidden) introTail.hidden = true;
      page.querySelectorAll('[data-id$="_label"],.response-feedback').forEach(function (node) { if (!node.hidden) node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforceLetterLessonContent();
    requestAnimationFrame(enforceLetterLessonContent);
    setTimeout(enforceLetterLessonContent, 300);
    setTimeout(enforceLetterLessonContent, 900);
  }

  if (pageNumber === 70) {
    page.classList.add("page70-complete");

    function setupPage70Canvas(canvas) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = point(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        lastPoint = next;
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
    }

    const label70 = page.querySelector('[data-id="pg070_s001_n0001"]');
    const prompt70 = page.querySelector('[data-id="pg070_s001_n0002"]');
    if (label70 && prompt70 && !page.querySelector(".page70-exercise-panel")) {
      const panel = document.createElement("section");
      panel.className = "page70-exercise-panel";
      label70.parentNode.insertBefore(panel, label70);
      label70.classList.add("page70-exercise-label");
      panel.append(label70, prompt70);
      const grid = document.createElement("img");
      grid.className = "page70-picture-grid";
      grid.src = "images/pg070_picture_grid_clean.png?v=1";
      grid.alt = "Picha tano zilizopangwa kwenye kisanduku: picha ya kwanza mtoto anapika kwenye jiko; ya pili mtoto anasukuma toroli iliyojaa udongo; ya tatu mtoto anaokota kuni; ya nne mtoto anaandika mezani; ya tano wasichana wawili wanaandika pamoja.";
      grid.setAttribute("data-adt-description", grid.alt);
      grid.setAttribute("data-adt-audio-description-id", "pg070_picture_grid_audio_description");
      panel.appendChild(grid);
      page.querySelectorAll(":scope > figure.source-figure,:scope > [data-id=\"pg070_s001_n0003\"],:scope > [data-id=\"pg070_s001_n0004\"],:scope > [data-id=\"pg070_s001_n0005\"],:scope > [data-id=\"pg070_s001_n0006\"]").forEach(function (node) { node.hidden = true; });

      const fillLines = [
        { id: "pg070_s001_n0007", before: "1. Fano ", after: "" },
        { id: "pg070_s001_n0008", before: "2. Puna anasukuma ", after: "" },
        { id: "pg070_s001_n0009", before: "3. Tizo ", after: " kuni." },
        { id: "pg070_s001_n0010", before: "4. Sia ", after: " picha." },
        { id: "pg070_s001_n0011", before: "5. Sudi na Adila ", after: "" }
      ];
      const canvases = [];
      fillLines.forEach(function (item, index) {
        const sourceLine = page.querySelector('[data-id="' + item.id + '"]');
        if (!sourceLine) return;
        sourceLine.hidden = true;
        const line = document.createElement("div");
        line.className = "page70-fill-line";
        const field = document.createElement("span");
        field.className = "page70-inline-field";
        const canvas = document.createElement("canvas");
        canvas.className = "drawing-canvas handwriting-canvas page70-inline-canvas";
        canvas.width = 900;
        canvas.height = 180;
        canvas.tabIndex = 0;
        canvas.dataset.practiceStorage = "pg070_fill_" + (index + 1);
        canvas.setAttribute("aria-label", "Jaza jibu la " + (index + 1) + " kwa mkono");
        setupPage70Canvas(canvas);
        field.appendChild(canvas);
        canvases.push(canvas);
        line.append(document.createTextNode(item.before), field, document.createTextNode(item.after));
        panel.appendChild(line);
      });
      const actions = document.createElement("div");
      actions.className = "page70-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "page70-clear";
      clear.textContent = "Futa";
      clear.addEventListener("click", function () { canvases.forEach(function (canvas) { canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); }); });
      actions.appendChild(clear);
      panel.appendChild(actions);
    }
    const enforcePage70Content = function () {
      ["pg070_s001_n0007", "pg070_s001_n0008", "pg070_s001_n0009", "pg070_s001_n0010", "pg070_s001_n0011"].forEach(function (id) {
        const sourceLine = page.querySelector('[data-id="' + id + '"]');
        if (sourceLine && !sourceLine.hidden) sourceLine.hidden = true;
      });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage && !printedPage.hidden) printedPage.hidden = true;
    };
    enforcePage70Content();
    requestAnimationFrame(enforcePage70Content);
    setTimeout(enforcePage70Content, 300);
    setTimeout(enforcePage70Content, 900);
  }

  if (pageNumber >= 71 && pageNumber <= 80) {
    page.classList.add("page7180-complete", "page" + pageNumber + "-complete");

    function setupPage7180Canvas(canvas, storageKey) {
      const context = canvas.getContext("2d");
      let drawing = false;
      let lastPoint = null;
      const key = "kuandika-page7180:" + location.pathname + ":" + storageKey;
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      }
      canvas.addEventListener("pointerdown", function (event) { drawing = true; lastPoint = point(event); event.preventDefault(); }, { passive: false });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.strokeStyle = "#153d4a";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(next.x, next.y);
        context.stroke();
        lastPoint = next;
        try { localStorage.setItem(key, canvas.toDataURL("image/png")); } catch (_) {}
        event.preventDefault();
      }, { passive: false });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
        canvas.addEventListener(name, function () { drawing = false; lastPoint = null; });
      });
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const image = new Image();
          image.onload = function () { context.drawImage(image, 0, 0, canvas.width, canvas.height); };
          image.src = saved;
        }
      } catch (_) {}
      return function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
        try { localStorage.removeItem(key); } catch (_) {}
      };
    }

    function makePage7180Action(clearCanvas) {
      const actions = document.createElement("div");
      actions.className = "response-actions page7180-field-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "drawing-clear clear-response";
      clear.textContent = "Futa";
      clear.addEventListener("click", clearCanvas);
      actions.appendChild(clear);
      return actions;
    }

    function makePage7180Answer(canvas, guideText) {
      const answer = document.createElement("div");
      answer.className = "page7180-notebook-answer";
      if (guideText) {
        const guide = document.createElement("span");
        guide.className = "page7180-guide-text";
        guide.textContent = guideText;
        guide.setAttribute("aria-hidden", "true");
        answer.appendChild(guide);
      }
      answer.appendChild(canvas);
      return answer;
    }

    function splitPage7180Card(responseId, fieldCount, modelSource) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.dataset.page7180Split === "true") return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
      const firstCanvas = wrap && wrap.querySelector("canvas");
      const firstActions = card.querySelector(":scope > .response-actions");
      if (!wrap || !firstCanvas || !firstActions) return;
      card.dataset.page7180Split = "true";
      card.classList.add("page7180-sentence-card");
      card.querySelectorAll("figure.source-figure,.batch-v2-sequence").forEach(function (node) { node.hidden = true; });
      card.querySelectorAll(":scope > .inclusive-instruction:not(.source-line),:scope > .response-feedback").forEach(function (node) { node.hidden = true; });
      firstActions.querySelectorAll(".submit-response").forEach(function (node) { node.hidden = true; });

      let source = Array.isArray(modelSource) ? "" : modelSource;
      if (!source && !Array.isArray(modelSource)) {
        const existing = card.querySelector(".batch-v2-model-image");
        if (existing) source = existing.getAttribute("src");
      }
      const sources = Array.isArray(modelSource) ? modelSource : [source];
      const makeModel = function (imageSource) {
        const model = document.createElement("div");
        model.className = "page7180-sentence-model";
        if (!imageSource) return model;
        const image = document.createElement("img");
        image.src = imageSource;
        image.alt = "Mfano halisi wa sentensi kutoka kwenye kitabu";
        model.appendChild(image);
        return model;
      };

      firstCanvas.height = 220;
      firstCanvas.dataset.practiceStorage = responseId + "_field_1";
      const nodes = [makeModel(sources[0]), makePage7180Answer(firstCanvas, ""), firstActions];
      for (let index = 2; index <= fieldCount; index += 1) {
        const canvas = firstCanvas.cloneNode(false);
        canvas.width = 900;
        canvas.height = 220;
        canvas.dataset.practiceStorage = responseId + "_field_" + index;
        canvas.setAttribute("aria-label", "Andika sentensi ya " + index + " kwa mkono");
        const clearCanvas = setupPage7180Canvas(canvas, responseId + "_field_" + index);
        nodes.push(makeModel(sources[index - 1]), makePage7180Answer(canvas, ""), makePage7180Action(clearCanvas));
      }
      wrap.className = "handwriting-canvas-wrap page7180-sentence-wrap";
      wrap.removeAttribute("style");
      wrap.replaceChildren.apply(wrap, nodes);
    }

    function setPage7180NameGuide(responseId, text) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      const answer = card && card.querySelector(".batch-v2-answer-lines");
      if (!answer || answer.querySelector(".page7180-guide-text")) return;
      answer.querySelectorAll(".batch-v2-guide-image,.batch-v2-guide-text").forEach(function (node) { node.hidden = true; });
      const guide = document.createElement("span");
      guide.className = "page7180-guide-text";
      guide.textContent = text;
      guide.setAttribute("aria-hidden", "true");
      answer.appendChild(guide);
    }

    function addPage7180Standalone(anchor, className, promptText, modelSource, fieldCount, guideText) {
      if (!anchor || page.querySelector("." + className)) return;
      const card = document.createElement("section");
      card.className = "response-card page7180-standalone-card " + className;
      if (promptText) {
        const prompt = document.createElement("p");
        prompt.className = "source-line source-heading question-prompt";
        prompt.textContent = promptText;
        card.appendChild(prompt);
      }
      if (modelSource) {
        const model = document.createElement("div");
        model.className = "page7180-sentence-model";
        const image = document.createElement("img");
        image.src = modelSource;
        image.alt = "Mfano halisi kutoka kwenye kitabu";
        model.appendChild(image);
        card.appendChild(model);
      }
      for (let index = 1; index <= fieldCount; index += 1) {
        const canvas = document.createElement("canvas");
        canvas.className = "drawing-canvas handwriting-canvas";
        canvas.width = 900;
        canvas.height = 220;
        canvas.tabIndex = 0;
        canvas.setAttribute("aria-label", "Andika jibu la " + index + " kwa mkono");
        const clearCanvas = setupPage7180Canvas(canvas, className + "_field_" + index);
        card.append(makePage7180Answer(canvas, index === 1 ? guideText : ""), makePage7180Action(clearCanvas));
      }
      anchor.parentNode.insertBefore(card, anchor);
    }

    const lesson7180 = {
      71: { section: "pg071_s002", title: 2, intro: 3, tail: 4, letter: "G" },
      72: { section: "pg072_s001", title: 3, intro: 4, tail: 5, letter: "Y" },
      73: { section: "pg073_s001", title: 2, intro: 3, tail: 4, letter: "Z" },
      74: { section: "pg074_s001", title: 2, intro: 3, tail: 4, letter: "R" },
      75: { section: "pg075_s001", title: 2, intro: 3, tail: 4, letter: "H" },
      76: { section: "pg076_s001", title: 2, intro: 3, tail: 4, letter: "W" },
      77: { section: "pg077_s001", title: 4, intro: 5, tail: 6, letter: "V" },
      78: { section: "pg078_s002", title: 2, intro: 3, tail: 4, letter: "CH" }
    }[pageNumber];
    const applyLesson7180Content = function () {
      if (!lesson7180) return;
      const id = function (number) { return lesson7180.section + "_n" + String(number).padStart(4, "0"); };
      const title = page.querySelector('[data-id="' + id(lesson7180.title) + '"]') || page.querySelector(".lesson-heading");
      const intro = page.querySelector('[data-id="' + id(lesson7180.intro) + '"]');
      const tail = page.querySelector('[data-id="' + id(lesson7180.tail) + '"]');
      if (title) title.textContent = pageNumber === 78 ? "Kuandika konsonanti CH" : "Kuandika herufi ya konsonanti " + lesson7180.letter;
      if (intro) intro.textContent = pageNumber === 78 ? "Katika somo hili utajifunza kuandika konsonanti CH." : "Katika somo hili utajifunza kuandika herufi ya konsonanti " + lesson7180.letter + ".";
      if (tail) tail.hidden = true;
    };
    applyLesson7180Content();

    if (pageNumber === 71) {
      setPage7180NameGuide("pg071_sec002_response_02", "Gidioni");
    }
    if (pageNumber === 72) {
      splitPage7180Card("pg072_sec001_response_01", 2, ["images/pg072_g_sentence1_clean.png?v=3", "images/pg072_g_sentence2_clean.png?v=3"]);
      setPage7180NameGuide("pg072_sec001_response_03", "Yahaya");
      splitPage7180Card("pg072_sec001_response_04", 1, "images/pg072_y_sentence_model_clean.png?v=1");
    }
    if (pageNumber === 73) {
      const lessonTitle = page.querySelector('[data-id="pg073_s001_n0001"]') || page.querySelector('[data-id="pg073_s001_n0002"]');
      addPage7180Standalone(lessonTitle, "page73-y-continuation", "", "images/pg073_y_sentence_model_clean.png?v=1", 1, "");
      setPage7180NameGuide("pg073_sec001_response_02", "Zena");
      splitPage7180Card("pg073_sec001_response_03", 2, ["images/pg073_z_sentence1_clean.png?v=3", "images/pg073_z_sentence2_clean.png?v=3"]);
      const junk = page.querySelector('[data-id="pg073_s001_n0009"]');
      if (junk) junk.hidden = true;
    }
    if (pageNumber === 74) {
      setPage7180NameGuide("pg074_sec001_response_02", "Rehema");
      splitPage7180Card("pg074_sec001_response_03", 2, ["images/pg074_r_sentence1_clean.png?v=3", "images/pg074_r_sentence2_clean.png?v=3"]);
    }
    if (pageNumber === 75) {
      setPage7180NameGuide("pg075_sec001_response_02", "Hamisi");
      splitPage7180Card("pg075_sec001_response_03", 2, ["images/pg075_h_sentence1_clean.png?v=3", "images/pg075_h_sentence2_clean.png?v=3"]);
    }
    if (pageNumber === 76) {
      setPage7180NameGuide("pg076_sec001_response_02", "Wema");
      splitPage7180Card("pg076_sec001_response_03", 2, ["images/pg076_w_sentence1_clean.png?v=3", "images/pg076_w_sentence2_clean.png?v=3"]);
    }
    if (pageNumber === 77) {
      const exercise77 = page.querySelector('[data-response-id="pg077_sec001_response_01"]');
      const label77 = page.querySelector('[data-id="pg077_s001_n0001"]');
      const prompt77 = page.querySelector('[data-id="pg077_s001_n0002"]');
      const wrap77 = exercise77 && exercise77.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      if (exercise77 && wrap77) {
        exercise77.classList.add("page77-name-exercise-card");
        if (label77 && !exercise77.contains(label77)) {
          label77.classList.add("page7180-exercise-label");
          exercise77.insertBefore(label77, exercise77.firstChild);
        }
        if (prompt77) prompt77.textContent = "Andika majina matano yanayoanza na herufi W.";
        wrap77.className = "handwriting-canvas-wrap page77-name-exercise-answer";
        wrap77.removeAttribute("style");
      }
    }
    if (pageNumber === 78) {
      setPage7180NameGuide("pg078_sec001_response_01", "Vumilia");
      splitPage7180Card("pg078_sec001_response_02", 2, ["images/pg078_v_sentence1_clean.png?v=3", "images/pg078_v_sentence2_clean.png?v=3"]);
    }
    if (pageNumber === 79) {
      const sentencePrompt79 = page.querySelector('[data-id="pg079_s001_n0001"]');
      addPage7180Standalone(sentencePrompt79, "page79-ch-names", "Andika majina haya kwenye daftari.", "images/pg079_ch_names_model_clean.png?v=1", 1, "Chacha");
      splitPage7180Card("pg079_sec001_response_01", 2, ["images/pg079_ch_sentence1_clean.png?v=3", "images/pg079_ch_sentence2_clean.png?v=3"]);
      const exercise79 = page.querySelector('[data-response-id="pg079_sec001_response_02"]');
      const label79 = page.querySelector('[data-id="pg079_s001_n0002"]');
      const prompt79 = page.querySelector('[data-id="pg079_s001_n0003"]');
      const wrap79 = exercise79 && exercise79.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const firstCanvas79 = wrap79 && wrap79.querySelector("canvas");
      const firstActions79 = exercise79 && exercise79.querySelector(":scope > .response-actions");
      if (exercise79 && wrap79 && firstCanvas79 && firstActions79 && exercise79.dataset.tableReady !== "true") {
        exercise79.dataset.tableReady = "true";
        exercise79.classList.add("page79-table-panel");
        if (label79 && !exercise79.contains(label79)) {
          label79.classList.add("page7180-exercise-label");
          exercise79.insertBefore(label79, exercise79.firstChild);
        }
        exercise79.querySelectorAll('[data-id="pg079_s001_n0004"],[data-id="pg079_s001_n0005"],[data-id="pg079_s001_n0006"],[data-id="pg079_s001_n0007"],[data-id="pg079_s001_n0008"],[data-id="pg079_s001_n0009"],[data-id="pg079_s001_n0010"]').forEach(function (node) { node.hidden = true; });
        const table = document.createElement("img");
        table.className = "page79-table-model";
        table.src = "images/pg079_table_model_clean.png?v=1";
        table.alt = "Jedwali la kutunga sentensi: Chacha amebeba gogo, yangeyange, zeze, redio, hereni, wavu au viatu";
        if (prompt79) prompt79.insertAdjacentElement("afterend", table);
        firstCanvas79.height = 220;
        const nodes = [makePage7180Answer(firstCanvas79, ""), firstActions79];
        for (let index = 2; index <= 3; index += 1) {
          const canvas = firstCanvas79.cloneNode(false);
          canvas.width = 900;
          canvas.height = 220;
          canvas.setAttribute("aria-label", "Andika sentensi ya " + index + " kutoka kwenye jedwali");
          const clearCanvas = setupPage7180Canvas(canvas, "pg079_table_field_" + index);
          nodes.push(makePage7180Answer(canvas, ""), makePage7180Action(clearCanvas));
        }
        wrap79.className = "handwriting-canvas-wrap page79-table-answers";
        wrap79.removeAttribute("style");
        wrap79.replaceChildren.apply(wrap79, nodes);
      }
    }

    const enforcePage7180 = function () {
      applyLesson7180Content();
      if (pageNumber === 80) {
        const firstTitleLine = page.querySelector('[data-id="pg080_s002_n0002"]');
        const secondTitleLine = page.querySelector('[data-id="pg080_s002_n0003"]');
        const heading80 = firstTitleLine && firstTitleLine.closest(".lesson-heading");
        const completeTitle80 = "Kuunda silabi kwa kutumia herufi ambatani zenye konsonanti mbili na irabu moja";
        if (firstTitleLine) firstTitleLine.textContent = completeTitle80;
        if (secondTitleLine) secondTitleLine.hidden = true;
        if (heading80) heading80.setAttribute("aria-label", completeTitle80);

        page.querySelectorAll("strong.page80-pdf-strong").forEach(function (strong) {
          strong.replaceWith(document.createTextNode(strong.textContent));
        });
          const wrapPdfBold80 = function (selector, source) {
            const element = page.querySelector(selector);
            if (!element) return;
            const matcher = new RegExp("(" + source + ")", "gi");
            const exact = new RegExp("^(?:" + source + ")$", "i");
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            const nodes = [];
            let node;
            while ((node = walker.nextNode())) nodes.push(node);
            nodes.forEach(function (textNode) {
              if (!textNode.nodeValue || !matcher.test(textNode.nodeValue)) {
                matcher.lastIndex = 0;
                return;
              }
              matcher.lastIndex = 0;
              const fragment = document.createDocumentFragment();
              textNode.nodeValue.split(matcher).forEach(function (part) {
                if (exact.test(part)) {
                  const strong = document.createElement("strong");
                  strong.className = "page80-pdf-strong";
                  if (/^Kuandika herufi ambatani$/i.test(part)) strong.classList.add("page80-pdf-heading");
                  strong.textContent = part;
                  fragment.appendChild(strong);
                } else {
                  fragment.appendChild(document.createTextNode(part));
                }
              });
              textNode.parentNode.replaceChild(fragment, textNode);
            });
          };

          const consonants80 = "\\b(?:ngw|ndw|njw|sh|ny|ng|nd|th|mb|kw|gw|sw|vy)\\b";
          wrapPdfBold80('[data-id="pg080_s001_n0006"]', "Kuandika herufi ambatani|" + consonants80);
          wrapPdfBold80('[data-id="pg080_s001_n0007"]', consonants80);
          wrapPdfBold80('[data-id="pg080_s002_n0007"]', consonants80);
          wrapPdfBold80('[data-id="pg080_s002_n0008"]', "\\b(?:sw|vy|e|o|i|u|a)\\b|ng’");
          wrapPdfBold80('[data-id="pg080_s002_n0009"]', "Mfano wa silabi");
          wrapPdfBold80('[data-id="pg080_s002_n0010"]', "\\b(?:sha|sh|a)\\b");
          wrapPdfBold80('[data-id="pg080_s002_n0011"]', "\\b(?:gwi|gw|i)\\b");
          wrapPdfBold80('[data-id="pg080_s002_n0012"]', "\\b(?:gwe|gw|e)\\b");
          wrapPdfBold80('[data-id="pg080_s002_n0013"]', "ng’o|ng’|\\bo\\b");
      }
      page.querySelectorAll(".submit-response,.page-submit-action,.response-feedback,[data-id$='_label']").forEach(function (node) { node.hidden = true; });
      const printedPage = page.querySelector(".printed-page-number");
      if (printedPage) printedPage.hidden = true;
      if (pageNumber === 73) {
        const junk = page.querySelector('[data-id="pg073_s001_n0009"]');
        if (junk) junk.hidden = true;
      }
      if (pageNumber === 77) {
        const prompt77 = page.querySelector('[data-id="pg077_s001_n0002"]');
        if (prompt77) prompt77.textContent = "Andika majina matano yanayoanza na herufi W.";
      }
      if (pageNumber === 79) {
        page.querySelectorAll('[data-id="pg079_s001_n0004"],[data-id="pg079_s001_n0005"],[data-id="pg079_s001_n0006"],[data-id="pg079_s001_n0007"],[data-id="pg079_s001_n0008"],[data-id="pg079_s001_n0009"],[data-id="pg079_s001_n0010"]').forEach(function (node) { node.hidden = true; });
      }
    };
    enforcePage7180();
    requestAnimationFrame(enforcePage7180);
    setTimeout(enforcePage7180, 300);
    setTimeout(enforcePage7180, 900);
  }

  if (pageNumber === 81) {
    const lessonThreeTitleFirst = page.querySelector('[data-id="pg081_s003_n0002"]');
    const lessonThreeTitleSecond = page.querySelector('[data-id="pg081_s003_n0003"]');
    const lessonThreeDescriptionFirst = page.querySelector('[data-id="pg081_s003_n0004"]');
    const lessonThreeDescriptionSecond = page.querySelector('[data-id="pg081_s003_n0005"]');
    const lessonThreeTitle = "Kuunda silabi kwa kutumia herufi ambatani zenye konsonanti tatu na irabu moja";
    const lessonThreeDescription = "Katika somo hili utaunda silabi. Utatumia konsonanti tatu na irabu moja.";

    if (lessonThreeTitleFirst) {
      lessonThreeTitleFirst.textContent = lessonThreeTitle;
      lessonThreeTitleFirst.closest(".lesson-heading-group")?.setAttribute("aria-label", lessonThreeTitle);
    }
    if (lessonThreeTitleSecond) lessonThreeTitleSecond.hidden = true;
    if (lessonThreeDescriptionFirst) lessonThreeDescriptionFirst.textContent = lessonThreeDescription;
    if (lessonThreeDescriptionSecond) lessonThreeDescriptionSecond.hidden = true;

    const buildPage81AnswerField = function (anchorId, className, storageKey, ariaLabel) {
      if (page.querySelector("." + className)) return;
      const anchor = page.querySelector('[data-id="' + anchorId + '"]');
      if (!anchor) return;
      const field = document.createElement("section");
      field.className = "page81-handwriting-field " + className;
      field.setAttribute("role", "group");
      field.setAttribute("aria-label", ariaLabel);
      const sheet = document.createElement("div");
      sheet.className = "page81-notebook-sheet";
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 525;
      canvas.tabIndex = 0;
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", ariaLabel + ". Andika kwa mkono kwenye mistari.");
      sheet.appendChild(canvas);
      const actions = document.createElement("div");
      actions.className = "response-actions page81-field-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "clear-response";
      clear.textContent = "Futa";
      actions.appendChild(clear);
      field.append(sheet, actions);
      anchor.insertAdjacentElement("afterend", field);

      const context = canvas.getContext("2d");
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 4;
      context.strokeStyle = "#163f4d";
      let drawing = false;
      const point = function (event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width / rect.width,
          y: (event.clientY - rect.top) * canvas.height / rect.height
        };
      };
      canvas.addEventListener("pointerdown", function (event) {
        drawing = true;
        canvas.setPointerCapture(event.pointerId);
        const start = point(event);
        context.beginPath();
        context.moveTo(start.x, start.y);
        event.preventDefault();
      });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.lineTo(next.x, next.y);
        context.stroke();
        event.preventDefault();
      });
      const stopDrawing = function () {
        drawing = false;
        try { localStorage.setItem(storageKey, canvas.toDataURL("image/png")); } catch (_) {}
      };
      canvas.addEventListener("pointerup", stopDrawing);
      canvas.addEventListener("pointercancel", stopDrawing);
      clear.addEventListener("click", function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
        try { localStorage.removeItem(storageKey); } catch (_) {}
      });
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const image = new Image();
          image.onload = function () { context.drawImage(image, 0, 0, canvas.width, canvas.height); };
          image.src = saved;
        }
      } catch (_) {}
    };

    const enforcePage81PdfBold = function () {
      const currentLessonThreeTitleFirst = page.querySelector('[data-id="pg081_s003_n0002"]');
      const currentLessonThreeTitleSecond = page.querySelector('[data-id="pg081_s003_n0003"]');
      const currentLessonThreeDescriptionFirst = page.querySelector('[data-id="pg081_s003_n0004"]');
      const currentLessonThreeDescriptionSecond = page.querySelector('[data-id="pg081_s003_n0005"]');
      if (currentLessonThreeTitleFirst) currentLessonThreeTitleFirst.textContent = lessonThreeTitle;
      if (currentLessonThreeTitleSecond) currentLessonThreeTitleSecond.hidden = true;
      if (currentLessonThreeDescriptionFirst) currentLessonThreeDescriptionFirst.textContent = lessonThreeDescription;
      if (currentLessonThreeDescriptionSecond) currentLessonThreeDescriptionSecond.hidden = true;

      page.querySelectorAll("strong.page81-pdf-strong").forEach(function (strong) {
        strong.replaceWith(document.createTextNode(strong.textContent));
      });

      const wrapPdfBold81 = function (selector, source) {
        const element = page.querySelector(selector);
        if (!element) return;
        const matcher = new RegExp("(" + source + ")", "gi");
        const exact = new RegExp("^(?:" + source + ")$", "i");
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const nodes = [];
        let node;
        while ((node = walker.nextNode())) nodes.push(node);
        nodes.forEach(function (textNode) {
          if (!textNode.nodeValue || !matcher.test(textNode.nodeValue)) {
            matcher.lastIndex = 0;
            return;
          }
          matcher.lastIndex = 0;
          const fragment = document.createDocumentFragment();
          textNode.nodeValue.split(matcher).forEach(function (part) {
            if (exact.test(part)) {
              const strong = document.createElement("strong");
              strong.className = "page81-pdf-strong";
              strong.textContent = part;
              fragment.appendChild(strong);
            } else {
              fragment.appendChild(document.createTextNode(part));
            }
          });
          textNode.parentNode.replaceChild(fragment, textNode);
        });
      };

      wrapPdfBold81('[data-id="pg081_s001_n0002"]', "\\b(?:sw|vy|rw|py)\\b");
      wrapPdfBold81('[data-id="pg081_s001_n0003"]', "\\b(?:nj|pw|fy|u|e|i|o|a)\\b|ng’");
      wrapPdfBold81('[data-id="pg081_s002_n0007"]', "Mfano wa maneno");
      wrapPdfBold81('[data-id="pg081_s002_n0009"]', "\\b(?:nyumba|nyu|mba)\\b");
      wrapPdfBold81('[data-id="pg081_s002_n0010"]', "\\b(?:ndoo|ndo|o)\\b");
      wrapPdfBold81('[data-id="pg081_s002_n0011"]', "\\b(?:thamani|tha|ma|ni)\\b");
      wrapPdfBold81('[data-id="pg081_s002_n0013"]', "\\b(?:ng|nd|kw)\\b");
      wrapPdfBold81('[data-id="pg081_s002_n0014"]', "\\bsw\\b");

      ['pg081_s002_n0003', 'pg081_s003_n0003'].forEach(function (id) {
        const heading = page.querySelector('[data-id="' + id + '"]');
        if (heading) heading.classList.add("page81-pdf-green-heading");
      });

      buildPage81AnswerField(
        "pg081_s001_n0003",
        "page81-exercise-one-answer",
        "pg081_exercise_one_answer",
        "Sehemu ya kujibu Zoezi la kwanza"
      );
      buildPage81AnswerField(
        "pg081_s002_n0014",
        "page81-exercise-two-answer",
        "pg081_exercise_two_answer",
        "Sehemu ya kujibu Zoezi la pili"
      );
    };

    enforcePage81PdfBold();
    requestAnimationFrame(enforcePage81PdfBold);
    setTimeout(enforcePage81PdfBold, 300);
    setTimeout(enforcePage81PdfBold, 900);
  }

  if (pageNumber === 41 && /pg041_sec001\.html$/i.test(location.pathname)) {
    const exerciseLabel = page.querySelector(":scope > .activity-label");
    const exerciseCard = page.querySelector(':scope > [data-response-id="pg041_sec001_response_01"]');
    if (exerciseLabel && exerciseCard) {
      exerciseCard.classList.add("page41-exercise-panel");
      exerciseCard.insertBefore(exerciseLabel, exerciseCard.firstChild);
      const choices = exerciseCard.querySelector('[data-id="pg041_s001_n0003"]');
      if (choices) {
        choices.textContent = "za   ze   zi   zu   na   fi";
        choices.classList.add("page41-syllable-choices");
        const enforceChoices = function () {
          choices.textContent = "za   ze   zi   zu   na   fi";
        };
        requestAnimationFrame(enforceChoices);
        setTimeout(enforceChoices, 250);
        setTimeout(enforceChoices, 900);
      }
      const extraChoice = exerciseCard.querySelector('[data-id="pg041_s001_n0004"]');
      if (extraChoice) extraChoice.hidden = true;
      ["pg041_s001_n0005", "pg041_s001_n0006", "pg041_s001_n0007", "pg041_s001_n0008", "pg041_s001_n0009"].forEach(function (id) {
        const line = exerciseCard.querySelector('[data-id="' + id + '"]');
        if (line) line.hidden = true;
      });
      const wrap = exerciseCard.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (wrap && canvas && !wrap.querySelector(".page41-missing-grid")) {
        wrap.className = "handwriting-canvas-wrap page41-missing-answer";
        wrap.removeAttribute("style");
        const grid = document.createElement("div");
        grid.className = "page41-missing-grid";
        [
          ["1.", "", "ia"],
          ["2.", "ze", ""],
          ["3.", "na", ""],
          ["4.", "u", "zi"],
          ["5.", "", "ma"]
        ].forEach(function (parts) {
          const row = document.createElement("div");
          row.className = "page41-missing-row";
          const number = document.createElement("span");
          number.className = "page41-missing-number";
          number.textContent = parts[0];
          const word = document.createElement("span");
          word.className = "page41-missing-word";
          if (parts[1]) word.append(document.createTextNode(parts[1]));
          const box = document.createElement("span");
          box.className = "page41-mini-input";
          box.setAttribute("aria-hidden", "true");
          word.appendChild(box);
          if (parts[2]) word.append(document.createTextNode(parts[2]));
          row.append(number, word);
          grid.appendChild(row);
        });
        wrap.replaceChildren(grid, canvas);
      }
    }
  }

  page.querySelectorAll(".page-submit-action").forEach(function (node) { node.hidden = true; });

  if (pageNumber >= 41) {
    const hideRuntimeSubmit = function () {
      document.querySelectorAll("button").forEach(function (button) {
        if (button.textContent.trim().toLowerCase() === "tuma") {
          button.hidden = true;
          button.style.display = "none";
        }
      });
      document.querySelectorAll(".response-feedback,.page-submit-feedback,[role='status'],[aria-live]").forEach(function (node) {
        const message = node.textContent.trim().toLowerCase();
        if (message.includes("jibu limehifadhiwa") || message.includes("jibu limetumwa") || message.includes("majibu yako yametumwa")) {
          node.textContent = "";
          node.hidden = true;
          node.style.display = "none";
        }
      });
    };
    hideRuntimeSubmit();
    const submitObserver = new MutationObserver(function () {
      hideRuntimeSubmit();
    });
    submitObserver.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { submitObserver.disconnect(); }, 5000);
  }

  async function mergePage41Continuation() {
    if (pageNumber !== 41 || !/pg041_sec001\.html$/i.test(location.pathname) || page.querySelector(".page41-continuation") || page.dataset.page41Merging === "true") return;
    page.dataset.page41Merging = "true";
    const response = await fetch("./pg041_sec002.html?merged=2");
    if (!response.ok) {
      delete page.dataset.page41Merging;
      return;
    }
    const source = new DOMParser().parseFromString(await response.text(), "text/html");
    const section = source.querySelector('[data-section-id="pg041_sec002"]');
    if (!section || page.querySelector(".page41-continuation")) {
      delete page.dataset.page41Merging;
      return;
    }
    const continuation = document.createElement("div");
    continuation.className = "page41-continuation";
    Array.from(section.childNodes).forEach(function (node) {
      continuation.appendChild(document.importNode(node, true));
    });
    const corrections = {
      pg041_s002_n0002: "Kuandika herufi ya konsonanti r",
      pg041_s002_n0004: "konsonanti r.",
      pg041_s002_n0005: "Fuatisha herufi ya konsonanti r."
    };
    Object.entries(corrections).forEach(function (entry) {
      const node = continuation.querySelector('[data-id="' + entry[0] + '"]');
      if (node) node.textContent = entry[1];
    });
    continuation.querySelectorAll('[data-response-id="pg041_sec002_response_01"] .trace-letter-model span').forEach(function (span) {
      span.textContent = "r";
    });
    page.appendChild(continuation);
    continuation.querySelectorAll("[data-response-id]").forEach(function (card) {
      if (window.KuandikaWritingActivities && window.KuandikaWritingActivities.setupCard) {
        window.KuandikaWritingActivities.setupCard(card);
      }
      standardizeCard(card);
    });

    function buildPage22StylePractice(responseId, source, guideClass, alt) {
      const card = continuation.querySelector('[data-response-id="' + responseId + '"]');
      const wrap = card && card.querySelector(".handwriting-canvas-wrap,.batch-v2-model-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!card || !wrap || !canvas) return;
      card.classList.add("page41-page22-practice-card");
      card.querySelectorAll("figure.practice-model,.handwriting-model,.sample-model-caption").forEach(function (node) {
        node.hidden = true;
        node.style.display = "none";
      });
      wrap.className = "handwriting-canvas-wrap page41-page22-model-practice";
      wrap.removeAttribute("style");
      const sequence = document.createElement("div");
      sequence.className = "page41-page22-model-sequence";
      const model = document.createElement("img");
      model.className = "page41-page22-model-image";
      model.src = source;
      model.alt = alt;
      const answer = document.createElement("div");
      answer.className = "page41-page22-answer " + guideClass;
      answer.setAttribute("aria-hidden", "true");
      sequence.append(model, answer);
      wrap.replaceChildren(sequence, canvas);
    }

    buildPage22StylePractice(
      "pg041_sec002_response_01",
      "images/pg041_batch_letter_model_compact.png?v=1",
      "page41-guide-letter",
      "Mfano wa kuandika herufi r."
    );
    buildPage22StylePractice(
      "pg041_sec002_response_02",
      "images/pg041_batch_syllables_model_compact.png?v=1",
      "page41-guide-syllables",
      "Mfano wa kuandika ra, re, ri, ro na ru."
    );
    const page41Trace = continuation.querySelector('[data-response-id="pg041_sec002_response_03"]');
    if (page41Trace) page41Trace.classList.add("page41-page22-practice-card", "page41-page22-trace-card");
    const enforceRContent = function () {
      Object.entries(corrections).forEach(function (entry) {
        const node = continuation.querySelector('[data-id="' + entry[0] + '"]');
        if (node) node.textContent = entry[1];
      });
      continuation.querySelectorAll('[data-response-id="pg041_sec002_response_01"] .trace-letter-model span,[data-response-id="pg041_sec002_response_01"] .batch-v2-text-model span,[data-response-id="pg041_sec002_response_01"] .batch-v2-guide-text').forEach(function (node) {
        node.textContent = "r";
      });
    };
    enforceRContent();
    requestAnimationFrame(enforceRContent);
    setTimeout(enforceRContent, 250);
    setTimeout(enforceRContent, 900);
    continuation.querySelectorAll(".page-submit-action").forEach(function (node) { node.remove(); });
    delete page.dataset.page41Merging;
  }

  mergePage41Continuation();

  async function mergeRemainingPageSections() {
    if (pageNumber < 42 || !/_sec001\.html$/i.test(location.pathname) || page.dataset.remainingSectionsMerged === "true") return;
    page.dataset.remainingSectionsMerged = "true";
    const pageCode = String(pageNumber).padStart(3, "0");
    for (let sectionNumber = 2; sectionNumber <= 4; sectionNumber += 1) {
      const sectionCode = String(sectionNumber).padStart(3, "0");
      const sectionId = "pg" + pageCode + "_sec" + sectionCode;
      try {
        const response = await fetch("./" + sectionId + ".html?merged=full-book-v1");
        if (!response.ok) continue;
        const source = new DOMParser().parseFromString(await response.text(), "text/html");
        const sourceSection = source.querySelector('[data-section-id="' + sectionId + '"]');
        if (!sourceSection || page.querySelector('[data-merged-section-id="' + sectionId + '"]')) continue;
        const continuation = document.createElement("div");
        continuation.className = "full-book-page-continuation";
        continuation.dataset.mergedSectionId = sectionId;
        Array.from(sourceSection.childNodes).forEach(function (node) {
          continuation.appendChild(document.importNode(node, true));
        });
        const knownPrompts = new Set(Array.from(page.querySelectorAll("[data-response-id]")).map(function (card) {
          return promptOf(card).toLocaleLowerCase("sw-TZ");
        }).filter(Boolean));
        continuation.querySelectorAll("[data-response-id]").forEach(function (card) {
          const prompt = promptOf(card).toLocaleLowerCase("sw-TZ");
          if (prompt && knownPrompts.has(prompt)) {
            card.remove();
            return;
          }
          if (prompt) knownPrompts.add(prompt);
        });
        page.appendChild(continuation);
        continuation.querySelectorAll("[data-response-id]").forEach(function (card) {
          if (window.KuandikaWritingActivities && window.KuandikaWritingActivities.setupCard) {
            window.KuandikaWritingActivities.setupCard(card);
          }
          standardizeCard(card);
        });
        continuation.querySelectorAll(".page-submit-action,.printed-page-number,.page-footer").forEach(function (node) {
          node.remove();
        });
      } catch (_) {
        /* A missing continuation means the PDF page already has one section. */
      }
    }
  }

  function setupPage82PdfLayout() {
    if (pageNumber !== 82) return;

    const setCombinedLine = function (firstId, hiddenIds, text) {
      const first = page.querySelector('[data-id="' + firstId + '"]');
      if (first) first.textContent = text;
      hiddenIds.forEach(function (id) {
        const continuation = page.querySelector('[data-id="' + id + '"]');
        if (continuation) continuation.hidden = true;
      });
      return first;
    };

    setCombinedLine(
      "pg082_s001_n0001",
      ["pg082_s001_n0002"],
      "Mfano wa konsonanti ngw ndw mbw njw chw nyw shw na irabu ( i e a o u )"
    );
    const exerciseThreePrompt = setCombinedLine(
      "pg082_s001_n0008",
      ["pg082_s001_n0009"],
      "Unda silabi kwa kutumia konsonanti ngw ndw mbw njw chw nyw shw na irabu ( u, e, i, o, a )."
    );
    setCombinedLine(
      "pg082_s002_n0003",
      ["pg082_s002_n0004", "pg082_s002_n0005"],
      "Katika somo hili utaunda maneno kwa kutumia herufi ambatani ngw ndw mbw njw chw nyw shw na irabu ( a e i o u )."
    );
    const exerciseFourPrompt = setCombinedLine(
      "pg082_s002_n0012",
      ["pg082_s002_n0013"],
      "Unda maneno yenye konsonanti ambatani ngw na chw na irabu ( a e i o u )."
    );

    page.querySelectorAll("strong.page82-pdf-strong").forEach(function (strong) {
      strong.replaceWith(document.createTextNode(strong.textContent));
    });
    const wrapPdfBold82 = function (selector, source) {
      const element = page.querySelector(selector);
      if (!element) return;
      const matcher = new RegExp("(" + source + ")", "gi");
      const exact = new RegExp("^(?:" + source + ")$", "i");
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let node;
      while ((node = walker.nextNode())) nodes.push(node);
      nodes.forEach(function (textNode) {
        matcher.lastIndex = 0;
        if (!textNode.nodeValue || !matcher.test(textNode.nodeValue)) return;
        matcher.lastIndex = 0;
        const fragment = document.createDocumentFragment();
        textNode.nodeValue.split(matcher).forEach(function (part) {
          if (exact.test(part)) {
            const strong = document.createElement("strong");
            strong.className = "page82-pdf-strong";
            strong.textContent = part;
            fragment.appendChild(strong);
          } else {
            fragment.appendChild(document.createTextNode(part));
          }
        });
        textNode.parentNode.replaceChild(fragment, textNode);
      });
    };

    wrapPdfBold82('[data-id="pg082_s001_n0001"]', "\\b(?:ngw|ndw|mbw|njw|chw|nyw|shw|i|e|a|o|u)\\b");
    wrapPdfBold82('[data-id="pg082_s001_n0003"]', "Mfano wa silabi");
    wrapPdfBold82('[data-id="pg082_s001_n0004"]', "\\b(?:ngwi|ngw|i)\\b");
    wrapPdfBold82('[data-id="pg082_s001_n0005"]', "\\b(?:ndwe|ndw|e)\\b");
    wrapPdfBold82('[data-id="pg082_s001_n0006"]', "\\b(?:nywo|nyw|o)\\b");
    wrapPdfBold82('[data-id="pg082_s001_n0008"]', "\\b(?:ngw|ndw|mbw|njw|chw|nyw|shw|u|e|i|o|a)\\b");
    wrapPdfBold82('[data-id="pg082_s002_n0003"]', "\\b(?:ngw|ndw|mbw|njw|chw|nyw|shw|a|e|i|o|u)\\b");
    wrapPdfBold82('[data-id="pg082_s002_n0006"]', "Mfano wa maneno");
    wrapPdfBold82('[data-id="pg082_s002_n0007"]', "\\b(?:chungwa|nywesha|mbwembwe|mchwa)\\b");
    wrapPdfBold82('[data-id="pg082_s002_n0008"]', "\\b(?:chu|ngwa|chungwa)\\b");
    wrapPdfBold82('[data-id="pg082_s002_n0009"]', "\\b(?:nywe|sha|nywesha)\\b");
    wrapPdfBold82('[data-id="pg082_s002_n0010"]', "\\b(?:mbwe|mbwembwe)\\b");
    wrapPdfBold82('[data-id="pg082_s002_n0012"]', "\\b(?:ngw|chw|a|e|i|o|u)\\b");

    const buildAnswerField = function (prompt, className, storageKey, label) {
      if (!prompt || page.querySelector("." + className)) return;
      const field = document.createElement("section");
      field.className = "page82-handwriting-field " + className;
      field.setAttribute("aria-label", label);
      const sheet = document.createElement("div");
      sheet.className = "page82-notebook-sheet";
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 420;
      canvas.setAttribute("aria-label", label + ". Andika kwa mkono kwenye mistari.");
      sheet.appendChild(canvas);
      const actions = document.createElement("div");
      actions.className = "page82-field-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "clear-response";
      clear.textContent = "Futa";
      actions.appendChild(clear);
      field.append(sheet, actions);
      prompt.insertAdjacentElement("afterend", field);

      const context = canvas.getContext("2d");
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 4;
      context.strokeStyle = "#163f4d";
      let drawing = false;
      const point = function (event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      };
      canvas.addEventListener("pointerdown", function (event) {
        drawing = true;
        canvas.setPointerCapture(event.pointerId);
        const start = point(event);
        context.beginPath();
        context.moveTo(start.x, start.y);
        event.preventDefault();
      });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.lineTo(next.x, next.y);
        context.stroke();
        event.preventDefault();
      });
      const save = function () {
        drawing = false;
        try { localStorage.setItem(storageKey, canvas.toDataURL("image/png")); } catch (_) {}
      };
      canvas.addEventListener("pointerup", save);
      canvas.addEventListener("pointercancel", save);
      clear.addEventListener("click", function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
        try { localStorage.removeItem(storageKey); } catch (_) {}
      });
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const image = new Image();
          image.onload = function () { context.drawImage(image, 0, 0, canvas.width, canvas.height); };
          image.src = saved;
        }
      } catch (_) {}
    };

    buildAnswerField(exerciseThreePrompt, "page82-exercise-three-answer", "pg082_exercise_three_answer", "Sehemu ya kujibu Zoezi la tatu");
    buildAnswerField(exerciseFourPrompt, "page82-exercise-four-answer", "pg082_exercise_four_answer", "Sehemu ya kujibu Zoezi la nne");

    page.classList.add("page82-pdf-layout");
  }

  const remainingSectionsPromise = mergeRemainingPageSections();
  setupPage82PdfLayout();
  requestAnimationFrame(setupPage82PdfLayout);
  setTimeout(setupPage82PdfLayout, 350);
  setTimeout(setupPage82PdfLayout, 1000);
  if (remainingSectionsPromise && typeof remainingSectionsPromise.then === "function") {
    remainingSectionsPromise.then(setupPage82PdfLayout);
  }

  function setupPages83100Standard() {
    if (pageNumber < 83 || pageNumber > 100) return;
    page.classList.add("batch83100-reviewed");

    const responseRows = {
      pg083_sec002_response_01: 4,
      pg084_sec001_response_01: 2,
      pg084_sec001_response_02: 2,
      pg084_sec002_response_01: 3,
      pg085_sec001_response_01: 4,
      pg085_sec001_response_02: 5,
      pg086_sec001_response_01: 3,
      pg086_sec001_response_02: 5,
      pg086_sec002_response_01: 3,
      pg087_sec001_response_01: 2,
      pg087_sec001_response_02: 4,
      pg087_sec001_response_03: 2,
      pg087_sec001_response_04: 4,
      pg088_sec002_response_01: 3,
      pg088_sec002_response_02: 3,
      pg090_sec001_response_01: 6,
      pg090_sec001_response_02: 3,
      pg090_sec002_response_01: 6,
      pg091_sec001_response_01: 4,
      pg092_sec001_response_01: 5,
      pg094_sec001_response_01: 3,
      pg095_sec001_response_01: 6,
      pg096_sec002_response_01: 8,
      pg097_sec001_response_01: 4,
      pg097_sec001_response_02: 8,
      pg098_sec001_response_01: 8,
      pg099_sec002_response_01: 5,
      pg100_sec001_response_01: 5,
      pg100_sec002_response_01: 5
    };

    Object.entries(responseRows).forEach(function (entry) {
      const card = page.querySelector('[data-response-id="' + entry[0] + '"]');
      if (!card) return;
      card.style.setProperty("--batch-answer-rows", String(entry[1]));
      card.classList.add("batch83100-notebook-card");
    });

    page.querySelectorAll(".page-submit-action,.submit-response,.response-feedback,.response-status").forEach(function (node) {
      node.hidden = true;
    });
    page.querySelectorAll(".printed-page-number,.page-footer").forEach(function (node) {
      node.hidden = true;
    });

    const buildNotebookField = function (anchorId, className, storageKey, rows, label) {
      if (page.querySelector("." + className)) return;
      const anchor = page.querySelector('[data-id="' + anchorId + '"]');
      if (!anchor) return;
      const field = document.createElement("section");
      field.className = "batch83100-added-field " + className;
      field.style.setProperty("--batch-answer-rows", String(rows));
      field.setAttribute("aria-label", label);
      const sheet = document.createElement("div");
      sheet.className = "batch83100-notebook-sheet";
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = rows * 105;
      canvas.setAttribute("aria-label", label + ". Andika kwa mkono kwenye mistari.");
      sheet.appendChild(canvas);
      const actions = document.createElement("div");
      actions.className = "batch83100-field-actions";
      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "clear-response";
      clear.textContent = "Futa";
      actions.appendChild(clear);
      field.append(sheet, actions);
      anchor.insertAdjacentElement("afterend", field);

      const context = canvas.getContext("2d");
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 4;
      context.strokeStyle = "#163f4d";
      let drawing = false;
      const point = function (event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
      };
      canvas.addEventListener("pointerdown", function (event) {
        drawing = true;
        canvas.setPointerCapture(event.pointerId);
        const start = point(event);
        context.beginPath();
        context.moveTo(start.x, start.y);
        event.preventDefault();
      });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing) return;
        const next = point(event);
        context.lineTo(next.x, next.y);
        context.stroke();
        event.preventDefault();
      });
      const save = function () {
        drawing = false;
        try { localStorage.setItem(storageKey, canvas.toDataURL("image/png")); } catch (_) {}
      };
      canvas.addEventListener("pointerup", save);
      canvas.addEventListener("pointercancel", save);
      clear.addEventListener("click", function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
        try { localStorage.removeItem(storageKey); } catch (_) {}
      });
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const image = new Image();
          image.onload = function () { context.drawImage(image, 0, 0, canvas.width, canvas.height); };
          image.src = saved;
        }
      } catch (_) {}
    };

    if (pageNumber === 92) {
      buildNotebookField("pg092_s001_n0013", "page92-exercise-three-answer", "pg092_exercise_three_answer", 5, "Sehemu ya kujibu Zoezi la tatu");

      const fillInLines = [
        ["pg092_s002_n0008", "1. Kuku wa dada ametaga ", "."],
        ["pg092_s002_n0009", "2. Dogoli amevaa ", " na soksi."],
        ["pg092_s002_n0010", "3. Bakari amekunywa chai yenye ", "."],
        ["pg092_s002_n0011", "4. Mama amenunua ", " la kulimia."],
        ["pg092_s002_n0012", "5. Malima amefunga mlango kwa ", "."]
      ];
      fillInLines.forEach(function (item, index) {
        const line = page.querySelector('[data-id="' + item[0] + '"]');
        if (!line || line.dataset.inlineWritingReady === "true") return;
        line.dataset.inlineWritingReady = "true";
        line.classList.add("page92-inline-fill-line");
        line.replaceChildren(document.createTextNode(item[1]));
        const answer = document.createElement("input");
        answer.type = "text";
        answer.className = "page92-inline-answer";
        answer.autocomplete = "off";
        answer.spellcheck = false;
        answer.setAttribute("aria-label", "Andika jibu la nafasi ya " + (index + 1));
        answer.setAttribute("placeholder", "");
        const key = "pg092_exercise_four_blank_" + (index + 1);
        try { answer.value = localStorage.getItem(key) || ""; } catch (_) {}
        answer.addEventListener("input", function () {
          try { localStorage.setItem(key, answer.value); } catch (_) {}
        });
        line.appendChild(answer);
        line.appendChild(document.createTextNode(item[2]));
      });

      const lastFillLine = page.querySelector('[data-id="pg092_s002_n0012"]');
      if (lastFillLine && !page.querySelector(".page92-inline-clear")) {
        const actions = document.createElement("div");
        actions.className = "page92-inline-actions";
        const clearAll = document.createElement("button");
        clearAll.type = "button";
        clearAll.className = "clear-response page92-inline-clear";
        clearAll.textContent = "Futa";
        clearAll.addEventListener("click", function () {
          page.querySelectorAll(".page92-inline-answer").forEach(function (answer, index) {
            answer.value = "";
            try { localStorage.removeItem("pg092_exercise_four_blank_" + (index + 1)); } catch (_) {}
          });
        });
        actions.appendChild(clearAll);
        lastFillLine.insertAdjacentElement("afterend", actions);
      }
    }


    if (pageNumber === 93) {
      // The original PDF uses only the five dotted blanks on this page.
    }
    if (pageNumber === 83) {
      const lessonLine = page.querySelector('[data-id="pg083_s002_n0004"]');
      const boldLetterLine = page.querySelector('[data-id="pg083_s002_n0005"]');
      const letterList = page.querySelector('[data-id="pg083_s002_n0007"]');
      const exampleLabel = page.querySelector('[data-id="pg083_s002_n0008"]');
      if (lessonLine) lessonLine.textContent = "zinazoungwa upande wa kushoto tu. Herufi hizo ni";
      if (boldLetterLine) {
        boldLetterLine.innerHTML = "<strong>b, g, j, o, p</strong> na <strong>y</strong>.";
      }
      if (letterList) {
        letterList.textContent = "b     g     j     o     p  na  y";
        letterList.classList.add("page83-letter-list");
      }
      if (exampleLabel) exampleLabel.classList.add("page83-example-label");
      if (exampleLabel && !page.querySelector(".page83-pdf-model-block")) {
        const modelBlock = document.createElement("div");
        modelBlock.className = "page83-pdf-model-block";
        ["b", "g", "y", "o"].forEach(function (letter) {
          const row = document.createElement("div");
          row.className = "page83-pdf-model-row page83-letter-" + letter;
          row.setAttribute("aria-label", "Mfano wa herufi " + letter);
          for (let index = 0; index < 9; index += 1) {
            const span = document.createElement("span");
            span.textContent = letter;
            row.appendChild(span);
          }
          modelBlock.appendChild(row);
        });
        exampleLabel.insertAdjacentElement("afterend", modelBlock);
      }
    }
    if (pageNumber === 84) {
      const firstLetterList = page.querySelector('[data-id="pg084_s002_n0006"]');
      const secondLetterList = page.querySelector('[data-id="pg084_s002_n0008"]');
      const exampleLabel84 = page.querySelector('[data-id="pg084_s002_n0009"]');
      [firstLetterList, secondLetterList].forEach(function (line) {
        if (line) {
          line.innerHTML = "<strong>a, ch, d, e, h, i, k, l, m, n, t, r, u, v, w</strong>";
        }
      });
      if (exampleLabel84) exampleLabel84.classList.add("page83-example-label");
      if (exampleLabel84 && !page.querySelector(".page84-pdf-model-block")) {
        const modelBlock84 = document.createElement("div");
        modelBlock84.className = "page84-pdf-model-block";
        [
          ["a", "ch", "d", "e", "h", "i", "k", "l"],
          ["m", "n", "t", "r", "u", "v", "w"]
        ].forEach(function (letters) {
          const row = document.createElement("div");
          row.className = "page83-pdf-model-row page84-pdf-model-row";
          row.setAttribute("aria-label", "Mfano wa herufi " + letters.join(", "));
          letters.forEach(function (letter) {
            const span = document.createElement("span");
            span.textContent = letter;
            row.appendChild(span);
          });
          modelBlock84.appendChild(row);
        });
        exampleLabel84.insertAdjacentElement("afterend", modelBlock84);
      }
    }
    if (pageNumber === 85) {
      const instruction85 = page.querySelector('[data-id="pg085_s001_n0003"]');
      const exampleLabel85 = page.querySelector('[data-id="pg085_s001_n0004"]');
      if (instruction85) {
        instruction85.innerHTML = 'kwenda kulia. <strong>e, h, i, k, r, u</strong>';
      }
      if (exampleLabel85) exampleLabel85.classList.add("page83-example-label");
      if (exampleLabel85 && !page.querySelector(".page85-pdf-model-block")) {
        const modelBlock85 = document.createElement("figure");
        modelBlock85.className = "page85-pdf-model-block";
        const modelImage85 = document.createElement("img");
        modelImage85.className = "page85-pdf-model-image";
        modelImage85.src = "images/pg085_second_model_pdf.png?v=4";
        modelImage85.alt = "Mfano wa PDF wa kuunganisha herufi e, h, k, r na u.";
        modelBlock85.appendChild(modelImage85);
        exampleLabel85.insertAdjacentElement("afterend", modelBlock85);
      }
    }
    if (pageNumber === 94) {
      const image94a = document.querySelector('img[data-id="pg094_im001"]');
      const image94b = document.querySelector('img[data-id="pg094_im002"]');
      if (image94a) image94a.alt = "Mwanamke aliyevaa kitambaa chekundu kichwani anashika jani la mmea wa mahindi. Mwanamume aliyevaa kofia anaangalia mimea kutoka upande mwingine wa shamba.";
      if (image94b) image94b.alt = "Mwanamume na mwanamke wamesimama kwenye udongo mwekundu wakitumia majembe kulima. Nyuma yao kuna mimea ya ndizi, miti na nyumba yenye paa la rangi nyekundu.";
    }
    if (pageNumber === 95) {
      function setupPage95PdfLayout() {
        var title = page.querySelector('[data-id="pg095_s001_n0001"]');
        var card = page.querySelector('[data-response-id="pg095_sec001_response_01"]');
        var image1 = page.querySelector('img[data-id="pg095_im001"]');
        var image2 = page.querySelector('img[data-id="pg095_im002"]');
        var image3 = page.querySelector('img[data-id="pg095_im003"]');
        var label1 = page.querySelector('[data-id="pg095_s001_n0004"]');
        var label2 = page.querySelector('[data-id="pg095_s001_n0005"]');
        var label3 = page.querySelector('[data-id="pg095_s001_n0006"]');
        if (!title || !card || !image1 || !image2 || !image3 || !label1 || !label2 || !label3) return;
        image1.alt = "Picha ya kwanza: Wanafunzi wawili wenye mabegi wamesimama kando ya barabara wakisubiri basi linalokaribia.";
        image2.alt = "Picha ya pili: Basi limefika kituoni. Dereva yuko mbele, abiria wanasubiri ndani na mtu anashuka; askari wa usalama anaangalia basi.";
        image3.alt = "Picha ya tatu: Basi limesimama karibu na jengo lenye maandishi KITUO CHA POLISI. Askari na wanaume wawili wanatembea kuelekea kituoni.";
        page.classList.add("page95-pdf-layout");
        if (title.parentElement !== card) card.prepend(title);
        [[label1, image1], [label2, image2], [label3, image3]].forEach(function (pair) {
          var figure = pair[1].closest("figure");
          if (figure && figure.previousElementSibling !== pair[0]) figure.before(pair[0]);
        });
      }
      setupPage95PdfLayout();
      requestAnimationFrame(setupPage95PdfLayout);
      setTimeout(setupPage95PdfLayout, 350);
      setTimeout(setupPage95PdfLayout, 1100);
      if (remainingSectionsPromise && typeof remainingSectionsPromise.then === "function") remainingSectionsPromise.then(setupPage95PdfLayout);
    }    if (pageNumber === 88) {
      const sentenceIds = ["pg088_s001_n0001", "pg088_s001_n0002", "pg088_s001_n0003", "pg088_s001_n0004"];
      sentenceIds.forEach(function (id) {
        const sentence = page.querySelector('[data-id="' + id + '"]');
        if (sentence) sentence.classList.add("page88-sentence-list-item");
      });

      const lessonLabel = page.querySelector('[data-id="pg088_s002_n0001"]');
      const lessonHeading = page.querySelector('[data-id="pg088_s002_n0002"]');
      const introFirst = page.querySelector('[data-id="pg088_s002_n0003"]');
      const introSecond = page.querySelector('[data-id="pg088_s002_n0004"]');
      const copyPrompt = page.querySelector('[data-id="pg088_s002_n0005"]');
      const sRow = page.querySelector('[data-id="pg088_s002_n0006"]');
      const zRow = page.querySelector('[data-id="pg088_s002_n0007"]');
      const exerciseLabel = page.querySelector('[data-id="pg088_s002_n0008"]');
      const exercisePrompt = page.querySelector('[data-id="pg088_s002_n0009"]');
      const exercisePromptTail = page.querySelector('[data-id="pg088_s002_n0010"]');

      if (lessonLabel) lessonLabel.classList.add("page88-lesson-label");
      if (lessonHeading) lessonHeading.classList.add("page88-lesson-heading");
      if (introFirst) introFirst.textContent = "Katika somo hili utajifunza kuandika herufi ambazo";
      if (introSecond) introSecond.innerHTML = 'haziungwi. Herufi ambazo haziungwi ni <strong>f, s na z</strong>';
      if (copyPrompt) copyPrompt.textContent = "Nakili herufi hizi katika daftari lako.";

      if (sRow && !page.querySelector(".page88-letter-f")) {
        const fRow = document.createElement("p");
        fRow.className = "source-line source-heading page88-letter-row page88-letter-f";
        fRow.textContent = "f f f f f f f f f f";
        sRow.insertAdjacentElement("beforebegin", fRow);
      }
      if (sRow) sRow.classList.add("page88-letter-row", "page88-letter-s");
      if (zRow) zRow.classList.add("page88-letter-row", "page88-letter-z");
      if (exerciseLabel) exerciseLabel.classList.add("page88-exercise-label");
      if (exercisePrompt) {
        exercisePrompt.innerHTML = 'Andika silabi <strong>fa, se,</strong> na <strong>zu.</strong> Hakikisha kila silabi inajaa katika mstari wake kwa usahihi.';
      }
      if (exercisePromptTail) exercisePromptTail.hidden = true;
    }
    if (pageNumber === 89) {
      const exampleLabel89 = page.querySelector('[data-id="pg089_s002_n0006"]');
      const oldTableLines = [
        "pg089_s002_n0007", "pg089_s002_n0008", "pg089_s002_n0009",
        "pg089_s002_n0010", "pg089_s002_n0011", "pg089_s002_n0012",
        "pg089_s002_n0013", "pg089_s002_n0014", "pg089_s002_n0015",
        "pg089_s002_n0016"
      ];
      oldTableLines.forEach(function (id) {
        const line = page.querySelector('[data-id="' + id + '"]');
        if (line) line.hidden = true;
      });
      if (exampleLabel89) exampleLabel89.classList.add("page89-example-label");
      if (exampleLabel89 && !page.querySelector(".page89-table-wrap")) {
        const pairs = [
          ["1. Ninakwenda shuleni.", "1. Ninaamka asubuhi na mapema."],
          ["2. Ninakunywa uji.", "2. Ninapiga mswaki na kuoga."],
          ["3. Ninaamka asubuhi na mapema.", "3. Ninavaa sare ya shule."],
          ["4. Ninavaa sare ya shule.", "4. Ninakunywa uji."],
          ["5. Ninapiga mswaki na kuoga.", "5. Ninakwenda shuleni."]
        ];
        const wrap = document.createElement("div");
        wrap.className = "page89-table-wrap";
        const table = document.createElement("table");
        table.className = "page89-sentence-table";
        table.setAttribute("aria-label", "Mfano wa sentensi zilizochanganywa na sentensi zilizopangwa");
        const head = document.createElement("thead");
        const headRow = document.createElement("tr");
        ["Sentensi zilizochanganywa", "Sentensi zilizopangwa"].forEach(function (text) {
          const th = document.createElement("th");
          th.scope = "col";
          th.textContent = text;
          headRow.appendChild(th);
        });
        head.appendChild(headRow);
        const body = document.createElement("tbody");
        pairs.forEach(function (pair) {
          const row = document.createElement("tr");
          pair.forEach(function (text) {
            const cell = document.createElement("td");
            cell.textContent = text;
            row.appendChild(cell);
          });
          body.appendChild(row);
        });
        table.append(head, body);
        wrap.appendChild(table);
        exampleLabel89.insertAdjacentElement("afterend", wrap);
      }
    }
  }

  setupPages83100Standard();
  requestAnimationFrame(setupPages83100Standard);
  setTimeout(setupPages83100Standard, 350);
  setTimeout(setupPages83100Standard, 1100);
  if (remainingSectionsPromise && typeof remainingSectionsPromise.then === "function") {
    remainingSectionsPromise.then(setupPages83100Standard);
  }
})();
