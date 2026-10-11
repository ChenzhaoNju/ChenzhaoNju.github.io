(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let data;

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function setStatus(message) { $('#player-status').textContent = message; }

  function muteOthers(selected) {
    $$('video').forEach(video => {
      if (video !== selected) video.muted = true;
    });
  }

  function syncListenButtons() {
    $$('.video-card').forEach(card => {
      const video = $('video', card);
      const button = $('.listen-button', card);
      const listening = !video.muted && video.volume > 0;
      button.setAttribute('aria-pressed', String(listening));
      button.textContent = listening ? '♫ Sound on' : '♫ Listen';
    });
  }

  function videoCard(media, name, group) {
    const card = createElement('article', `video-card${name === 'ssrs' ? ' ours' : ''}`);
    const head = createElement('div', 'video-card-head');
    head.append(createElement('span', '', name === 'ssrs' ? 'SSRS SFT' : media.label));
    if (name === 'ssrs') head.append(createElement('span', 'ours-tag', 'OURS'));
    const video = createElement('video');
    video.src = media.src;
    video.poster = media.poster;
    video.preload = 'none';
    video.controls = true;
    video.playsInline = true;
    video.muted = true;
    video.dataset.group = group;
    video.setAttribute('aria-label', `${media.label} generated video`);
    video.addEventListener('volumechange', () => {
      if (!video.muted && video.volume > 0) muteOthers(video);
      syncListenButtons();
    });
    video.addEventListener('play', () => {
      $$('video').forEach(other => {
        if (other !== video && other.dataset.group !== group) other.pause();
      });
    });
    video.addEventListener('error', () => setStatus('This video could not load. Try refreshing the page or opening its video file directly.'));
    const footer = createElement('div', 'video-card-footer');
    const listen = createElement('button', 'listen-button', '♫ Listen');
    listen.type = 'button';
    listen.setAttribute('aria-pressed', 'false');
    listen.setAttribute('aria-label', `Toggle audio for ${media.label}`);
    listen.addEventListener('click', () => {
      const enabling = video.muted;
      if (enabling) muteOthers(video);
      video.muted = !enabling;
      if (enabling) {
        video.volume = 1;
        video.play().catch(() => setStatus('Press the play button in the video player to start playback.'));
      }
      syncListenButtons();
    });
    const prompt = createElement('a', '', 'Prompt ↗');
    prompt.href = media.prompt;
    prompt.target = '_blank';
    prompt.rel = 'noopener';
    prompt.setAttribute('aria-label', `Read the exact generation prompt for ${media.label}`);
    footer.append(listen, prompt);
    card.append(head, video, footer);
    return card;
  }

  function clearVideos(root) {
    $$('video', root).forEach(video => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    });
    root.replaceChildren();
  }

  function updateTabs(container, id, panel) {
    $$('[role=tab]', container).forEach(tab => {
      const selected = tab.dataset.id === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) panel.setAttribute('aria-labelledby', tab.id);
    });
  }

  function selectCase(id) {
    const item = data.qualitative.find(item => item.id === id);
    if (!item) return;
    clearVideos($('#comparison-videos'));
    $('#case-title').textContent = item.title;
    $('#case-meta').textContent = `${String(item.shots || '').padStart(2, '0')} requested shots · ${item.sample} · Selected benchmark example`;
    $('#case-description').textContent = item.description;
    updateTabs($('#case-tabs'), id, $('#qualitative-panel'));
    for (const name of ['ssrs', 'ltx', 'shotstream', 'javis']) {
      $('#comparison-videos').append(videoCard(item.models[name], name, 'qualitative'));
    }
    setStatus('');
  }

  function selectControlled(id) {
    const item = data.controlled.find(item => item.id === id);
    if (!item) return;
    clearVideos($('#controlled-videos'));
    $('#control-title').textContent = item.title;
    $('#control-category').textContent = item.category;
    $('#control-meta').textContent = `Diagnostic category: ${item.code} · Matched case and seed ${item.seed}`;
    updateTabs($('#control-tabs'), id, $('#controlled-panel'));
    for (const name of ['dense', 'ssrs']) $('#controlled-videos').append(videoCard(item.models[name], name, 'controlled'));
  }

  function makeTabs(items, root, panelId, select) {
    items.forEach((item, index) => {
      const button = createElement('button');
      button.type = 'button';
      button.id = `${panelId}-tab-${index}`;
      button.dataset.id = item.id;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', 'false');
      button.setAttribute('aria-controls', panelId);
      button.tabIndex = -1;
      button.append(createElement('span', '', String(index + 1).padStart(2, '0')), document.createTextNode(item.title));
      button.addEventListener('click', () => select(item.id));
      root.append(button);
    });
    root.addEventListener('keydown', event => {
      const tabs = $$('[role=tab]', root);
      const index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
      tabs[next].scrollIntoView({block: 'nearest', inline: 'nearest'});
    });
  }

  async function startTogether(root, button) {
    const videos = $$('video', root);
    if (!videos.length) return;
    button.disabled = true;
    for (const video of videos) {
      video.pause();
      video.muted = true;
      video.currentTime = 0;
    }
    syncListenButtons();
    const results = await Promise.allSettled(videos.map(video => video.play()));
    button.disabled = false;
    if (results.some(result => result.status === 'rejected')) setStatus('Some players could not start automatically. Use their individual play buttons.');
    else setStatus('Videos started together, muted. Choose Listen on one model to compare its audio.');
  }

  $('#play-comparison').addEventListener('click', () => startTogether($('#comparison-videos'), $('#play-comparison')));
  $('#pause-comparison').addEventListener('click', () => $$('video', $('#comparison-videos')).forEach(video => video.pause()));
  $('#play-controlled').addEventListener('click', () => startTogether($('#controlled-videos'), $('#play-controlled')));

  $$('.watch-feature').forEach(button => button.addEventListener('click', () => {
    if (!data) return;
    selectCase(button.dataset.case);
    $('#examples').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    const video = $('#comparison-videos .ours video');
    muteOthers(video);
    video.muted = false;
    video.play().catch(() => setStatus('Press play on SSRS SFT to watch this example with sound.'));
    syncListenButtons();
  }));

  const states = [
    {view: 'SPEAKER VIEW', entity: 'A', visual: 'A is visible and speaking; B is off screen.', audio: 'U1 begins · Voice vA', frame: 'Person A is visible and speaking'},
    {view: 'LISTENER VIEW', entity: 'B', visual: 'B is visible and listening; A is off screen.', audio: 'U1 continues · Same voice, same event', frame: 'Person B listens; Person A speaks off screen'},
    {view: 'SPEAKER VIEW', entity: 'A', visual: 'A is visible again; speaking → mouth closed.', audio: 'U1 concludes · Voice vA', frame: 'Person A returns as the utterance ends'}
  ];
  function selectShot(index) {
    const state = states[index];
    $$('.shot-selector button').forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    $('#shot-demo-panel').setAttribute('aria-labelledby', `shot-tab-${index}`);
    $('.frame-label').textContent = state.view;
    $('.person-icon').className = `person-icon person-${state.entity.toLowerCase()}`;
    $('.person-icon span').textContent = state.entity;
    $('#shot-visual').classList.toggle('listener-view', state.entity === 'B');
    $('#visual-state').textContent = state.visual;
    $('#audio-state').textContent = state.audio;
    $('#frame-state').textContent = state.frame;
  }
  $$('.shot-selector button').forEach((button, i) => button.addEventListener('click', () => selectShot(i)));
  $('.shot-selector').addEventListener('keydown', event => {
    const buttons = $$('.shot-selector button');
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = (current + 1) % 3;
    else if (event.key === 'ArrowLeft') next = (current + 2) % 3;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 2;
    else return;
    event.preventDefault();
    buttons[next].focus();
    selectShot(next);
  });
  for (let i = 0; i < 72; i++) {
    const bar = createElement('i');
    const height = 5 + 22 * Math.abs(Math.sin(i * 1.37) * Math.cos(i * .29));
    bar.style.setProperty('--wave-height', `${height.toFixed(1)}px`);
    $('.waveform').append(bar);
  }

  const categories = [
    ['Visual-state evolution', 20.00, 60.00, '+40.00', 62.50, 42.50],
    ['Cross-shot audio continuity', 0.00, 50.00, '+50.00', 59.38, 62.50],
    ['Non-speech source binding', 5.00, 45.00, '+40.00', 45.00, 60.00],
    ['Cross-shot event order', 0.00, 40.00, '+40.00', 50.00, 55.00],
    ['On-/off-screen speaker binding', 7.14, 42.86, '+35.71', 25.00, 42.86],
    ['Overall', 7.50, 48.75, '+41.25', 49.38, 52.50]
  ];
  categories.forEach(([name, dense, ssrs, delta]) => {
    const row = createElement('div', 'chart-row');
    row.append(createElement('span', 'chart-name', name));
    const pair = createElement('div', 'chart-pair');
    [[dense, 'dense'], [ssrs, 'ssrs']].forEach(([value, method]) => {
      const bar = createElement('div', `chart-bar ${method}`);
      bar.style.setProperty('--score', `${value}%`);
      bar.setAttribute('aria-label', `${method === 'ssrs' ? 'SSRS SFT' : 'Dense SFT'}: ${value.toFixed(2)} percent`);
      bar.append(createElement('span', '', value.toFixed(2)));
      pair.append(bar);
    });
    row.append(pair, createElement('span', 'chart-delta', `${delta} pp`));
    $('#target-chart').append(row);
  });

  const metricHeaders = ['Method', 'Narr ↑', 'Lip ↑', 'Attr ↑', 'Sync ↑', 'VQ ↑', 'C-Layout ↑', 'VC ↑', 'Mus ↑', 'Spk ↑', 'I-Layout ↑', 'Cam ↑', 'PQ ↑', 'OCR ↑', 'WER-S ↑'];
  const benchmarkRows = [
    ['Ovi', .3288, .0605, .2864, .8290, .5434, .4333, .6824, .4978, .3094, .9136, .5316, .5733, .2222, .0065],
    ['JavisDiT++', .4932, .0084, .0668, .8073, .6499, .6731, .6747, .5055, .4651, .6288, .6245, .4981, .1379, .0016],
    ['JavisGPT', .2170, .0022, .0101, .7780, .3813, .6400, .7038, .4992, .0659, .8333, .4281, .5575, .0053, .0028],
    ['ShotStream+HF', .6844, .1384, .2762, .7863, .5943, .8704, .8720, .4722, .1860, .9151, .6377, .6641, .1734, .0033],
    ['LTX-2.5', .7883, .1242, .2500, .7727, .7269, .8152, .8664, .4673, .1418, .8902, .7529, .6416, .2324, .7226],
    ['Base-LTX-2.3', .8076, .1138, .2061, .7840, .8033, .7301, .8905, .4666, .1811, .9167, .7648, .6235, .1829, .7262],
    ['Dense SFT', .8222, .2284, .5104, .8450, .8202, .8409, .8756, .7217, .4002, .9722, .8027, .6244, .1389, .7319],
    ['SSRS SFT', .8467, .2468, .5265, .8573, .8376, .9167, .8631, .7523, .4006, .8750, .8321, .6011, .2118, .7543]
  ];
  function table(root, headers, rows, digits, highlighted) {
    const head = createElement('thead');
    const headerRow = createElement('tr');
    headers.forEach(text => {
      const th = createElement('th', '', text);
      th.scope = 'col';
      headerRow.append(th);
    });
    head.append(headerRow);
    const body = createElement('tbody');
    const max = headers.map((_, i) => i > 0 ? Math.max(...rows.map(row => row[i])) : 0);
    rows.forEach(row => {
      const tr = createElement('tr', row[0] === highlighted ? 'ours' : '');
      row.forEach((value, i) => {
        const cell = createElement(i === 0 ? 'th' : 'td', '', i === 0 ? value : value.toFixed(digits));
        if (i === 0) cell.scope = 'row';
        else if (value === max[i]) cell.classList.add('best');
        tr.append(cell);
      });
      body.append(tr);
    });
    root.append(head, body);
  }
  table($('#benchmark-table'), metricHeaders, benchmarkRows, 4, 'SSRS SFT');
  table($('#controlled-table'), ['Category', 'Dense T ↑', 'Dense P ↑', 'SSRS T ↑', 'SSRS P ↑'], categories.map(([name, dense, ssrs, delta, denseP, ssrsP]) => [name, dense, denseP, ssrs, ssrsP]), 2, 'Overall');
  table($('#ablation-table'), ['Representation', 'Narr ↑', 'Mus ↑', 'Spk ↑', 'Lip ↑', 'Attr ↑', 'Sync ↑', 'VQ ↑', 'Cam ↑'], [
    ['Full SSRS', .8467, .7523, .4006, .2468, .5265, .8573, .8376, .8321],
    ['w/o Audio-Visual Relations', .8622, .7131, .4268, .2374, .5110, .8387, .8137, .8420],
    ['w/o Global Registries and Event', .8289, .7168, .3801, .2530, .5003, .8477, .8189, .8218]
  ], 4, 'Full SSRS');

  $('#copy-citation').addEventListener('click', async () => {
    const text = $('#bibtex').textContent;
    try {
      await navigator.clipboard.writeText(text);
      $('#copy-citation').textContent = 'Copied ✓';
      $('#copy-status').textContent = 'Citation copied to the clipboard.';
      setTimeout(() => { $('#copy-citation').textContent = 'Copy citation'; }, 2500);
    } catch {
      const range = document.createRange();
      range.selectNodeContents($('#bibtex'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      $('#copy-status').textContent = 'Citation selected. Press Command+C or Ctrl+C to copy.';
    }
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const constrainedConnection = navigator.connection && navigator.connection.saveData;
  if (!reducedMotion.matches && !constrainedConnection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting && !document.hidden) {
        if (!video.src) video.src = video.dataset.src;
        const activeComparison = $$('video[data-group]').some(other => !other.paused);
        if (!activeComparison) video.play().catch(() => {});
      } else video.pause();
    }), {threshold: .3});
    $$('.preview-video').forEach(video => observer.observe(video));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) $$('video').forEach(video => video.pause());
    });
  }

  fetch('cases.json').then(response => {
    if (!response.ok) throw new Error('Examples unavailable');
    return response.json();
  }).then(json => {
    data = json;
    makeTabs(data.qualitative, $('#case-tabs'), 'qualitative-panel', selectCase);
    makeTabs(data.controlled, $('#control-tabs'), 'controlled-panel', selectControlled);
    selectCase(data.qualitative[0].id);
    selectControlled(data.controlled[0].id);
  }).catch(() => {
    $('#case-title').textContent = 'Examples could not load';
    $('#control-title').textContent = 'Please refresh the page';
    setStatus('The video index could not load. The paper and dataset links remain available.');
  });
})();
