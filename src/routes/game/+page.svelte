<script lang="ts">
  import Scene from '$lib/pixi/Scene.svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { io } from '$lib/webSocketConnection.js';
  import type { Texture } from 'pixi.js';

  type SpeciaalVakje = { from: number; to: number; type: 'snake' | 'ladder' };
  type PlayerData = { id: string; name: string; color: string; position: number };

  let playerList = $state<PlayerData[]>([]);
  let mijnId = $state('');
  let actieveSpeler = $state('');
  let laatsteRol: number | null = $state(null);
  let winner: { id: string; name: string } | null = $state(null);
  let speciaalVakjeBericht = $state('');
  let textures = $state<Record<string, Texture>>({});

  // veranderd automatisch als mijnId, actieveSpeler of winner verandert
  const isMyTurn = $derived(mijnId !== '' && mijnId === actieveSpeler && !winner);

  $effect(() => {
    if (speciaalVakjeBericht) {
      const t = setTimeout(() => (speciaalVakjeBericht = ''), 3000);
      return () => clearTimeout(t);
    }
  });

  // update alles zodat svelte dit detecteert
  function syncPlayers(updated: PlayerData[]) {
    playerList = [...updated];
  }

  function findPlayer(id: string): PlayerData | undefined {
    return playerList.find((p) => p.id === id);
  }

  onMount(() => {
    function onGameAllowed(data: { allowed: boolean }) {
      if (data.allowed) {
        io.emit('requestGameData');
      } else {
        alert("Zat gij wel met de rest in de lobby vriend?\nPeist nie.");
        io.disconnect();
        window.location.href = '/';
      }
    }

    async function onGameData(data: {
      players: PlayerData[];
      actieveSpeler: string;
      mijnId: string;
    }) {
      mijnId = data.mijnId;
      actieveSpeler = data.actieveSpeler;
      syncPlayers(data.players);

      //
      const { Assets } = await import('pixi.js');
      for (const player of data.players) {
        if (!textures[player.color]) {
          const texture = await Assets.load(`/${player.color}pion.png`);
          texture.source.scaleMode = 'nearest';
          textures[player.color] = texture;
        }
      }
    }

    function onGameStateUpdate(data: {
      players: PlayerData[];
      actieveSpeler: string;
      laatsteRol: number | null;
      laatsteRolPlayerId: string | null;
      speciaalVakje: SpeciaalVakje | null;
    }) {
      actieveSpeler = data.actieveSpeler ?? '';
      if (data.laatsteRol !== null) laatsteRol = data.laatsteRol;
      syncPlayers(data.players);
      if (data.speciaalVakje) {
        const sq = data.speciaalVakje;
        speciaalVakjeBericht =
          sq.type === 'snake' ? `Slang! ${sq.from} → ${sq.to}` : `Ladder! ${sq.from} → ${sq.to}`;
      }
    }

    function onGameOver(data: { winnerId: string; winnerName: string }) {
      winner = { id: data.winnerId, name: data.winnerName };
    }

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
    };
  });

  function rollDobbelsteen() {
    if (isMyTurn) io.emit('rollDobbelsteen');
  }
</script>

<div class="page" style="gap:12px">
  <img src="/title.png" alt="logo" width="285" height="145" />

  <div class="flex flex-col md:flex-row gap-4 items-center md:items-start">
    <!-- The canvas is only created in the browser, not on the server -->
    <div class="board-container">
        <Scene players={playerList} {textures} />
    </div>

    <div class="sidebar pixel-panel">
      {#if winner}
        <div class="text-center">
          <p class="text-[8px] leading-loose" style="color:{findPlayer(winner.id)?.color ?? 'white'}">
            {winner.name.toUpperCase()}<br />WINS!
          </p>
          <a href="/" class="text-[7px] text-gray-400 underline leading-loose mt-4 block">PLAY AGAIN</a>
        </div>
      {:else}
        <div class="w-full flex flex-col gap-2">
          {#each playerList as player}
            <div class="flex items-center gap-2" style="opacity:{player.id === actieveSpeler ? 1 : 0.5}">
              <span class="inline-block w-2 h-2 shrink-0" style="background:{player.color}"></span>
              <span class="text-[7px] leading-none truncate" style="color:{player.color}">{player.name.toUpperCase()}</span>
            </div>
          {/each}
        </div>

        <div class="pixel-panel-inset flex items-center justify-center" style="width:72px;height:72px;">
          {#if laatsteRol !== null}
            <img src="/{laatsteRol}.png" alt="dice {laatsteRol}" width="56" height="56" />
          {/if}
        </div>

        {#if speciaalVakjeBericht}
          <p class="text-[7px] text-yellow-300 text-center leading-loose">{speciaalVakjeBericht}</p>
        {/if}

        <button
          onclick={rollDobbelsteen}
          disabled={!isMyTurn}
          style="opacity:{isMyTurn ? 1 : 0.3}; cursor:{isMyTurn ? 'pointer' : 'not-allowed'}"
        >
          <img src="/Rolknop.png" alt="Roll" width="112" />
        </button>

        {#if isMyTurn}
          <p class="text-[7px] text-yellow-300 text-center leading-loose blink">T'IS AAN U!</p>
        {:else if actieveSpeler}
          <p class="text-[7px] text-gray-400 text-center leading-loose">{findPlayer(actieveSpeler)?.name.toUpperCase() ?? '...'}'S<br />BEURT</p>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .board-container {
    width: min(600px, 95vw);
    aspect-ratio: 1;
  }
</style>
