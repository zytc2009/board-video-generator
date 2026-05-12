const SUPPORTED_TYPES = new Set(['write', 'formula', 'arrow', 'box', 'clear']);

export function parseBoardMarkdown(source, options = {}) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const title = findTitle(lines);
  const actions = [];
  let cursor = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith('::') || line === '::') {
      continue;
    }

    const directiveLineNumber = i + 1;
    const directive = parseDirectiveHeader(line, directiveLineNumber);
    if (!SUPPORTED_TYPES.has(directive.type)) {
      throw new Error(`Line ${directiveLineNumber}: unsupported directive "${directive.type}"`);
    }

    const bodyLines = [];
    i += 1;
    while (i < lines.length && lines[i].trim() !== '::') {
      bodyLines.push(lines[i]);
      i += 1;
    }

    if (i >= lines.length) {
      throw new Error(`Line ${directiveLineNumber}: directive "${directive.type}" is missing closing "::"`);
    }

    const action = buildAction(directive, bodyLines.join('\n').trim(), cursor, directiveLineNumber);
    actions.push(action);
    cursor = roundTime(cursor + action.duration);
  }

  const duration = Math.max(roundTime(cursor + 1), 1);

  return {
    fps: options.fps ?? 30,
    width: options.width ?? 1920,
    height: options.height ?? 1080,
    theme: options.theme ?? 'whiteboard',
    scenes: [
      {
        title,
        duration,
        actions
      }
    ]
  };
}

function findTitle(lines) {
  const titleLine = lines.find((line) => line.trim().startsWith('# '));
  return titleLine ? titleLine.trim().slice(2).trim() : 'Untitled Board';
}

function parseDirectiveHeader(line, lineNumber) {
  const content = line.slice(2).trim();
  const [type, ...parts] = content.split(/\s+/);
  if (!type) {
    throw new Error(`Line ${lineNumber}: directive type is required`);
  }

  const attrs = {};
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) {
      throw new Error(`Line ${lineNumber}: invalid attribute "${part}"`);
    }
    attrs[part.slice(0, eq)] = part.slice(eq + 1);
  }

  return { type, attrs };
}

function buildAction(directive, text, start, lineNumber) {
  const duration = readPositiveNumber(directive.attrs.duration, 'duration', lineNumber, 1);
  const base = {
    type: directive.type,
    start: roundTime(start),
    duration
  };

  if (directive.type === 'write' || directive.type === 'formula') {
    return {
      ...base,
      text,
      x: readNumber(directive.attrs.x, 'x', lineNumber, 120),
      y: readNumber(directive.attrs.y, 'y', lineNumber, 120)
    };
  }

  if (directive.type === 'arrow') {
    return {
      ...base,
      from: readPoint(directive.attrs.from, 'from', lineNumber),
      to: readPoint(directive.attrs.to, 'to', lineNumber)
    };
  }

  if (directive.type === 'box') {
    return {
      ...base,
      x: readNumber(directive.attrs.x, 'x', lineNumber, 120),
      y: readNumber(directive.attrs.y, 'y', lineNumber, 120),
      width: readPositiveNumber(directive.attrs.width, 'width', lineNumber, 320),
      height: readPositiveNumber(directive.attrs.height, 'height', lineNumber, 160)
    };
  }

  return base;
}

function readNumber(value, name, lineNumber, fallback) {
  if (value === undefined) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Line ${lineNumber}: missing required attribute "${name}"`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Line ${lineNumber}: attribute "${name}" must be a number`);
  }
  return parsed;
}

function readPositiveNumber(value, name, lineNumber, fallback) {
  const parsed = readNumber(value, name, lineNumber, fallback);
  if (parsed <= 0) {
    throw new Error(`Line ${lineNumber}: attribute "${name}" must be greater than 0`);
  }
  return parsed;
}

function readPoint(value, name, lineNumber) {
  if (!value) {
    throw new Error(`Line ${lineNumber}: missing required attribute "${name}"`);
  }

  const parts = value.split(',').map((part) => Number(part));
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) {
    throw new Error(`Line ${lineNumber}: attribute "${name}" must be "x,y"`);
  }
  return parts;
}

function roundTime(value) {
  return Math.round(value * 1000) / 1000;
}
