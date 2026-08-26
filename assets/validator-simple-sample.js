(function () {
  "use strict";

  function copyGuidePositions(image, target, startFraction, spanFraction) {
    if (!image || !target || !image.naturalWidth || !image.naturalHeight) return;
    const scan = document.createElement("canvas");
    scan.width = image.naturalWidth;
    scan.height = image.naturalHeight;
    const context = scan.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, scan.width, scan.height).data;
    const rows = [];
    for (let y = 0; y < scan.height; y += 1) {
      let dark = 0;
      for (let x = 0; x < scan.width; x += 1) {
        const offset = (y * scan.width + x) * 4;
        if (pixels[offset] < 160 && pixels[offset + 1] < 160 && pixels[offset + 2] < 160) dark += 1;
      }
      if (dark > scan.width * 0.65) rows.push(y);
    }

    const groups = [];
    rows.forEach(function (row) {
      const last = groups[groups.length - 1];
      if (!last || row > last[last.length - 1] + 1) groups.push([row]);
      else last.push(row);
    });

    const start = startFraction || 0;
    const span = spanFraction || 1;
    const end = start + span;
    const guides = groups
      .map(function (group) { return (group[0] + group[group.length - 1]) / 2 / scan.height; })
      .filter(function (position) { return position >= start && position <= end; })
      .slice(0, 4)
      .map(function (position) { return ((position - start) / span) * 100; });

    if (guides.length === 4) {
      guides.forEach(function (position, index) {
        target.style.setProperty("--guide-" + (index + 1), position.toFixed(2) + "%");
      });
    }
  }

  function prepareBookLikeFields() {
    const cards = Array.from(document.querySelectorAll(".response-card"));
    cards.forEach(function (card) {
      const prompt = (card.querySelector(".source-line")?.textContent || "").trim();
      const wrap = card.querySelector(".trace-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;

      const figure = card.querySelector("figure.practice-model");
      const modelImage = figure && figure.querySelector("img");

      /* On the vowel-writing page, "Chora" means copy the handwriting
         model on matching notebook guides, not draw on an empty board. */
      const modelDescription = modelImage?.getAttribute("data-adt-description") || modelImage?.alt || "";
      if (/^Chora\b/i.test(prompt) && (
        modelImage?.dataset.id === "pg009_im002" ||
        /mwandiko unaorudia herufi/i.test(modelDescription)
      )) {
        figure.classList.add("book-example-model");
        wrap.classList.add("book-answer-field", "book-answer-short", "book-handwriting-copy-field");
        const setAnswerRatio = function () {
          if (modelImage.naturalWidth && modelImage.naturalHeight) {
            wrap.style.setProperty("--book-answer-aspect", modelImage.naturalWidth + " / " + modelImage.naturalHeight);
            copyGuidePositions(modelImage, wrap, 0, 1);
          }
        };
        setAnswerRatio();
        if (!modelImage.complete) modelImage.addEventListener("load", setAnswerRatio, { once: true });
        return;
      }

      if (/^Chora\b/i.test(prompt)) {
        card.classList.add("book-drawing-board");
        return;
      }

      if (/irabu zinazokosekana/i.test(prompt)) {
        const wordLines = Array.from(card.querySelectorAll(".source-line")).filter(function (line) {
          return !line.classList.contains("question-prompt");
        });
        if (wordLines.length) {
          const stage = document.createElement("div");
          stage.className = "book-inline-fill-stage";
          wordLines[0].parentElement.insertBefore(stage, wordLines[0]);
          wordLines.forEach(function (line) { stage.appendChild(line); });
          stage.appendChild(wrap);
          wrap.classList.add("book-inline-fill-overlay");
          return;
        }
      }

      if (figure) {
        const figures = Array.from(card.querySelectorAll("figure.practice-model"));
        const page15Order = ["pg015_im002", "pg015_im001", "pg015_im003"];
        const page17Order = ["pg017_im003", "pg017_im001", "pg017_im002"];
        if (figures.some(function (model) { return page15Order.includes(model.querySelector("img")?.dataset.id); })) {
          figures.sort(function (left, right) {
            return page15Order.indexOf(left.querySelector("img")?.dataset.id) - page15Order.indexOf(right.querySelector("img")?.dataset.id);
          });
        } else if (figures.some(function (model) { return page17Order.includes(model.querySelector("img")?.dataset.id); })) {
          figures.sort(function (left, right) {
            return page17Order.indexOf(left.querySelector("img")?.dataset.id) - page17Order.indexOf(right.querySelector("img")?.dataset.id);
          });
        }
        if (/majina ya picha/i.test(prompt) && figures.length > 1) {
          const stage = document.createElement("div");
          stage.className = "book-image-label-stage";
          const grid = document.createElement("div");
          grid.className = "book-image-label-grid";
          if (figures.some(function (model) { return page17Order.includes(model.querySelector("img")?.dataset.id); })) {
            grid.classList.add("book-image-label-three");
          }
          figure.parentElement.insertBefore(stage, figure);

          figures.forEach(function (model, index) {
            const item = document.createElement("div");
            item.className = "book-image-label-item";
            if (!grid.classList.contains("book-image-label-three") && figures.length % 2 === 1 && index === figures.length - 1) {
              item.classList.add("book-image-label-wide");
            }
            item.appendChild(model);
            const answer = document.createElement("div");
            answer.className = "book-image-label-line";
            answer.setAttribute("aria-hidden", "true");
            item.appendChild(answer);
            grid.appendChild(item);
          });

          stage.append(grid, wrap);
          wrap.classList.add("book-image-label-overlay");
          return;
        }

        if (/^Fuatisha\b/i.test(prompt)) {
          if (figure.parentElement !== wrap) wrap.insertBefore(figure, canvas);
          wrap.classList.add("book-inline-field", "book-image-field", "book-trace-field");
          const image = figure.querySelector("img");
          const setRatio = function () {
            if (image && image.naturalWidth && image.naturalHeight) {
              wrap.style.setProperty("--book-field-aspect", image.naturalWidth + " / " + image.naturalHeight);
            }
          };
          setRatio();
          if (image && !image.complete) image.addEventListener("load", setRatio, { once: true });
        } else if (/sentensi/i.test(prompt)) {
          const image = figure.querySelector("img");
          const sequence = document.createElement("div");
          sequence.className = "book-sentence-sequence";
          const sentenceAnswers = [];
          const setSentenceRatio = function () {
            if (image && image.naturalWidth && image.naturalHeight) {
              sequence.style.setProperty("--sentence-slice-aspect", image.naturalWidth + " / " + (image.naturalHeight * 0.46));
              sentenceAnswers.forEach(function (answer, index) {
                copyGuidePositions(image, answer, index === 0 ? 0 : 0.45, 0.46);
              });
            }
          };
          setSentenceRatio();
          if (image && !image.complete) image.addEventListener("load", setSentenceRatio, { once: true });
          for (let index = 0; index < 2; index += 1) {
            const slice = document.createElement("div");
            slice.className = "book-sentence-model-slice";
            slice.style.setProperty("--sentence-index", String(index));
            const clone = image.cloneNode(true);
            clone.removeAttribute("data-id");
            clone.alt = "";
            clone.setAttribute("aria-hidden", "true");
            slice.appendChild(clone);

            const answerLines = document.createElement("div");
            answerLines.className = "book-sentence-answer-lines";
            sentenceAnswers.push(answerLines);
            sequence.append(slice, answerLines);
          }
          setSentenceRatio();
          figure.hidden = true;
          wrap.classList.add("book-stacked-answer-field");
          wrap.insertBefore(sequence, canvas);
        } else {
          figure.classList.add("book-example-model");
          wrap.classList.add("book-answer-field");
          if (/\b(aya|hadithi|habari|barua)\b/i.test(prompt)) wrap.classList.add("book-answer-long");
          else {
            wrap.classList.add("book-answer-short");
            const image = figure.querySelector("img");
            const setAnswerRatio = function () {
              if (image && image.naturalWidth && image.naturalHeight) {
                wrap.style.setProperty("--book-answer-aspect", image.naturalWidth + " / " + image.naturalHeight);
                copyGuidePositions(image, wrap, 0, 1);
              }
            };
            setAnswerRatio();
            if (image && !image.complete) image.addEventListener("load", setAnswerRatio, { once: true });
          }
        }
        return;
      }

      const letterModel = card.querySelector(".trace-letter-model");
      if (letterModel) {
        wrap.classList.add("book-inline-field", "book-copy-field");
        letterModel.setAttribute("aria-label", "Mfano mmoja wa herufi; endelea kuandika kwenye nafasi zilizobaki.");
        const caption = card.querySelector(".sample-model-caption");
        if (caption) caption.hidden = true;
        return;
      }

      const textModel = card.querySelector(".handwriting-model");
      if (textModel) {
        textModel.classList.add("book-field-model");
        wrap.classList.add("book-inline-field", "book-syllable-field");
        wrap.insertBefore(textModel, canvas);
      }
    });
  }

  function formatVowelContent() {
    const vowelLine = document.querySelector('[data-id="pg009_s002_n0004"]');
    if (vowelLine && !vowelLine.querySelector(".vowel-sequence")) {
      const sequence = document.createElement("strong");
      sequence.className = "vowel-sequence";
      ["a", "e", "i", "o", "u"].forEach(function (vowel) {
        const item = document.createElement("span");
        item.textContent = vowel;
        sequence.appendChild(item);
      });
      vowelLine.replaceChildren(document.createTextNode("Herufi za irabu hizo ni "), sequence, document.createTextNode("."));
    }

    function formatTrailingVowel(id, expectedVowel) {
      const line = document.querySelector('[data-id="' + id + '"]');
      if (!line || line.querySelector(".vowel-focus")) return;
      const cleanText = line.textContent.replace(/\s+\./g, ".").trim();
      const match = cleanText.match(/^(.*\s)([aeiou])(\.)?$/i);
      if (!match || match[2].toLowerCase() !== expectedVowel) return;
      const focus = document.createElement("strong");
      focus.className = "vowel-focus";
      focus.textContent = match[2];
      line.replaceChildren(document.createTextNode(match[1]), focus, document.createTextNode(match[3] || ""));
    }

    function formatFixedVowelLine(id, prefix, vowel, suffix) {
      const line = document.querySelector('[data-id="' + id + '"]');
      if (!line || line.querySelector(".vowel-focus")) return;
      const focus = document.createElement("strong");
      focus.className = "vowel-focus";
      focus.textContent = vowel;
      line.replaceChildren(document.createTextNode(prefix), focus, document.createTextNode(suffix || ""));
    }

    ["pg009_s002_n0005", "pg009_s002_n0007"].forEach(function (id) {
      formatTrailingVowel(id, "a");
    });
    ["pg010_s001_n0003", "pg010_s001_n0004", "pg010_s001_n0006"].forEach(function (id) {
      formatTrailingVowel(id, "e");
    });
    formatFixedVowelLine("pg011_s001_n0002", "Kuandika herufi ya irabu ", "i", "");
    formatFixedVowelLine("pg011_s001_n0003", "Katika somo hili utajifunza kuandika herufi ya irabu ", "i", ".");
    formatFixedVowelLine("pg011_s002_n0002", "Kuandika herufi ya irabu ", "o", "");
    formatFixedVowelLine("pg011_s002_n0005", "Katika somo hili utajifunza kuandika herufi ya irabu ", "o", ".");
    formatFixedVowelLine("pg012_s001_n0002", "Fuatisha herufi ya irabu ", "o", ".");
    formatFixedVowelLine("pg012_s002_n0002", "Kuandika herufi ya irabu ", "u", "");
    formatFixedVowelLine("pg012_s002_n0004", "Katika somo hili utajifunza kuandika herufi ya irabu ", "u", ".");
  }

  formatVowelContent();
  const contentRoot = document.getElementById("content");
  if (contentRoot) {
    const vowelFormatterObserver = new MutationObserver(function () {
      formatVowelContent();
      customizePage13();
      customizePage14();
      customizePage15();
      customizePage16();
      customizePage23();
      customizePage25();
    });
    vowelFormatterObserver.observe(contentRoot, { childList: true, subtree: true });
  }
  prepareBookLikeFields();

  function customizePage13() {
    const page = document.querySelector('[data-section-id="pg013_sec001"]');
    if (!page) return;

    const uCard = page.querySelector('[data-response-id="pg013_sec001_response_01"]');
    if (uCard && !uCard.querySelector(".page13-u-sequence")) {
      const wrap = uCard.querySelector(".handwriting-canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (wrap && canvas) {
        wrap.classList.remove("book-inline-field", "book-copy-field", "trace-canvas-wrap", "model-writing-wrap");
        wrap.removeAttribute("style");
        wrap.classList.add("page13-u-practice");
        const sequence = document.createElement("div");
        sequence.className = "page13-u-sequence";
        const model = document.createElement("img");
        model.className = "page13-u-model";
        model.src = "images/pg013_u_model.png";
        model.alt = "Mfano wa kuandika herufi ya irabu u.";
        const answer = document.createElement("div");
        answer.className = "page13-word-answer";
        answer.dataset.word = "u";
        answer.setAttribute("aria-hidden", "true");
        sequence.append(model, answer);
        wrap.replaceChildren(sequence, canvas);
      }
    }

    const intro = page.querySelector('[data-id="pg013_s001_n0004"]');
    if (intro && !intro.querySelector(".page13-vowel-words")) {
      const words = document.createElement("strong");
      words.className = "page13-vowel-words";
      words.textContent = "ua   oa   au";
      intro.replaceChildren(
        document.createTextNode("Katika somo hili utajifunza kuandika maneno kwa kutumia herufi za irabu. Maneno hayo ni "),
        words,
        document.createTextNode(".")
      );
    }
    ["pg013_s001_n0005", "pg013_s001_n0006", "pg013_s001_n0011"].forEach(function (id) {
      const fragment = page.querySelector('[data-id="' + id + '"]');
      if (fragment) fragment.classList.add("book-merged-source-line");
    });

    const wordsCard = page.querySelector('[data-response-id="pg013_sec001_response_02"]');
    if (wordsCard && !wordsCard.querySelector(".page13-word-sequence")) {
      const figure = wordsCard.querySelector("figure");
      const wrap = wordsCard.querySelector(".canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (figure && wrap && canvas) {
        figure.classList.add("page13-original-model");
        wrap.classList.remove("book-answer-field", "book-answer-short", "canvas-wrap", "handwriting-canvas-wrap");
        wrap.removeAttribute("style");
        wrap.classList.add("page13-word-practice");
        const sequence = document.createElement("div");
        sequence.className = "page13-word-sequence";
        [
          ["ua", "images/pg013_ua_model.png"],
          ["oa", "images/pg013_oa_model.png"],
          ["au", "images/pg013_au_model.png"]
        ].forEach(function (item) {
          const block = document.createElement("div");
          block.className = "page13-word-block";
          const model = document.createElement("img");
          model.className = "page13-word-model";
          model.src = item[1];
          model.alt = "Mfano wa kuandika " + item[0] + ".";
          const answer = document.createElement("div");
          answer.className = "page13-word-answer";
          answer.dataset.word = item[0];
          answer.setAttribute("aria-hidden", "true");
          block.append(model, answer);
          sequence.appendChild(block);
        });
        wrap.replaceChildren(sequence, canvas);
      }
    }

    const flowerCard = page.querySelector('[data-response-id="pg013_sec001_response_03"]');
    if (flowerCard && !flowerCard.querySelector(".page13-flower-practice")) {
      const figure = flowerCard.querySelector("figure");
      const wrap = flowerCard.querySelector(".canvas-wrap");
      if (figure && wrap) {
        wrap.classList.remove("book-answer-field", "book-answer-short");
        wrap.classList.add("page13-flower-answer");
        const practice = document.createElement("div");
        practice.className = "page13-flower-practice";
        figure.before(practice);
        practice.append(figure, wrap);
      }
    }

    const missingPrompt = page.querySelector('[data-id="pg013_s001_n0010"]');
    if (missingPrompt && missingPrompt.textContent.trim() !== "2. Andika herufi zinazokosekana katika maneno haya.") {
      missingPrompt.textContent = "2. Andika herufi zinazokosekana katika maneno haya.";
    }
    const missingPattern = page.querySelector('[data-id="pg013_s001_n0012"]');
    if (missingPattern && !missingPattern.querySelector(".page13-gap")) {
      missingPattern.classList.add("page13-missing-pattern");
      missingPattern.replaceChildren();
      ["u __", "__a", "a __"].forEach(function (value) {
        const gap = document.createElement("span");
        gap.className = "page13-gap";
        gap.textContent = value;
        missingPattern.appendChild(gap);
      });
    }
    const missingWrap = page.querySelector('[data-response-id="pg013_sec001_response_04"] .canvas-wrap');
    if (missingWrap) {
      missingWrap.classList.add("page13-missing-answer");
      if (!missingWrap.querySelector(".page13-missing-box-row")) {
        const canvas = missingWrap.querySelector("canvas");
        if (canvas) {
          const row = document.createElement("div");
          row.className = "page13-missing-box-row";
          [
            ["u", ""],
            ["", "a"],
            ["a", ""]
          ].forEach(function (parts) {
            const item = document.createElement("div");
            item.className = "page13-missing-box-item";
            if (parts[0]) {
              const prefix = document.createElement("strong");
              prefix.textContent = parts[0];
              item.appendChild(prefix);
            }
            const box = document.createElement("span");
            box.className = "page13-mini-input";
            box.setAttribute("aria-hidden", "true");
            item.appendChild(box);
            if (parts[1]) {
              const suffix = document.createElement("strong");
              suffix.textContent = parts[1];
              item.appendChild(suffix);
            }
            row.appendChild(item);
          });
          missingWrap.replaceChildren(row, canvas);
        }
      }
    }
    if (missingPattern) missingPattern.classList.add("sr-only");

    const activityLabel = page.querySelector('[data-id="pg013_s001_n0008"]');
    const flowerActivity = page.querySelector('[data-response-id="pg013_sec001_response_03"]');
    const missingActivity = page.querySelector('[data-response-id="pg013_sec001_response_04"]');
    if (activityLabel && flowerActivity && missingActivity && !page.querySelector(".page13-exercise-panel")) {
      const panel = document.createElement("div");
      panel.className = "page13-exercise-panel";
      activityLabel.before(panel);
      panel.append(activityLabel, flowerActivity, missingActivity);
    }
  }

  customizePage13();

  function customizePage14() {
    const page = document.querySelector('[data-section-id="pg014_sec001"]');
    if (!page) return;

    function formatConsonantLine(id, prefix, letter, suffix) {
      const line = page.querySelector('[data-id="' + id + '"]');
      if (!line || line.querySelector(".consonant-focus")) return;
      const focus = document.createElement("strong");
      focus.className = "consonant-focus";
      focus.textContent = letter;
      line.replaceChildren(document.createTextNode(prefix), focus, document.createTextNode(suffix || ""));
    }

    formatConsonantLine(
      "pg014_s002_n0003",
      "Katika somo hili utajifunza kuandika herufi ya konsonanti ",
      "b",
      "."
    );
    const introFragment = page.querySelector('[data-id="pg014_s002_n0004"]');
    if (introFragment) introFragment.classList.add("book-merged-source-line");
    formatConsonantLine("pg014_s002_n0006", "Fuatisha herufi ya konsonanti ", "b", ".");

    const copyCard = page.querySelector('[data-response-id="pg014_sec002_response_01"]');
    if (copyCard && !copyCard.querySelector(".page14-answer-only")) {
      const figure = copyCard.querySelector("figure");
      const wrap = copyCard.querySelector(".handwriting-canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (figure && wrap && canvas) {
        figure.classList.add("page14-copy-model");
        wrap.classList.remove("canvas-wrap", "book-answer-field", "book-answer-short");
        wrap.removeAttribute("style");
        wrap.classList.add("page14-answer-only");
        const answer = document.createElement("div");
        answer.className = "page14-answer page14-inset-answer";
        answer.dataset.word = "b";
        answer.setAttribute("aria-hidden", "true");
        wrap.replaceChildren(answer, canvas);
      }
    }

    function buildModelPractice(responseId, source, shadow) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.querySelector(".page14-model-sequence")) return;
      const wrap = card.querySelector(".handwriting-canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      wrap.classList.remove(
        "canvas-wrap",
        "trace-canvas-wrap",
        "model-writing-wrap",
        "book-inline-field",
        "book-copy-field",
        "book-syllable-field"
      );
      wrap.removeAttribute("style");
      wrap.classList.add("page14-model-practice");
      const sequence = document.createElement("div");
      sequence.className = "page14-model-sequence";
      const model = document.createElement("img");
      model.className = "page14-model-image";
      model.src = source;
      model.alt = "Mfano wa kuandika " + shadow + ".";
      const answer = document.createElement("div");
      answer.className = "page14-answer";
      answer.dataset.word = shadow;
      answer.setAttribute("aria-hidden", "true");
      sequence.append(model, answer);
      wrap.replaceChildren(sequence, canvas);
    }

    buildModelPractice("pg014_sec002_response_02", "images/pg014_b_model.png", "b");
    buildModelPractice("pg014_sec002_response_03", "images/pg014_syllables_model.png", "ba");
  }

  customizePage14();

  function customizePage15() {
    const page = document.querySelector('[data-section-id="pg015_sec001"]');
    if (!page) return;

    const wordCard = page.querySelector('[data-response-id="pg015_sec001_response_01"]');
    if (wordCard && !wordCard.querySelector(".page15-model-sequence")) {
      const wrap = wordCard.querySelector(".handwriting-canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (wrap && canvas) {
        wrap.classList.remove("canvas-wrap", "book-inline-field", "book-syllable-field");
        wrap.removeAttribute("style");
        wrap.classList.add("page15-model-practice");
        const sequence = document.createElement("div");
        sequence.className = "page15-model-sequence";
        const model = document.createElement("img");
        model.className = "page15-model-image";
        model.src = "images/pg015_words_model.png";
        model.alt = "Mfano wa kuandika baba, bubu, bua, bibo na beba.";
        const answer = document.createElement("div");
        answer.className = "page14-answer page15-answer";
        answer.dataset.word = "baba";
        answer.setAttribute("aria-hidden", "true");
        sequence.append(model, answer);
        wrap.replaceChildren(sequence, canvas);
      }
    }

    const imageCard = page.querySelector('[data-response-id="pg015_sec001_response_02"]');
    if (imageCard && !imageCard.querySelector(".page15-picture-grid")) {
      const wrap = imageCard.querySelector(".handwriting-canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      const figures = {
        babu: imageCard.querySelector('figure:has([data-id="pg015_im002"])'),
        bibi: imageCard.querySelector('figure:has([data-id="pg015_im001"])'),
        bao: imageCard.querySelector('figure:has([data-id="pg015_im003"])')
      };
      if (wrap && canvas && figures.babu && figures.bibi && figures.bao) {
        const babuImage = figures.babu.querySelector("img");
        const baoImage = figures.bao.querySelector("img");
        if (babuImage) babuImage.src = "images/pg015_im002_clean.png";
        if (baoImage) baoImage.src = "images/pg015_im003_clean.png";
        wrap.classList.remove("canvas-wrap", "book-image-label-overlay");
        wrap.removeAttribute("style");
        wrap.classList.add("page15-picture-practice");
        const grid = document.createElement("div");
        grid.className = "page15-picture-grid";
        [
          ["babu", figures.babu],
          ["bibi", figures.bibi],
          ["bao", figures.bao]
        ].forEach(function (entry) {
          const item = document.createElement("div");
          item.className = "page15-picture-item page15-picture-" + entry[0];
          const box = document.createElement("span");
          box.className = "page15-picture-input";
          box.setAttribute("aria-hidden", "true");
          item.append(entry[1], box);
          grid.appendChild(item);
        });
        wrap.replaceChildren(grid, canvas);
      }
    }

    if (imageCard) {
      const duplicateStage = imageCard.querySelector(".book-image-label-stage");
      const picturePractice = duplicateStage && duplicateStage.querySelector(".page15-picture-practice");
      if (duplicateStage && picturePractice) {
        duplicateStage.before(picturePractice);
        duplicateStage.remove();
      }
    }

    const activityLabel = page.querySelector('[data-id="pg015_s001_n0003"]');
    if (activityLabel && imageCard && !page.querySelector(".page15-exercise-panel")) {
      const panel = document.createElement("div");
      panel.className = "page15-exercise-panel";
      activityLabel.before(panel);
      panel.append(activityLabel, imageCard);
    }
  }

  customizePage15();

  function customizePage16() {
    const page = document.querySelector('[data-section-id="pg016_sec001"]');
    if (!page) return;

    function formatMLine(id, prefix, suffix) {
      const line = page.querySelector('[data-id="' + id + '"]');
      if (!line || line.querySelector(".consonant-focus")) return;
      const focus = document.createElement("strong");
      focus.className = "consonant-focus";
      focus.textContent = "m";
      line.replaceChildren(document.createTextNode(prefix), focus, document.createTextNode(suffix || ""));
    }

    formatMLine("pg016_s001_n0002", "Kuandika herufi ya konsonanti ", "");
    formatMLine("pg016_s001_n0004", "Katika somo hili utajifunza kuandika herufi ya konsonanti ", ".");
    ["pg016_s001_n0003", "pg016_s001_n0005"].forEach(function (id) {
      const fragment = page.querySelector('[data-id="' + id + '"]');
      if (fragment) fragment.classList.add("book-merged-source-line");
    });
    formatMLine("pg016_s001_n0007", "Fuatisha herufi ya konsonanti ", ".");

    const copyCard = page.querySelector('[data-response-id="pg016_sec001_response_01"]');
    if (copyCard && !copyCard.querySelector(".page16-copy-answer")) {
      const figure = copyCard.querySelector("figure");
      const image = figure && figure.querySelector("img");
      const wrap = copyCard.querySelector(".handwriting-canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (figure && image && wrap && canvas) {
        image.src = "images/pg016_m_repeat_model.png";
        figure.classList.add("page14-copy-model");
        wrap.classList.remove(
          "canvas-wrap",
          "book-answer-field",
          "book-answer-short",
          "book-handwriting-copy-field"
        );
        wrap.removeAttribute("style");
        wrap.classList.add("page14-answer-only", "page16-copy-answer");
        const answer = document.createElement("div");
        answer.className = "page14-answer";
        answer.dataset.word = "m";
        answer.setAttribute("aria-hidden", "true");
        wrap.replaceChildren(answer, canvas);
      }
    }

    const traceImage = page.querySelector('[data-response-id="pg016_sec001_response_05"] img');
    if (traceImage) traceImage.src = "images/pg016_trace_m_aligned.png";

    function buildModelPractice(responseId, source, shadow) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.querySelector(".page16-model-sequence")) return;
      const oldFigure = card.querySelector("figure");
      if (oldFigure) oldFigure.classList.add("page16-original-model");
      const wrap = card.querySelector(".handwriting-canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      wrap.classList.remove(
        "canvas-wrap",
        "trace-canvas-wrap",
        "model-writing-wrap",
        "book-inline-field",
        "book-copy-field",
        "book-answer-field",
        "book-answer-short"
      );
      wrap.removeAttribute("style");
      wrap.classList.add("page14-model-practice", "page16-model-practice");
      const sequence = document.createElement("div");
      sequence.className = "page14-model-sequence page16-model-sequence";
      const model = document.createElement("img");
      model.className = "page14-model-image";
      model.src = source;
      model.alt = "Mfano wa kuandika " + shadow + ".";
      const answer = document.createElement("div");
      answer.className = "page14-answer";
      answer.dataset.word = shadow;
      answer.setAttribute("aria-hidden", "true");
      sequence.append(model, answer);
      wrap.replaceChildren(sequence, canvas);
    }

    buildModelPractice("pg016_sec001_response_02", "images/pg016_m_model.png", "m");
    buildModelPractice("pg016_sec001_response_03", "images/pg016_syllables_model_clean.png", "ma");
    buildModelPractice("pg016_sec001_response_04", "images/pg016_words_model_clean.png", "mama");
  }

  customizePage16();

  function customizePage17() {
    const activities = document.querySelector('[data-section-id="pg017_sec001"]');
    const lesson = document.querySelector('[data-section-id="pg017_sec002"]');
    if (!activities || !lesson) return;

    activities.classList.add("page17-activities");
    lesson.classList.add("page17-lesson-intro");

    const pictureCard = activities.querySelector('[data-response-id="pg017_sec001_response_01"]');
    const vowelCard = activities.querySelector('[data-response-id="pg017_sec001_response_02"]');
    if (pictureCard) pictureCard.classList.add("page17-picture-card");
    if (vowelCard) vowelCard.classList.add("page17-vowel-card");

    [
      ["pg017_s001_n0005", "1. m__ma"],
      ["pg017_s001_n0006", "2. mem__"],
      ["pg017_s001_n0007", "3. m__ba"],
      ["pg017_s001_n0008", "4. ba__"],
      ["pg017_s001_n0009", "5. ma__a"]
    ].forEach(function (entry) {
      const line = activities.querySelector('[data-id="' + entry[0] + '"]');
      if (line) line.textContent = entry[1];
    });

    const intro = lesson.querySelector('[data-id="pg017_s002_n0003"]');
    const introEnd = lesson.querySelector('[data-id="pg017_s002_n0004"]');
    if (intro) intro.classList.add("page17-intro-start");
    if (introEnd) {
      introEnd.hidden = false;
      introEnd.classList.add("page17-intro-end");
    }
  }

  customizePage17();
  window.addEventListener("load", customizePage17, { once: true });

  function customizePage18() {
    const page = document.querySelector('[data-section-id="pg018_sec001"]');
    if (!page) return;
    page.classList.add("page18-writing-page");

    const tracePrompt = page.querySelector('[data-id="pg018_s001_n0002"]');
    if (tracePrompt) tracePrompt.textContent = "Fuatisha herufi ya konsonanti d.";

    const copyCard = page.querySelector('[data-response-id="pg018_sec001_response_01"]');
    if (copyCard && !copyCard.querySelector(".page18-copy-answer")) {
      const figure = copyCard.querySelector("figure");
      const wrap = copyCard.querySelector(".handwriting-canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (figure && wrap && canvas) {
        figure.classList.add("page18-copy-model");
        wrap.className = "handwriting-canvas-wrap page14-answer-only page18-copy-answer";
        wrap.removeAttribute("style");
        const answer = document.createElement("div");
        answer.className = "page14-answer page18-answer page18-guide-repeat";
        answer.setAttribute("aria-hidden", "true");
        wrap.replaceChildren(answer, canvas);
      }
    }

    function buildPractice(responseId, source, guideClass, alt) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.querySelector(".page18-model-sequence")) return;
      const wrap = card.querySelector(".handwriting-canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      wrap.className = "handwriting-canvas-wrap page14-model-practice page18-model-practice";
      wrap.removeAttribute("style");
      const sequence = document.createElement("div");
      sequence.className = "page14-model-sequence page18-model-sequence";
      const model = document.createElement("img");
      model.className = "page14-model-image";
      model.src = source;
      model.alt = alt;
      const answer = document.createElement("div");
      answer.className = "page14-answer page18-answer " + guideClass;
      answer.setAttribute("aria-hidden", "true");
      sequence.append(model, answer);
      wrap.replaceChildren(sequence, canvas);
    }

    buildPractice("pg018_sec001_response_02", "images/pg018_d_model.png", "page18-guide-d", "Mfano wa kuandika herufi d.");
    buildPractice("pg018_sec001_response_03", "images/pg018_syllables_model.png", "page18-guide-syllables", "Mfano wa kuandika da, de, di, do na du.");
    buildPractice("pg018_sec001_response_04", "images/pg018_words_model.png", "page18-guide-words", "Mfano wa kuandika dada, dudu, dua, duma na doa.");
  }

  customizePage18();

  function customizePage19() {
    const page = document.querySelector('[data-section-id="pg019_sec001"]');
    if (!page) return;
    page.classList.add("page19-book-page");

    const card = page.querySelector('[data-response-id="pg019_sec001_response_01"]');
    if (card) {
      card.classList.add("page19-picture-card");
      const items = Array.from(card.querySelectorAll(".book-image-label-item"));
      items.forEach(function (item) {
        const id = item.querySelector("img")?.dataset.id;
        if (id === "pg019_im001") {
          item.classList.add("page19-desk-item");
          item.querySelector("img").src = "images/pg019_im001_clean.png";
        }
        if (id === "pg019_im002") item.classList.add("page19-can-item");
        if (id === "pg019_im003") {
          item.classList.remove("book-image-label-wide");
          item.classList.add("page19-sponge-item");
        }
      });
      const grid = card.querySelector(".book-image-label-grid");
      const desk = card.querySelector(".page19-desk-item");
      const can = card.querySelector(".page19-can-item");
      const sponge = card.querySelector(".page19-sponge-item");
      if (grid && desk && can && sponge) grid.append(desk, can, sponge);
    }

    const lessonStart = page.querySelector('[data-id="pg019_s001_n0003"]');
    if (lessonStart) lessonStart.classList.add("page19-lesson-label");
    const intro = page.querySelector('[data-id="pg019_s001_n0005"]');
    const oldIntroEnd = page.querySelector('[data-id="pg019_s001_n0006"]');
    const fullIntro = "Katika somo hili utajifunza kuandika herufi ya konsonanti k.";
    if (intro) intro.textContent = fullIntro;
    if (oldIntroEnd) oldIntroEnd.hidden = true;
  }

  customizePage19();

  function customizePage20() {
    const page = document.querySelector('[data-section-id="pg020_sec001"]');
    if (!page) return;
    page.classList.add("page20-writing-page");

    const tracePrompt = page.querySelector('[data-id="pg020_s001_n0002"]');
    if (tracePrompt) tracePrompt.textContent = "Fuatisha herufi ya konsonanti k.";

    const copyCard = page.querySelector('[data-response-id="pg020_sec001_response_01"]');
    if (copyCard && !copyCard.querySelector(".page20-copy-answer")) {
      const figure = copyCard.querySelector("figure");
      const wrap = copyCard.querySelector(".handwriting-canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (figure && wrap && canvas) {
        figure.classList.add("page20-copy-model");
        wrap.className = "handwriting-canvas-wrap page14-answer-only page20-copy-answer";
        wrap.removeAttribute("style");
        const answer = document.createElement("div");
        answer.className = "page14-answer page20-answer page20-guide-repeat";
        answer.setAttribute("aria-hidden", "true");
        wrap.replaceChildren(answer, canvas);
      }
    }

    function buildPractice(responseId, source, guideClass, alt) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.querySelector(".page20-model-sequence")) return;
      const wrap = card.querySelector(".handwriting-canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      wrap.className = "handwriting-canvas-wrap page14-model-practice page20-model-practice";
      wrap.removeAttribute("style");
      const sequence = document.createElement("div");
      sequence.className = "page14-model-sequence page20-model-sequence";
      const model = document.createElement("img");
      model.className = "page14-model-image";
      model.src = source;
      model.alt = alt;
      const answer = document.createElement("div");
      answer.className = "page14-answer page20-answer " + guideClass;
      answer.setAttribute("aria-hidden", "true");
      sequence.append(model, answer);
      wrap.replaceChildren(sequence, canvas);
    }

    buildPractice("pg020_sec001_response_02", "images/pg020_k_model.png", "page20-guide-k", "Mfano wa kuandika herufi k.");
    buildPractice("pg020_sec001_response_03", "images/pg020_syllables_model.png", "page20-guide-syllables", "Mfano wa kuandika ka, ke, ki, ko na ku.");
    buildPractice("pg020_sec001_response_04", "images/pg020_words_model.png", "page20-guide-words", "Mfano wa kuandika kaba, koma, kua, keki na komeo.");
  }

  customizePage20();

  function customizePage22() {
    const page = document.querySelector('[data-section-id="pg022_sec001"]');
    if (!page) return;
    page.classList.add("page22-writing-page");

    const tracePrompt = page.querySelector('[data-id="pg022_s001_n0001"]');
    if (tracePrompt) tracePrompt.textContent = "Fuatisha herufi ya konsonanti n.";

    function buildPractice(responseId, source, guideClass, alt) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.querySelector(".page22-model-sequence")) return;
      const prompt = card.querySelector(".source-line.question-prompt,.question-prompt");
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;

      card.classList.add("page22-practice-card");
      card.querySelectorAll("figure.practice-model,.handwriting-model,.sample-model-caption").forEach(function (node) {
        node.hidden = true;
      });
      wrap.className = "handwriting-canvas-wrap page22-model-practice";
      wrap.removeAttribute("style");

      const sequence = document.createElement("div");
      sequence.className = "page22-model-sequence";
      const model = document.createElement("img");
      model.className = "page22-model-image";
      model.src = source;
      model.alt = alt;
      const answer = document.createElement("div");
      answer.className = "page22-answer " + guideClass;
      answer.setAttribute("aria-hidden", "true");
      sequence.append(model, answer);
      wrap.replaceChildren(sequence, canvas);
      if (prompt) prompt.classList.add("page22-prompt");
    }

    buildPractice("pg022_sec001_response_01", "images/pg022_batch_letter_model.png", "page22-guide-letter", "Mfano wa kuandika herufi n.");
    buildPractice("pg022_sec001_response_02", "images/pg022_batch_syllables_model.png", "page22-guide-syllables", "Mfano wa kuandika na, ne, ni, no na nu.");
    buildPractice("pg022_sec001_response_03", "images/pg022_batch_words_model.png", "page22-guide-words", "Mfano wa kuandika nuna, nene, neno, nini na nane.");

    const traceCard = page.querySelector('[data-response-id="pg022_sec001_response_05"]');
    if (traceCard) {
      traceCard.classList.add("page22-practice-card", "page22-trace-card");
      const traceImage = traceCard.querySelector("figure.practice-model img");
      if (traceImage) traceImage.src = "images/pg022_trace_n_model.png";
    }

    const activityLabel = page.querySelector('[data-id="pg022_s001_n0007"]');
    const activityCard = page.querySelector('[data-response-id="pg022_sec001_response_04"]');
    if (activityCard) {
      activityCard.classList.add("page22-exercise-panel");
      if (activityLabel && activityLabel.parentElement !== activityCard) {
        activityCard.insertBefore(activityLabel, activityCard.firstChild);
      }
      const prompt = activityCard.querySelector('[data-id="pg022_s001_n0008"]');
      if (prompt) prompt.textContent = "Andika herufi inayokosekana ili kukamilisha neno.";
      ["pg022_s001_n0009", "pg022_s001_n0010", "pg022_s001_n0011", "pg022_s001_n0012", "pg022_s001_n0013"].forEach(function (id) {
        const line = activityCard.querySelector('[data-id="' + id + '"]');
        if (line) line.hidden = true;
      });

      const wrap = activityCard.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (wrap && canvas && !wrap.querySelector(".page22-missing-grid")) {
        wrap.className = "handwriting-canvas-wrap page22-missing-answer";
        wrap.removeAttribute("style");
        const grid = document.createElement("div");
        grid.className = "page22-missing-grid";
        [
          ["1.", "", "ene"],
          ["2.", "nu", "ua"],
          ["3.", "no", "a"],
          ["4.", "", "oa"],
          ["5.", "ku", "i"]
        ].forEach(function (parts) {
          const row = document.createElement("div");
          row.className = "page22-missing-row";
          const number = document.createElement("span");
          number.className = "page22-missing-number";
          number.textContent = parts[0];
          const word = document.createElement("span");
          word.className = "page22-missing-word";
          if (parts[1]) word.append(document.createTextNode(parts[1]));
          const box = document.createElement("span");
          box.className = "page22-mini-input";
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

  customizePage22();

  function customizePage23() {
    const page = document.querySelector('[data-section-id="pg023_sec001"]');
    if (!page) return;
    page.classList.add("page23-writing-page");

    const lessonTitle = page.querySelector('[data-id="pg023_s002_n0002"]');
    if (lessonTitle && lessonTitle.textContent.trim() !== "Kuandika herufi ya konsonanti l") {
      lessonTitle.textContent = "Kuandika herufi ya konsonanti l";
    }

    const consonantLine = page.querySelector('[data-id="pg023_s001_n0004"]');
    if (consonantLine && !consonantLine.querySelector(".page23-consonant-sequence")) {
      const sequence = document.createElement("strong");
      sequence.className = "page23-consonant-sequence";
      ["l", "t", "p", "s", "f", "j"].forEach(function (letter) {
        const item = document.createElement("span");
        item.textContent = letter;
        sequence.appendChild(item);
      });
      consonantLine.replaceChildren(
        document.createTextNode("konsonanti "),
        sequence,
        document.createTextNode(".")
      );
    }

    function buildPractice(responseId, source, answerClass, guideClass, alt) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.querySelector(".page23-model-sequence")) return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;

      card.classList.add("page23-practice-card");
      card.querySelectorAll("figure.practice-model,.handwriting-model,.sample-model-caption").forEach(function (node) {
        node.hidden = true;
      });
      wrap.className = "handwriting-canvas-wrap page23-model-practice";
      wrap.removeAttribute("style");

      const sequence = document.createElement("div");
      sequence.className = "page23-model-sequence";
      const model = document.createElement("img");
      model.className = "page23-model-image";
      model.src = source;
      model.alt = alt;
      const answer = document.createElement("div");
      answer.className = "page23-answer " + answerClass + " " + guideClass;
      answer.setAttribute("aria-hidden", "true");
      sequence.append(model, answer);
      wrap.replaceChildren(sequence, canvas);
    }

    buildPractice(
      "pg023_sec002_response_01",
      "images/pg023_batch_copy_model.png",
      "page23-copy-answer",
      "page23-guide-copy",
      "Mfano wa kuandika herufi l zilizounganishwa."
    );
    buildPractice(
      "pg023_sec002_response_02",
      "images/pg023_batch_letter_model.png",
      "page23-letter-answer",
      "page23-guide-letter",
      "Mfano wa kuandika herufi l."
    );

    const traceCard = page.querySelector('[data-response-id="pg023_sec002_response_03"]');
    if (traceCard) traceCard.classList.add("page23-practice-card", "page23-trace-card");
  }

  customizePage23();

  function customizePage24() {
    const page = document.querySelector('[data-section-id="pg024_sec001"]');
    if (!page) return;
    page.classList.add("page24-writing-page");

    function buildPractice(responseId, source, answerClass, guideClass, alt) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.querySelector(".page24-model-sequence")) return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;

      card.classList.add("page24-practice-card");
      card.querySelectorAll("figure.practice-model,.handwriting-model,.sample-model-caption").forEach(function (node) {
        node.hidden = true;
      });
      wrap.className = "handwriting-canvas-wrap page24-model-practice";
      wrap.removeAttribute("style");

      const sequence = document.createElement("div");
      sequence.className = "page24-model-sequence";
      const model = document.createElement("img");
      model.className = "page24-model-image";
      model.src = source;
      model.alt = alt;
      const answer = document.createElement("div");
      answer.className = "page24-answer " + answerClass + " " + guideClass;
      answer.setAttribute("aria-hidden", "true");
      sequence.append(model, answer);
      wrap.replaceChildren(sequence, canvas);
    }

    buildPractice(
      "pg024_sec001_response_01",
      "images/pg024_im003_source_model.png",
      "page24-syllable-answer",
      "page24-guide-syllable",
      "Mfano wa kuandika la, le, li, lo na lu."
    );
    buildPractice(
      "pg024_sec001_response_02",
      "images/pg024_words_model_clean.png",
      "page24-word-answer",
      "page24-guide-word",
      "Mfano wa kuandika lami, lala, lea, lini na loa."
    );
  }

  customizePage24();

  function customizePage25() {
    const page = document.querySelector('[data-section-id="pg025_sec001"]');
    if (!page) return;
    page.classList.add("page25-writing-page");

    const title = page.querySelector('[data-id="pg025_s001_n0002"]');
    if (title && title.textContent.trim() !== "Kuandika herufi ya konsonanti t") title.textContent = "Kuandika herufi ya konsonanti t";
    const intro = page.querySelector('[data-id="pg025_s001_n0004"]');
    if (intro && intro.textContent.trim() !== "konsonanti t.") intro.textContent = "konsonanti t.";
    const tracePrompt = page.querySelector('[data-id="pg025_s001_n0006"]');
    if (tracePrompt && tracePrompt.textContent.trim() !== "Fuatisha herufi ya konsonanti t.") tracePrompt.textContent = "Fuatisha herufi ya konsonanti t.";

    function buildPractice(responseId, source, guide, guideClass, alt) {
      const card = page.querySelector('[data-response-id="' + responseId + '"]');
      if (!card || card.querySelector(".page25-model-sequence")) return;
      const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      const canvas = wrap && wrap.querySelector("canvas");
      if (!wrap || !canvas) return;
      card.classList.add("page25-practice-card");
      card.querySelectorAll("figure.practice-model,.handwriting-model,.sample-model-caption").forEach(function (node) { node.hidden = true; });
      wrap.className = "handwriting-canvas-wrap page25-model-practice";
      wrap.removeAttribute("style");
      const sequence = document.createElement("div");
      sequence.className = "page25-model-sequence";
      const model = document.createElement("img");
      model.className = "page25-model-image";
      model.src = source;
      model.alt = alt;
      const answer = document.createElement("div");
      answer.className = "page25-answer " + guideClass;
      answer.style.setProperty("--page25-guide", 'url("' + guide + '")');
      answer.setAttribute("aria-hidden", "true");
      sequence.append(model, answer);
      wrap.replaceChildren(sequence, canvas);
    }

    buildPractice("pg025_sec001_response_01", "images/pg025_batch_copy_model.png", "images/pg025_copy_guide_clean.png", "page25-guide-copy", "Mfano wa kuunganisha herufi t.");
    buildPractice("pg025_sec001_response_02", "images/pg025_batch_letter_model.png", "images/pg025_letter_guide_clean.png", "page25-guide-letter", "Mfano wa kuandika herufi t.");
    buildPractice("pg025_sec001_response_03", "images/pg025_batch_syllables_model.png", "images/pg025_syllable_guide_clean.png", "page25-guide-syllable", "Mfano wa kuandika ta, te, ti, to na tu.");
    buildPractice("pg025_sec001_response_04", "images/pg025_batch_words_model.png", "images/pg025_word_guide_clean.png", "page25-guide-word", "Mfano wa kuandika tatu, tete, teka na takataka.");

    const traceCard = page.querySelector('[data-response-id="pg025_sec001_response_05"]');
    if (traceCard) traceCard.classList.add("page25-practice-card", "page25-trace-card");
  }

  customizePage25();

  function setBatchText(page, id, value) {
    const node = page && page.querySelector('[data-id="' + id + '"]');
    if (node) node.textContent = value;
  }

  function buildBatchPractice(page, item) {
    const card = page.querySelector('[data-response-id="' + item.response + '"]');
    if (!card || card.querySelector(".batch-model-sequence")) return;
    card.classList.add("batch-practice-card", "batch-" + item.kind + "-card");
    const prompt = card.querySelector(".source-line.question-prompt,.question-prompt");
    if (prompt && item.prompt) prompt.textContent = item.prompt;

    const wrap = card.querySelector(".handwriting-canvas-wrap,.trace-canvas-wrap,.canvas-wrap");
    const canvas = wrap && wrap.querySelector("canvas");
    if (!wrap || !canvas) return;

    card.querySelectorAll("figure.practice-model,.handwriting-model,.trace-letter-model,.sample-model-caption").forEach(function (node) {
      node.hidden = true;
    });
    wrap.className = "handwriting-canvas-wrap batch-model-practice";
    wrap.removeAttribute("style");

    const sequence = document.createElement("div");
    sequence.className = "batch-model-sequence";
    const model = document.createElement("img");
    model.className = "batch-model-image";
    model.src = item.source;
    model.alt = item.alt;
    const answer = document.createElement("div");
    answer.className = "batch-answer-lines";
    answer.setAttribute("aria-hidden", "true");
    const guide = document.createElement("img");
    guide.className = "batch-guide-shadow batch-guide-" + item.kind;
    guide.src = item.guide;
    guide.alt = "";
    guide.setAttribute("aria-hidden", "true");
    answer.appendChild(guide);
    const setRatio = function () {
      if (model.naturalWidth && model.naturalHeight) {
        answer.style.aspectRatio = model.naturalWidth + " / " + model.naturalHeight;
      }
    };
    if (model.complete) setRatio();
    else model.addEventListener("load", setRatio, { once: true });
    sequence.append(model, answer);
    wrap.replaceChildren(sequence, canvas);
  }

  function prepareBatchTrace(page, item) {
    const card = page.querySelector('[data-response-id="' + item.response + '"]');
    if (!card) return;
    card.classList.add("batch-practice-card", "batch-trace-card");
    const prompt = card.querySelector(".source-line.question-prompt,.question-prompt");
    if (prompt) prompt.textContent = item.prompt;
    const image = card.querySelector("figure.practice-model img");
    if (image && item.source) image.src = item.source;
    const wrap = card.querySelector(".book-trace-field,.trace-canvas-wrap,.handwriting-canvas-wrap");
    if (wrap) wrap.classList.add("batch-trace-field");
  }

  function customizeBatchWriting(config) {
    const page = document.querySelector('[data-section-id="' + config.page + '"]');
    if (!page) return;
    page.classList.add("batch-book-page", "batch-writing-page", "batch-page-" + config.number);
    Object.entries(config.texts || {}).forEach(function (entry) { setBatchText(page, entry[0], entry[1]); });
    (config.hide || []).forEach(function (id) {
      const node = page.querySelector('[data-id="' + id + '"]');
      if (node) node.hidden = true;
    });
    (config.lessonTitles || []).forEach(function (id) {
      const node = page.querySelector('[data-id="' + id + '"]');
      if (node) node.classList.add("batch-lesson-title");
    });
    (config.trace || []).forEach(function (item) { prepareBatchTrace(page, item); });
    (config.models || []).forEach(function (item) { buildBatchPractice(page, item); });
    (config.activityCards || []).forEach(function (response) {
      const card = page.querySelector('[data-response-id="' + response + '"]');
      if (card) card.classList.add("batch-activity-card");
    });
  }

  const batchWritingConfigs = [
    { number: 27, page: "pg027_sec001", texts: { pg027_s001_n0004: "konsonanti p.", pg027_s001_n0006: "Fuatisha herufi ya konsonanti p.", pg027_s001_n0011: "pona popo pipi punda polepole" },
      trace: [{ response: "pg027_sec001_response_05", prompt: "Fuatisha herufi ya konsonanti p." }], models: [
        { response: "pg027_sec001_response_01", kind: "copy", source: "images/pg027_im001_source_model.png", guide: "images/pg027_im001_guide.png?v=2", prompt: "Chora mchoro huu kwenye daftari.", alt: "Mfano wa mchoro wa herufi p." },
        { response: "pg027_sec001_response_02", kind: "letter", source: "images/pg027_batch_letter_model.png", guide: "images/pg027_batch_letter_guide.png", prompt: "Andika herufi ya konsonanti hii kwenye daftari.", alt: "Mfano wa kuandika herufi p." },
        { response: "pg027_sec001_response_03", kind: "syllables", source: "images/pg027_batch_syllables_model.png", guide: "images/pg027_batch_syllables_guide.png", prompt: "Andika silabi hizi kwenye daftari.", alt: "Mfano wa kuandika pa, pe, pi, po na pu." },
        { response: "pg027_sec001_response_04", kind: "words", source: "images/pg027_batch_words_model.png", guide: "images/pg027_batch_words_guide.png?v=2", prompt: "Andika maneno haya kwenye daftari.", alt: "Mfano wa kuandika pona, popo, pipi, punda na polepole." }
      ] },
    { number: 29, page: "pg029_sec001", texts: { pg029_s001_n0002: "Kuandika herufi ya konsonanti S", pg029_s001_n0004: "konsonanti S.", pg029_s001_n0006: "Fuatisha herufi ya konsonanti s." },
      trace: [{ response: "pg029_sec001_response_05", prompt: "Fuatisha herufi ya konsonanti s." }], models: [
        { response: "pg029_sec001_response_01", kind: "copy", source: "images/pg029_im001_source_model_aligned.png?v=2", guide: "images/pg029_im001_guide.png?v=2", prompt: "Chora mchoro huu kwenye daftari.", alt: "Mfano wa mchoro wa herufi s." },
        { response: "pg029_sec001_response_02", kind: "letter", source: "images/pg029_batch_letter_model.png", guide: "images/pg029_batch_letter_guide.png", prompt: "Andika herufi ya konsonanti hii kwenye daftari.", alt: "Mfano wa kuandika herufi s." },
        { response: "pg029_sec001_response_03", kind: "syllables", source: "images/pg029_im003_source_model_aligned.png?v=2", guide: "images/pg029_im003_guide.png", prompt: "Andika silabi hizi kwenye daftari.", alt: "Mfano wa kuandika sa, se, si, so na su." },
        { response: "pg029_sec001_response_04", kind: "words", source: "images/pg029_batch_words_model.png", guide: "images/pg029_batch_words_guide.png?v=2", prompt: "Andika maneno haya kwenye daftari.", alt: "Mfano wa kuandika sasa, sauti, sikia, sisi na suka." }
      ] },
    { number: 31, page: "pg031_sec001", texts: { pg031_s001_n0003: "Kuandika herufi ya konsonanti f" }, hide: ["pg031_s001_n0002"], lessonTitles: ["pg031_s001_n0003"], trace: [{ response: "pg031_sec001_response_04", prompt: "Fuatisha herufi ya konsonanti f." }], models: [
        { response: "pg031_sec001_response_01", kind: "letter", source: "images/pg031_batch_letter_model.png", guide: "images/pg031_batch_letter_guide.png", prompt: "Andika herufi ya konsonanti hii kwenye daftari.", alt: "Mfano wa kuandika herufi f." },
        { response: "pg031_sec001_response_02", kind: "syllables", source: "images/pg031_im002_source_model_aligned.png?v=2", guide: "images/pg031_im002_guide.png", prompt: "Andika silabi hizi kwenye daftari.", alt: "Mfano wa kuandika fa, fe, fi, fo na fu." },
        { response: "pg031_sec001_response_03", kind: "words", source: "images/pg031_batch_words_model.png", guide: "images/pg031_batch_words_guide.png?v=2", prompt: "Andika maneno haya kwenye daftari.", alt: "Mfano wa kuandika fua, fulana, futa, faida na fito." }
      ] },
    { number: 33, page: "pg033_sec001", texts: { pg033_s001_n0002: "Kuandika herufi ya konsonanti j", pg033_s001_n0003: "Fuatisha herufi ya konsonanti j.", pg033_s001_n0006: "ja je ji jo ju" },
      trace: [{ response: "pg033_sec001_response_04", prompt: "Fuatisha herufi ya konsonanti j.", source: "images/pg033_im001_trace_clean.png?v=3" }], models: [
        { response: "pg033_sec001_response_01", kind: "letter", source: "images/pg033_batch_letter_model.png?v=2", guide: "images/pg033_batch_letter_guide.png", prompt: "Andika herufi ya konsonanti hii kwenye daftari.", alt: "Mfano wa kuandika herufi j." },
        { response: "pg033_sec001_response_02", kind: "syllables", source: "images/pg033_batch_syllables_model.png?v=2", guide: "images/pg033_batch_syllables_guide.png", prompt: "Andika silabi hizi kwenye daftari.", alt: "Mfano wa kuandika ja, je, ji, jo na ju." },
        { response: "pg033_sec001_response_03", kind: "words", source: "images/pg033_batch_words_model.png", guide: "images/pg033_batch_words_guide.png?v=2", prompt: "Andika maneno haya kwenye daftari.", alt: "Mfano wa kuandika jua, jino, jioni, jipu na joto." }
      ] },
    { number: 35, page: "pg035_sec001", texts: { pg035_s002_n0002: "Kuandika herufi ya konsonanti g" },
      trace: [{ response: "pg035_sec002_response_03", prompt: "Fuatisha herufi ya konsonanti g.", source: "images/pg035_im001_trace_clean.png?v=2" }], models: [
        { response: "pg035_sec002_response_01", kind: "letter", source: "images/pg035_batch_letter_model.png?v=2", guide: "images/pg035_batch_letter_guide.png", prompt: "Andika herufi ya konsonanti hii kwenye daftari.", alt: "Mfano wa kuandika herufi g." },
        { response: "pg035_sec002_response_02", kind: "syllables", source: "images/pg035_batch_syllables_model.png", guide: "images/pg035_batch_syllables_guide.png", prompt: "Andika silabi hizi kwenye daftari.", alt: "Mfano wa kuandika ga, ge, gi, go na gu." }
      ] },
    { number: 36, page: "pg036_sec001", models: [
        { response: "pg036_sec001_response_01", kind: "words", source: "images/pg036_batch_words_model.png", guide: "images/pg036_batch_words_guide.png?v=2", prompt: "Andika maneno haya kwenye daftari.", alt: "Mfano wa kuandika gauni, geuka, goli, gesi na geti." }
      ] },
    { number: 37, page: "pg037_sec001", texts: { pg037_s001_n0002: "Kuandika herufi ya konsonanti y", pg037_s001_n0004: "konsonanti y.", pg037_s001_n0005: "Fuatisha herufi ya konsonanti y.", pg037_s001_n0009: "yenu yupi yaya yule yote" },
      trace: [{ response: "pg037_sec001_response_04", prompt: "Fuatisha herufi ya konsonanti y.", source: "images/pg037_im001_trace_clean.png?v=2" }], models: [
        { response: "pg037_sec001_response_01", kind: "letter", source: "images/pg037_batch_letter_model.png", guide: "images/pg037_batch_letter_guide.png", prompt: "Andika konsonanti hii kwenye daftari.", alt: "Mfano wa kuandika herufi y." },
        { response: "pg037_sec001_response_02", kind: "syllables", source: "images/pg037_im002_source_model.png", guide: "images/pg037_im002_guide.png", prompt: "Andika silabi hizi kwenye daftari.", alt: "Mfano wa kuandika ya, ye, yi, yo na yu." },
        { response: "pg037_sec001_response_03", kind: "words", source: "images/pg037_batch_words_model.png", guide: "images/pg037_batch_words_guide.png?v=2", prompt: "Andika maneno haya kwenye daftari.", alt: "Mfano wa kuandika yenu, yupi, yaya, yule na yote." }
      ] },
    { number: 39, page: "pg039_sec001", texts: { pg039_s001_n0004: "konsonanti z.", pg039_s001_n0005: "Fuatisha herufi ya konsonanti z." },
      trace: [{ response: "pg039_sec001_response_04", prompt: "Fuatisha herufi ya konsonanti z." }], models: [
        { response: "pg039_sec001_response_01", kind: "letter", source: "images/pg039_consistent_letter_model.png?v=1", guide: "images/pg039_consistent_letter_guide.png?v=1", prompt: "Andika konsonanti hii kwenye daftari.", alt: "Mfano wa kuandika herufi z." },
        { response: "pg039_sec001_response_02", kind: "syllables", source: "images/pg039_consistent_syllables_model.png?v=1", guide: "images/pg039_consistent_syllables_guide.png?v=1", prompt: "Andika silabi hizi kwenye daftari.", alt: "Mfano wa kuandika za, ze, zi, zo na zu." },
        { response: "pg039_sec001_response_03", kind: "words", source: "images/pg039_consistent_words_model.png?v=1", guide: "images/pg039_consistent_words_guide.png?v=1", prompt: "Andika maneno haya kwenye daftari.", alt: "Mfano wa kuandika zoezi, zizi, zaliwa, zao na zua." }
      ] }
  ];

  batchWritingConfigs.forEach(customizeBatchWriting);

  function makeSinglePictureGrid(card) {
    if (!card || card.querySelector(".book-image-label-grid")) return;
    const figure = card.querySelector("figure.practice-model");
    const wrap = card.querySelector(".handwriting-canvas-wrap,.canvas-wrap,.trace-canvas-wrap");
    if (!figure || !wrap) return;
    const parent = figure.parentElement;
    figure.hidden = false;
    figure.classList.remove("book-example-model");
    wrap.className = "handwriting-canvas-wrap book-image-label-overlay";
    wrap.removeAttribute("style");
    const stage = document.createElement("div");
    stage.className = "book-image-label-stage";
    const grid = document.createElement("div");
    grid.className = "book-image-label-grid batch-single-grid";
    const item = document.createElement("div");
    item.className = "book-image-label-item book-image-label-wide";
    parent.insertBefore(stage, figure);
    item.appendChild(figure);
    const line = document.createElement("div");
    line.className = "book-image-label-line";
    line.setAttribute("aria-hidden", "true");
    item.appendChild(line);
    grid.appendChild(item);
    stage.append(grid, wrap);
  }

  function customizeBatchPicture(config) {
    const page = document.querySelector('[data-section-id="' + config.page + '"]');
    if (!page) return;
    page.classList.add("batch-book-page", "batch-picture-page", "batch-page-" + config.number);
    const card = page.querySelector('[data-response-id="' + config.response + '"]');
    if (!card) return;
    card.classList.add("batch-picture-card");
    if (config.single) makeSinglePictureGrid(card);
    const grid = card.querySelector(".book-image-label-grid");
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll(":scope > .book-image-label-item"));
    items.forEach(function (item) {
      const image = item.querySelector("img[data-id]");
      if (image) {
        const version = config.assetVersion ? "?v=" + config.assetVersion : "";
        image.src = "images/" + image.dataset.id + "_clean.png" + version;
      }
    });
    const byId = new Map(items.map(function (item) { return [item.querySelector("img")?.dataset.id, item]; }));
    (config.order || []).forEach(function (id) { if (byId.get(id)) grid.appendChild(byId.get(id)); });
    grid.classList.add(config.layout || "batch-grid-two");
    grid.querySelectorAll(".book-image-label-wide").forEach(function (item) { item.classList.remove("book-image-label-wide"); });
    if (config.firstWide) grid.firstElementChild?.classList.add("book-image-label-wide");
  }

  [
    { number: 21, page: "pg021_sec001", response: "pg021_sec001_response_01", order: ["pg021_im002", "pg021_im001", "pg021_im004", "pg021_im003"], layout: "batch-grid-two" },
    { number: 26, page: "pg026_sec001", response: "pg026_sec001_response_01", order: ["pg026_im002", "pg026_im001", "pg026_im003", "pg026_im004", "pg026_im005", "pg026_im006"], layout: "batch-grid-two", assetVersion: 2 },
    { number: 28, page: "pg028_sec001", response: "pg028_sec001_response_01", order: ["pg028_im001", "pg028_im002", "pg028_im003", "pg028_im004"], layout: "batch-grid-two" },
    { number: 30, page: "pg030_sec001", response: "pg030_sec001_response_01", order: ["pg030_im002", "pg030_im001", "pg030_im003", "pg030_im004"], layout: "batch-grid-two" },
    { number: 32, page: "pg032_sec001", response: "pg032_sec001_response_01", order: ["pg032_im001", "pg032_im003", "pg032_im002"], layout: "batch-grid-one-two", firstWide: true },
    { number: 34, page: "pg034_sec001", response: "pg034_sec001_response_01", order: ["pg034_im001"], layout: "batch-grid-single", single: true },
    { number: 36, page: "pg036_sec001", response: "pg036_sec001_response_02", order: ["pg036_im001", "pg036_im002", "pg036_im003"], layout: "batch-grid-vertical" },
    { number: 38, page: "pg038_sec001", response: "pg038_sec001_response_01", order: ["pg038_im001"], layout: "batch-grid-single", single: true },
    { number: 40, page: "pg040_sec001", response: "pg040_sec001_response_01", order: ["pg040_im001", "pg040_im002"], layout: "batch-grid-vertical" }
  ].forEach(customizeBatchPicture);

  const page21Lesson = document.querySelector('[data-section-id="pg021_sec002"]');
  if (page21Lesson) {
    page21Lesson.classList.add("batch-lesson-intro");
    setBatchText(page21Lesson, "pg021_s002_n0004", "konsonanti n.");
  }

  function customizePage24Scene() {
    const page = document.querySelector('[data-section-id="pg024_sec001"]');
    if (!page || page.querySelector('[data-response-id="pg024_sec001_response_scene"]')) return;
    const heading = page.querySelector('[data-id="pg024_s001_n0003"]');
    const prompt = page.querySelector('[data-id="pg024_s001_n0004"]');
    const figures = Array.from(page.querySelectorAll(":scope > figure"));
    const oldAnswer = page.querySelector('[data-id="pg024_s001_n0005"]');
    if (!heading || !prompt || figures.length !== 2 || !oldAnswer) return;
    const card = document.createElement("section");
    card.className = "response-card page24-scene-card";
    card.dataset.responseId = "pg024_sec001_response_scene";
    card.dataset.questionId = "pg024_s001_n0004";
    const stage = document.createElement("div");
    stage.className = "page24-scene-stage";
    const grid = document.createElement("div");
    grid.className = "page24-scene-grid";
    [figures[1], figures[0]].forEach(function (figure, index) {
      const item = document.createElement("div");
      item.className = "page24-scene-item";
      const label = document.createElement("span");
      label.className = "page24-scene-name";
      label.textContent = index === 0 ? "Leo" : "Lulu";
      const line = document.createElement("div");
      line.className = "page24-scene-line";
      const image = figure.querySelector("img[data-id]");
      if (image) image.src = "images/" + image.dataset.id + "_clean.png";
      item.append(figure, label, line);
      grid.appendChild(item);
    });
    const wrap = document.createElement("div");
    wrap.className = "canvas-wrap page24-scene-canvas-wrap";
    const canvas = document.createElement("canvas");
    canvas.className = "drawing-canvas handwriting-canvas";
    canvas.width = 900;
    canvas.height = 430;
    canvas.setAttribute("aria-label", "Andika majibu ya Leo na Lulu kwenye visanduku.");
    wrap.appendChild(canvas);
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "clear-response drawing-clear";
    clear.textContent = "Futa";
    stage.append(grid, wrap);
    card.append(prompt, stage, clear);
    heading.insertAdjacentElement("afterend", card);
    oldAnswer.hidden = true;
    window.KuandikaWritingActivities?.setupCard(card);
  }

  customizePage24Scene();

  const wordSearch = document.querySelector('[data-response-id="pg034_sec001_response_02"]');
  if (wordSearch) {
    wordSearch.classList.add("batch-word-search-card");
    const rows = Array.from(wordSearch.querySelectorAll(".source-line")).filter(function (line) {
      return !line.classList.contains("question-prompt");
    });
    if (rows.length && !wordSearch.querySelector(".batch-letter-table")) {
      const table = document.createElement("div");
      table.className = "batch-letter-table";
      rows.forEach(function (row) {
        row.textContent.trim().split(/\s+/).forEach(function (letter) {
          const cell = document.createElement("span");
          cell.textContent = letter;
          table.appendChild(cell);
        });
        row.hidden = true;
      });
      const wrap = wordSearch.querySelector(".handwriting-canvas-wrap,.canvas-wrap");
      if (wrap) {
        const stage = document.createElement("div");
        stage.className = "batch-word-search-stage";
        wordSearch.insertBefore(stage, wrap);
        stage.append(table);
      }
    }
  }

  const section = document.querySelector("#content > section");
  const clearButtons = Array.from(document.querySelectorAll(".clear-response"));
  clearButtons.forEach(function (button) {
    button.textContent = "Futa";
    button.setAttribute("aria-label", "Futa jibu la zoezi hili");
    button.setAttribute("title", "Futa jibu la zoezi hili");
  });
  if (!section || !clearButtons.length) return;

  const tools = document.createElement("div");
  tools.className = "sample-page-tool";

  const clearPage = document.createElement("button");
  clearPage.type = "button";
  clearPage.className = "sample-clear-page";
  clearPage.textContent = "Futa maandishi ya ukurasa";
  clearPage.addEventListener("click", function () {
    clearButtons.forEach(function (button) { button.click(); });
  });

  tools.appendChild(clearPage);
  section.appendChild(tools);
})();
