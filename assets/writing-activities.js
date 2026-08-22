(function () {
  "use strict";
  const KEY = "kuandika-mwaka-1-responses:" + location.pathname;
  let state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));

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
  const controllers = Array.from(document.querySelectorAll(".response-card")).map(setupCard);
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
