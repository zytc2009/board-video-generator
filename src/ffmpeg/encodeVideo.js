import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function assertFfmpegAvailable() {
  try {
    await run('ffmpeg', ['-version']);
  } catch (error) {
    throw new Error('FFmpeg is required but was not found on PATH. Install FFmpeg and try again.');
  }
}

export async function encodeVideo({ framesDir, fps, outputPath, voicePath }) {
  validateEncodeVideoArgs({ framesDir, fps, outputPath, voicePath });

  const outputDir = path.dirname(outputPath);
  const tempVideo = voicePath ? getTempVideoPath(outputPath) : outputPath;

  await fs.mkdir(outputDir, { recursive: true });
  if (voicePath) {
    await fs.mkdir(path.dirname(tempVideo), { recursive: true });
  }

  await run('ffmpeg', [
    '-y',
    '-framerate',
    String(fps),
    '-i',
    path.join(framesDir, '%06d.png'),
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    tempVideo
  ]);

  if (voicePath) {
    await run('ffmpeg', [
      '-y',
      '-i',
      tempVideo,
      '-i',
      voicePath,
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-shortest',
      outputPath
    ]);
  }
}

function validateEncodeVideoArgs({ framesDir, fps, outputPath, voicePath }) {
  if (typeof framesDir !== 'string' || framesDir.trim() === '') {
    throw new Error('framesDir must be a non-empty string.');
  }

  if (typeof outputPath !== 'string' || outputPath.trim() === '') {
    throw new Error('outputPath must be a non-empty string.');
  }

  if (typeof fps !== 'number' || !Number.isFinite(fps) || fps <= 0) {
    throw new Error('fps must be a finite number greater than 0.');
  }

  if (voicePath !== undefined && voicePath !== null && (typeof voicePath !== 'string' || voicePath.trim() === '')) {
    throw new Error('voicePath must be a non-empty string when provided.');
  }
}

function getTempVideoPath(outputPath) {
  const parsed = path.parse(outputPath);
  const name = parsed.name || 'output';
  return path.join(parsed.dir, `${name}.video-only.mp4`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}\n${stderr}`));
    });
  });
}
