import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBoardMarkdown } from './parseBoardMarkdown.js';

test('parses demo board directives into a scene plan', () => {
  const source = `# Newton's Second Law

::write duration=1.2 x=120 y=120
Newton's Second Law
::

::formula duration=1.0 x=160 y=260
F = ma
::

::arrow duration=0.8 from=260,300 to=500,300
::
`;

  const plan = parseBoardMarkdown(source);

  assert.equal(plan.fps, 30);
  assert.equal(plan.width, 1920);
  assert.equal(plan.height, 1080);
  assert.equal(plan.theme, 'whiteboard');
  assert.equal(plan.scenes.length, 1);
  assert.equal(plan.scenes[0].title, "Newton's Second Law");
  assert.equal(plan.scenes[0].actions.length, 3);
  assert.deepEqual(plan.scenes[0].actions[0], {
    type: 'write',
    text: "Newton's Second Law",
    x: 120,
    y: 120,
    start: 0,
    duration: 1.2
  });
  assert.deepEqual(plan.scenes[0].actions[2], {
    type: 'arrow',
    from: [260, 300],
    to: [500, 300],
    start: 2.2,
    duration: 0.8
  });
  assert.equal(plan.scenes[0].duration, 4);
});

test('throws a line-numbered error for unsupported directives', () => {
  const source = `# Bad

::spin duration=1
Nope
::
`;

  assert.throws(
    () => parseBoardMarkdown(source),
    /Line 3: unsupported directive "spin"/
  );
});

test('throws a line-numbered error for non-positive duration', () => {
  const source = `# Bad

::write duration=0
Nope
::
`;

  assert.throws(
    () => parseBoardMarkdown(source),
    /Line 3: attribute "duration" must be greater than 0/
  );
});

test('throws a line-numbered error for non-positive box width', () => {
  const source = `::box width=0 height=120
::
`;

  assert.throws(
    () => parseBoardMarkdown(source),
    /Line 1: attribute "width" must be greater than 0/
  );
});

test('throws a line-numbered error for non-positive box height', () => {
  const source = `::box width=120 height=-1
::
`;

  assert.throws(
    () => parseBoardMarkdown(source),
    /Line 1: attribute "height" must be greater than 0/
  );
});

test('parses box directives', () => {
  const plan = parseBoardMarkdown(`::box duration=0.8 x=140 y=230 width=460 height=130
::`);

  assert.deepEqual(plan.scenes[0].actions[0], {
    type: 'box',
    x: 140,
    y: 230,
    width: 460,
    height: 130,
    start: 0,
    duration: 0.8
  });
});
