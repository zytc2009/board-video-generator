import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);

function usage() {
  return 'Usage: npm run render -- <input.board.md> [--out output.mp4] [--voice voice.wav]';
}

export function defaultOutputPath(inputPath) {
  const filename = path.basename(inputPath);
  const basename = filename.endsWith('.board.md')
    ? filename.slice(0, -'.board.md'.length)
    : path.basename(filename, path.extname(filename));
  return path.join('dist', `${basename}.mp4`);
}

export function parseArgs(argv) {
  const args = {};
  const positionals = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--out' || arg === '--voice') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${arg} requires a value`);
      }
      args[arg.slice(2)] = value;
      i += 1;
      continue;
    }

    if (arg.startsWith('--out=')) {
      const value = arg.slice('--out='.length);
      if (!value) {
        throw new Error('--out requires a value');
      }
      args.out = value;
      continue;
    }

    if (arg.startsWith('--voice=')) {
      const value = arg.slice('--voice='.length);
      if (!value) {
        throw new Error('--voice requires a value');
      }
      args.voice = value;
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    positionals.push(arg);
  }

  if (positionals.length > 1) {
    throw new Error(`Unexpected argument: ${positionals[1]}`);
  }

  if (positionals.length === 0) {
    throw new Error(usage());
  }

  return {
    inputPath: positionals[0],
    out: args.out,
    voice: args.voice
  };
}

async function main() {
  const { parseBoardMarkdown } = await import('./parser/parseBoardMarkdown.js');
  const { captureFrames } = await import('./render/captureFrames.js');
  const { assertFfmpegAvailable, encodeVideo } = await import('./ffmpeg/encodeVideo.js');
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(args.inputPath);
  const source = await fs.readFile(inputPath, 'utf8');
  const plan = parseBoardMarkdown(source);
  const outputPath = path.resolve(args.out ?? defaultOutputPath(inputPath));
  const framesDir = path.join('.frames', path.basename(outputPath, '.mp4'));

  console.log(`Rendering ${inputPath}`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await assertFfmpegAvailable();

  console.log('Capturing frames');
  const captureResult = await captureFrames(plan, { framesDir });
  console.log(`Captured ${captureResult.totalFrames} frames`);

  await encodeVideo({
    framesDir: captureResult.framesDir,
    fps: plan.fps,
    outputPath,
    voicePath: args.voice ? path.resolve(args.voice) : undefined
  });

  console.log(`Wrote ${outputPath}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
