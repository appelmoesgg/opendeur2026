/**
 * 4 bot agents that each play TOTAL_GAMES consecutive games.
 * Run with:  bun test-agents.ts [url]
 * Default URL: http://localhost:3000
 */

import { io as ioClient, type Socket } from 'socket.io-client';

const SERVER = process.argv[2] ?? 'http://localhost:3000';
const TOTAL_GAMES = 3;
const ROLL_DELAY_MS = 400;
const REJOIN_DELAY_MS = 800; // wait after gameOver before rejoining

type PlayerData = { id: string; name: string; color: string; position: number };

interface AgentState {
  socket: Socket;
  name: string;
  index: number;
  myId: string;
  gameStarted: boolean;
  gamesPlayed: number;
  errors: string[];
}

const agents: AgentState[] = [];

// ── global game-round tracking ──────────────────────────────────────────────
let currentRound = 0;           // which game round (0-indexed)
let gameOverCount = 0;          // how many agents got gameOver this round
let allFinished = false;

function log(agent: AgentState | null, ...args: unknown[]) {
  const prefix = agent ? `[${agent.name.padEnd(7)}]` : '[system ]';
  console.log(prefix, ...args);
}

function warn(agent: AgentState | null, ...args: unknown[]) {
  const prefix = agent ? `[${agent.name.padEnd(7)}]` : '[system ]';
  console.warn('⚠ ', prefix, ...args);
}

// ── per-agent search→lobby→play loop ────────────────────────────────────────

function startSearch(agent: AgentState) {
  if (allFinished) return;
  log(agent, `searching for game (round ${currentRound + 1}/${TOTAL_GAMES})`);
  agent.socket.emit('gameAvailable');
}

function setupAgent(index: number): AgentState {
  const agentName = `Bot ${index + 1}`;
  const socket: Socket = ioClient(SERVER, { reconnection: false });

  const agent: AgentState = {
    socket,
    name: agentName,
    index,
    myId: '',
    gameStarted: false,
    gamesPlayed: 0,
    errors: [],
  };
  agents.push(agent);

  // ── connection ────────────────────────────────────────────────────────────
  socket.on('connect', () => {
    log(agent, `connected (id=${socket.id})`);
    startSearch(agent);
  });

  socket.on('connect_error', (err) => {
    warn(agent, 'connect_error:', err.message);
    agent.errors.push(`connect_error: ${err.message}`);
  });

  // ── availability check ────────────────────────────────────────────────────
  socket.on('gameAvailable', (data: { available: boolean }) => {
    if (allFinished) return;
    if (!data.available) {
      warn(agent, 'game not available — retrying in 1s');
      setTimeout(() => socket.emit('gameAvailable'), 1000);
      return;
    }
    log(agent, 'game available → joining lobby');
    socket.emit('joinLobby');
  });

  // ── lobby ─────────────────────────────────────────────────────────────────
  socket.on('playerList', (data: { players: PlayerData[] }) => {
    const names = data.players.map((p) => p.name).join(', ');
    log(agent, `lobby [${names}]`);
  });

  socket.on('gameStartCountdown', () => {
    log(agent, 'countdown started');
  });

  socket.on('gameStart', () => {
    log(agent, 'game started → checking admission');
    agent.gameStarted = false; // will flip to true after gameAllowed ✓
    socket.emit('gameAllowed');
  });

  // ── game admission ────────────────────────────────────────────────────────
  socket.on('gameAllowed', (data: { allowed: boolean }) => {
    if (!data.allowed) {
      warn(agent, 'gameAllowed=false — was not in lobby!');
      agent.errors.push(`round ${currentRound + 1}: gameAllowed=false`);
      return;
    }
    log(agent, 'admitted → requesting game data');
    socket.emit('requestGameData');
  });

  socket.on('gameData', (data: { myId: string; currentTurnId: string; players: PlayerData[] }) => {
    agent.myId = data.myId;
    agent.gameStarted = true;
    log(agent, `game data received — myId=${data.myId}`);
    maybeTakeTurn(agent, data.currentTurnId);
  });

  // ── gameplay ──────────────────────────────────────────────────────────────
  socket.on(
    'gameStateUpdate',
    (data: {
      players: PlayerData[];
      currentTurnId: string;
      lastRoll: number | null;
      lastRollPlayerId: string | null;
      specialSquare: { from: number; to: number; type: string } | null;
    }) => {
      if (allFinished || !agent.gameStarted) return;

      const me = data.players.find((p) => p.id === agent.myId);
      if (data.lastRoll !== null && data.lastRollPlayerId === agent.myId) {
        const special = data.specialSquare
          ? ` → ${data.specialSquare.type} ${data.specialSquare.from}→${data.specialSquare.to}`
          : '';
        log(agent, `rolled ${data.lastRoll}${special}  (pos=${me?.position ?? '?'})`);
      }

      maybeTakeTurn(agent, data.currentTurnId);
    }
  );

  // ── game over ─────────────────────────────────────────────────────────────
  socket.on('gameOver', (data: { winnerId: string; winnerName: string }) => {
    if (allFinished) return;

    const iWon = data.winnerId === agent.myId;
    agent.gameStarted = false;
    agent.gamesPlayed++;
    log(agent, iWon
      ? `🏆 WON game ${agent.gamesPlayed}/${TOTAL_GAMES}`
      : `game ${agent.gamesPlayed}/${TOTAL_GAMES} over — winner: ${data.winnerName}`
    );

    gameOverCount++;

    // Once all agents have processed this round's gameOver, start the next round
    if (gameOverCount >= agents.length) {
      gameOverCount = 0;
      currentRound++;

      if (currentRound >= TOTAL_GAMES) {
        allFinished = true;
        reportAndExit();
      } else {
        console.log(`\n── Starting round ${currentRound + 1}/${TOTAL_GAMES} ──\n`);
        // Stagger rejoins slightly to avoid simultaneous joinLobby race
        for (const a of agents) {
          const delay = REJOIN_DELAY_MS + a.index * 150;
          setTimeout(() => startSearch(a), delay);
        }
      }
    }
  });

  socket.on('disconnect', (reason) => {
    if (!allFinished) warn(agent, `disconnected: ${reason}`);
  });

  return agent;
}

function maybeTakeTurn(agent: AgentState, currentTurnId: string) {
  if (!agent.gameStarted || !agent.myId || agent.myId !== currentTurnId || allFinished) return;
  log(agent, 'my turn → rolling');
  setTimeout(() => {
    if (!allFinished && agent.gameStarted) agent.socket.emit('rollDice');
  }, ROLL_DELAY_MS);
}

function reportAndExit() {
  setTimeout(() => {
    console.log('\n══ Test summary ══════════════════════════════');
    let allOk = true;
    for (const a of agents) {
      if (a.errors.length) {
        console.error(`  ✗ ${a.name} (${a.gamesPlayed} games): ${a.errors.join(', ')}`);
        allOk = false;
      } else {
        console.log(`  ✓ ${a.name}: ${a.gamesPlayed}/${TOTAL_GAMES} games, no errors`);
      }
    }
    console.log(allOk
      ? `\n✅  All ${TOTAL_GAMES} games completed without errors.`
      : `\n❌  Some agents reported errors.`
    );
    process.exit(allOk ? 0 : 1);
  }, 400);
}

// ── boot: connect all 4 agents with small stagger ───────────────────────────
console.log(`Connecting 4 agents to ${SERVER} for ${TOTAL_GAMES} games …\n`);
(async () => {
  for (let i = 0; i < 4; i++) {
    setupAgent(i);
    await new Promise((r) => setTimeout(r, 200));
  }
})();
