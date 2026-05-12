import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultOutputPath, parseArgs } from './cli.js';

test('default output path strips .board.md before falling back to .md', () => {
  assert.equal(defaultOutputPath('examples/demo.board.md'), 'dist\\demo.mp4');
  assert.equal(defaultOutputPath('examples/notes.md'), 'dist\\notes.mp4');
});

test('parseArgs rejects empty --out= with a clear error', () => {
  assert.throws(
    () => parseArgs(['examples/demo.board.md', '--out=']),
    /--out requires a value/
  );
});

test('parseArgs rejects empty --voice= with a clear error', () => {
  assert.throws(
    () => parseArgs(['examples/demo.board.md', '--voice=']),
    /--voice requires a value/
  );
});

test('parseArgs keeps existing out and voice value behavior', () => {
  assert.deepEqual(
    parseArgs(['examples/demo.board.md', '--out', 'dist/custom.mp4', '--voice', 'audio.wav']),
    {
      inputPath: 'examples/demo.board.md',
      out: 'dist/custom.mp4',
      voice: 'audio.wav'
    }
  );

  assert.deepEqual(
    parseArgs(['examples/demo.board.md', '--out=dist/custom.mp4', '--voice=audio.wav']),
    {
      inputPath: 'examples/demo.board.md',
      out: 'dist/custom.mp4',
      voice: 'audio.wav'
    }
  );
});
