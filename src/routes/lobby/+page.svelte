<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { io } from '$lib/webSocketConnection';
  import type { Player } from '$lib/game/Player';

  let players: Player[] = $state([]);
  let startCountdown: number = $state(Infinity);

  // The CSS color 'yellow' is almost invisible on a dark background, so we swap it
  function cssColor(color: string): string {
    return color === 'yellow' ? '#facc15' : color;
  }

  onMount(() => {
    function onConnect() {
      io.emit('joinLobby');
      io.emit('playerList');
    }

    function onPlayerList(data: { players: Player[] }) {
      players = data.players;
    }

    function onGameStartCountdown(data?: { remaining: number }) {
      // Use the remaining time from the server so late joiners see the correct number
      startCountdown = data?.remaining ?? 10;
      const interval = setInterval(() => {
        startCountdown--;
        if (startCountdown <= 0) clearInterval(interval);
      }, 1000);
    }

    function onGameStart() {
      goto('/game');
    }

    io.on('connect', onConnect);
    // If the socket is already connected when the page loads (SPA navigation),
    // the 'connect' event won't fire again, so we call onConnect manually
    if (io.connected) onConnect();

    io.on('playerList', onPlayerList);
    io.on('gameStartCountdown', onGameStartCountdown);
    io.on('gameStart', onGameStart);

    return () => {
      io.off('connect', onConnect);
      io.off('playerList', onPlayerList);
      io.off('gameStartCountdown', onGameStartCountdown);
      io.off('gameStart', onGameStart);
    };
  });
</script>

<div class="page">
  <img src="/title.png" alt="Slangen en Ladders" width="285" height="145" />

  <div class="pixel-panel flex flex-col gap-3" style="min-width:240px;">
    <p class="text-[8px] text-gray-400 mb-1">PLAYERS</p>

    <!-- Always show 4 slots; empty ones are grayed out -->
    {#each Array(4) as _, i}
      {#if players[i]}
        <div class="flex items-center gap-3">
          <span class="inline-block w-3 h-3 shrink-0" style="background:{cssColor(players[i].color)};"></span>
          <span class="text-[8px] leading-none" style="color:{cssColor(players[i].color)}">{players[i].name}</span>
        </div>
      {:else}
        <div class="flex items-center gap-3 opacity-25">
          <span class="inline-block w-3 h-3 border border-white shrink-0"></span>
          <span class="text-[8px] text-white leading-none">- - - - - -</span>
        </div>
      {/if}
    {/each}
  </div>

  {#if startCountdown !== Infinity}
    <div class="pixel-panel text-center" style="min-width:240px;">
      <p class="text-[8px] text-white mb-3">STARTING IN</p>
      <p class="text-[36px] leading-none" style="color:#facc15">{startCountdown}</p>
    </div>
  {:else}
    <p class="text-[8px] text-gray-400 blink">WAITING FOR PLAYERS...</p>
  {/if}
</div>
