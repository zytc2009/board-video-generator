const state = {
  plan: null,
  textNodes: [],
  svgNodes: []
};

window.__loadBoardPlan = function loadBoardPlan(plan) {
  state.plan = plan;
  state.textNodes = [];
  state.svgNodes = [];

  const title = document.getElementById('title');
  const layer = document.getElementById('layer');
  const svgLayer = document.getElementById('svg-layer');
  const scene = plan?.scenes?.[0] ?? { title: '', actions: [] };
  const actions = Array.isArray(scene.actions) ? scene.actions : [];

  title.textContent = scene.title ?? '';
  layer.textContent = '';
  svgLayer.textContent = '';

  for (const action of actions) {
    if (action.type === 'write' || action.type === 'formula') {
      const node = document.createElement('div');
      node.className = `text-action ${action.type}-action`;
      node.textContent = action.text;
      node.style.left = `${action.x}px`;
      node.style.top = `${action.y}px`;
      node.style.width = '0px';
      layer.appendChild(node);
      state.textNodes.push({ action, node });
    }

    if (action.type === 'arrow') {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      node.setAttribute('class', 'stroke-action');
      node.setAttribute('x1', action.from[0]);
      node.setAttribute('y1', action.from[1]);
      node.setAttribute('x2', action.to[0]);
      node.setAttribute('y2', action.to[1]);
      svgLayer.appendChild(node);
      state.svgNodes.push({ action, node });
    }

    if (action.type === 'box') {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      node.setAttribute('class', 'stroke-action');
      node.setAttribute('x', action.x);
      node.setAttribute('y', action.y);
      node.setAttribute('width', action.width);
      node.setAttribute('height', action.height);
      node.setAttribute('rx', '6');
      svgLayer.appendChild(node);
      state.svgNodes.push({ action, node });
    }
  }

  prepareStrokes();
  window.__setBoardTime(0);
};

window.__setBoardTime = function setBoardTime(seconds) {
  for (const entry of state.textNodes) {
    const progress = actionProgress(entry.action, seconds);
    entry.node.style.opacity = progress <= 0 ? '0' : '1';
    entry.node.style.width = `${Math.ceil(entry.node.scrollWidth * progress)}px`;
  }

  for (const entry of state.svgNodes) {
    const progress = actionProgress(entry.action, seconds);
    const length = Number(entry.node.dataset.pathLength || 1);
    entry.node.style.opacity = progress <= 0 ? '0' : '1';
    entry.node.style.strokeDasharray = `${length}`;
    entry.node.style.strokeDashoffset = `${length * (1 - progress)}`;
  }
};

function prepareStrokes() {
  for (const entry of state.svgNodes) {
    let length = 1;
    if (typeof entry.node.getTotalLength === 'function') {
      length = entry.node.getTotalLength();
    } else if (entry.action.type === 'box') {
      length = 2 * (entry.action.width + entry.action.height);
    }
    entry.node.dataset.pathLength = String(length);
  }
}

function actionProgress(action, seconds) {
  const elapsed = seconds - action.start;
  if (elapsed <= 0) {
    return 0;
  }
  if (elapsed >= action.duration) {
    return 1;
  }
  return easeInOut(elapsed / action.duration);
}

function easeInOut(value) {
  return value < 0.5
    ? 2 * value * value
    : 1 - Math.pow(-2 * value + 2, 2) / 2;
}
