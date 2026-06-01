<script lang="ts">
  import Scene from '$lib/pixi/Scene.svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { io } from '$lib/webSocketConnection.js';
  import type { Texture } from 'pixi.js';

  type SpecialSquare = { from: number; to: number; type: 'snake' | 'ladder' };
  type PlayerData = { id: string; name: string; color: string; position: number };

  let playerList = $state<PlayerData[]>([]);
  let myId = $state('');
  let currentTurnId = $state('');
  let lastRoll: number | null = $state(null);
  let winner: { id: string; name: string } | null = $state(null);
  let specialSquareMsg = $state('');
  let textures = $state<Record<string, Texture>>({});

  const isMyTurn = $derived(myId !== '' && myId === currentTurnId && !winner);

  $effect(() => {
    if (specialSquareMsg) {
      const t = setTimeout(() => (specialSquareMsg = ''), 2500);
      return () => clearTimeout(t);
    }
  });

  function syncPlayers(updated: PlayerData[]) {
    playerList = [...updated];
  }

  function findPlayer(id: string): PlayerData | undefined {
    return playerList.find(p => p.id === id);
  }

  onMount(() => {
    const onGameAllowed = (data: { allowed: boolean }) => {
      if (data.allowed) {
        io.emit('requestGameData');
      } else {
        alert("You weren't in the lobby, were you?");
        io.disconnect();
        window.location.href = '/test/frontend';
      }
    };

    const onGameData = async (data: { players: PlayerData[]; currentTurnId: string; myId: string }) => {
      myId = data.myId;
      currentTurnId = data.currentTurnId;
      syncPlayers(data.players);

      const { Assets } = await import('pixi.js');
      for (const player of data.players) {
        if (!textures[player.color]) {
          const texture = await Assets.load(`/${player.color}pion.png`);
          texture.source.scaleMode = 'nearest';
          textures[player.color] = texture;
        }
      }
    };

    const onGameStateUpdate = (data: {
      players: PlayerData[];
      currentTurnId: string;
      lastRoll: number | null;
      lastRollPlayerId: string | null;
      specialSquare: SpecialSquare | null;
    }) => {
      currentTurnId = data.currentTurnId ?? '';
      if (data.lastRoll !== null) lastRoll = data.lastRoll;
      syncPlayers(data.players);
      if (data.specialSquare) {
        const sq = data.specialSquare;
        specialSquareMsg = sq.type === 'snake'
          ? `🐍 Snake! ${sq.from} → ${sq.to}`
          : `🪜 Ladder! ${sq.from} → ${sq.to}`;
      }
    };

    const onGameOver = (data: { winnerId: string; winnerName: string }) => {
      winner = { id: data.winnerId, name: data.winnerName };
    };

    io.on('gameAllowed', onGameAllowed);
    io.on('gameData', onGameData);
    io.on('gameStateUpdate', onGameStateUpdate);
    io.on('gameOver', onGameOver);
    io.on('connect', () => io.emit('gameAllowed'));
    if (io.connected) io.emit('gameAllowed');

    return () => {
      io.off('gameAllowed', onGameAllowed);
      io.off('gameData', onGameData);
      io.off('gameStateUpdate', onGameStateUpdate);
      io.off('gameOver', onGameOver);
      io.disconnect();
    };
  });

  function rollDice() {
    if (isMyTurn) io.emit('rollDice');
  }

  function cssColor(color: string): string {
    return color === 'yellow' ? '#facc15' : color;
  }
</script>

<div class="flex flex-col items-center justify-center h-full w-full gap-3">
  <img src="/title.png" alt="logo" style="image-rendering:pixelated;" width="285" height="145" />

  <div class="flex gap-4 items-start">
    {#if browser}
      <Scene players={playerList} {textures} />
    {/if}

    <div class="pixel-panel flex flex-col items-center gap-4 text-white self-stretch justify-center" style="min-width:148px;">
      {#if winner}
        <div class="text-center flex flex-col gap-4">
          <p class="text-[8px] leading-loose" style="color:{cssColor(findPlayer(winner.id)?.color ?? 'white')}">
            {winner.name.toUpperCase()}<br/>WINS!
          </p>
          <a href="/test/frontend" class="text-[7px] text-gray-400 underline leading-loose">PLAY AGAIN</a>
        </div>
      {:else}
        <div class="w-full flex flex-col gap-2">
          {#each playerList as player}
            <div class="flex items-center gap-2">
              <span class="inline-block w-2 h-2 shrink-0 {player.id === currentTurnId ? '' : 'opacity-50'}" style="background:{cssColor(player.color)};"></span>
              <span class="text-[7px] leading-none truncate {player.id === currentTurnId ? '' : 'opacity-50'}" style="color:{cssColor(player.color)}">{player.name.toUpperCase()}</span>
            </div>
          {/each}
        </div>

        <div class="pixel-panel-inset flex items-center justify-center" style="width:72px;height:72px;">
          {#if lastRoll !== null}
            <img src="/{lastRoll}.png" alt="dice {lastRoll}" width="56" height="56" />
          {/if}
        </div>

        {#if specialSquareMsg}
          <p class="text-[7px] text-yellow-300 text-center leading-loose">{specialSquareMsg}</p>
        {/if}

        <button
          onclick={rollDice}
          disabled={!isMyTurn}
          style="opacity:{isMyTurn ? 1 : 0.3}; cursor:{isMyTurn ? 'pointer' : 'not-allowed'}"
        >
          <img src="/Rolknop.png" alt="Roll" width="112" />
        </button>

        {#if isMyTurn}
          <p class="text-[7px] text-yellow-300 text-center leading-loose blink">YOUR TURN!</p>
        {:else if currentTurnId}
          <p class="text-[7px] text-gray-400 text-center leading-loose">{findPlayer(currentTurnId)?.name.toUpperCase() ?? '...'}'S<br/>TURN</p>
        {/if}
      {/if}
    </div>
  </div>
</div>
