import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function isFinitePositiveNumber(value) {
  return Number.isFinite(value) && value > 0;
}

function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function validatePlan(plan) {
  if (!isFinitePositiveNumber(plan?.width)) {
    throw new Error('Invalid board plan: width must be a finite number greater than 0.');
  }

  if (!isFinitePositiveNumber(plan.height)) {
    throw new Error('Invalid board plan: height must be a finite number greater than 0.');
  }

  if (!isFinitePositiveNumber(plan.fps)) {
    throw new Error('Invalid board plan: fps must be a finite number greater than 0.');
  }

  if (!Array.isArray(plan.scenes) || plan.scenes.length === 0) {
    throw new Error('Invalid board plan: scenes must be a non-empty array.');
  }

  for (const [index, scene] of plan.scenes.entries()) {
    if (!isFinitePositiveNumber(scene?.duration)) {
      throw new Error(`Invalid board plan: scenes[${index}].duration must be a finite number greater than 0.`);
    }
  }

  const totalDuration = plan.scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const totalFrames = Math.ceil(totalDuration * plan.fps);

  if (totalFrames < 1) {
    throw new Error('Invalid board plan: total frame count must be at least 1.');
  }

  return { totalFrames };
}

function resolveFramesDir(framesDir) {
  if (typeof framesDir !== 'string' || framesDir.length === 0) {
    throw new Error('Invalid framesDir: output directory must be a non-empty string.');
  }

  const projectRoot = path.resolve(__dirname, '../..');
  const safeFramesRoot = path.join(projectRoot, '.frames');
  const resolvedFramesDir = path.isAbsolute(framesDir)
    ? path.resolve(framesDir)
    : path.resolve(projectRoot, framesDir);

  if (!isPathInside(resolvedFramesDir, safeFramesRoot)) {
    throw new Error('Invalid framesDir: output directory must be a descendant of the project .frames directory.');
  }

  return resolvedFramesDir;
}

export async function captureFrames(plan, options) {
  const { totalFrames } = validatePlan(plan);
  const framesDir = resolveFramesDir(options?.framesDir);

  await fs.rm(framesDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: {
      width: plan.width,
      height: plan.height,
      deviceScaleFactor: 1
    }
  });

  try {
    const page = await browser.newPage();
    const htmlPath = path.resolve(__dirname, '../composition/index.html');
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    await page.evaluate((scenePlan) => window.__loadBoardPlan(scenePlan), plan);

    for (let frame = 0; frame < totalFrames; frame += 1) {
      const seconds = frame / plan.fps;
      await page.evaluate((time) => window.__setBoardTime(time), seconds);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
      const filename = `${String(frame + 1).padStart(6, '0')}.png`;
      await page.screenshot({
        path: path.join(framesDir, filename),
        type: 'png'
      });
    }

    return { framesDir, totalFrames };
  } finally {
    await browser.close();
  }
}
