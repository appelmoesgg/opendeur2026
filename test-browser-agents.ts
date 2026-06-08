/**
 * 4 Playwright browser agents that play TOTAL_GAMES through the real UI.
 * Usage: bun test-browser-agents.ts [server-url] [--headless]
 * Defaults: http://localhost:3000, headed (visible)
 *
 * Each game starts with a hard page.goto so every socket connection is fresh.
 * isEnabled uses a short timeout so the loop doesn't block when the roll
 * button disappears after game-over.
 */

import { chromium, type Browser, type Page } from 'playwright';

const SERVER = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:3000';
const HEADLESS = process.argv.includes('--headless');
const TOTAL_GAMES = 3;
const BTN_TIMEOUT = 300; // ms: max time to wait for roll button to resolve

type Result = { name: string; gamesPlayed: number; errors: string[] };

function log(name: string, ...args: unknown[]) {
  console.log(`[${name.padEnd(7)}]`, ...args);
}
function warn(name: string, ...args: unknown[]) {
  console.warn(`⚠ [${name.padEnd(7)}]`, ...args);
}

async function playOneGame(page: Page, name: string, gameNum: number): Promise<void> {
  // Hard navigate — creates a fresh socket connection every game
  log(name, `game ${gameNum}/${TOTAL_GAMES} — loading page`);
  await page.goto(`${SERVER}/`);

  // Socket on the page emits gameAvailable → server redirects to lobby
  await page.waitForURL(`**/lobby`, { timeout: 20_000 }).catch(() => {
    throw new Error(`game ${gameNum}: timed out waiting for lobby`);
  });
  log(name, `in lobby`);

  // Lobby countdown fires → gameStart → page redirects to game
  await page.waitForURL(`**/game`, { timeout: 40_000 }).catch(() => {
    throw new Error(`game ${gameNum}: timed out waiting for game to start`);
  });
  log(name, `game started`);

  let rolled = 0;
  while (true) {
    // Game over when "PLAY AGAIN" link appears (isVisible never blocks)
    const playAgain = page.locator('a', { hasText: 'PLAY AGAIN' });
    if (await playAgain.isVisible()) {
      log(name, `game ${gameNum} finished after ${rolled} rolls`);
      return;
    }

    // Roll if it's our turn.
    // Use a short timeout so we don't block here when the button disappears at game-over.
    const rollBtn = page.locator('button:has(img[alt="Roll"])');
    const enabled = await rollBtn.isEnabled({ timeout: BTN_TIMEOUT }).catch(() => false);
    if (enabled) {
      await rollBtn.click({ timeout: BTN_TIMEOUT }).catch(() => {});
      rolled++;
      await page.waitForTimeout(250);
    } else {
      await page.waitForTimeout(80);
    }
  }
}

async function runAgent(index: number, browser: Browser): Promise<Result> {
  const name = `Bot ${index + 1}`;
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  let gamesPlayed = 0;

  try {
    for (let g = 1; g <= TOTAL_GAMES; g++) {
      await playOneGame(page, name, g);
      gamesPlayed++;
    }
    log(name, `✓ all ${TOTAL_GAMES} games done`);
  } catch (err: any) {
    warn(name, err.message);
    errors.push(err.message);
    await page.screenshot({ path: `debug-${name.replace(' ', '')}.png` }).catch(() => {});
  }

  await context.close();
  return { name, gamesPlayed, errors };
}

async function main() {
  console.log(`Starting 4 browser agents against ${SERVER} (${HEADLESS ? 'headless' : 'headed'}) …\n`);

  const browser = await chromium.launch({ headless: HEADLESS, slowMo: HEADLESS ? 0 : 30 });

  // All 4 agents run in parallel — they need to arrive in the lobby together
  const results = await Promise.all([0, 1, 2, 3].map((i) => runAgent(i, browser)));

  await browser.close();

  console.log('\n══ Browser test summary ══════════════════════════════');
  let allOk = true;
  for (const r of results) {
    if (r.errors.length) {
      console.error(`  ✗ ${r.name} (${r.gamesPlayed}/${TOTAL_GAMES} games): ${r.errors.join('; ')}`);
      allOk = false;
    } else {
      console.log(`  ✓ ${r.name}: ${r.gamesPlayed}/${TOTAL_GAMES} games, no errors`);
    }
  }
  console.log(allOk ? '\n✅  All games passed.' : '\n❌  Some agents failed.');
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
