<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { io } from '$lib/webSocketConnection.js';

  let status = $state('SEARCHING...');
  let retrying = $state(false);
  let retryIn = $state(0);

  function sendToLobby() {
    goto('/test/frontend/lobby');
  }

  function retryGameAvailable() {
    retrying = true;
    retryIn = 5;
    const intervalID = setInterval(() => {
      retryIn--;
      if (retryIn <= 0) {
        clearInterval(intervalID);
        retrying = false;
        status = 'SEARCHING...';
        io.emit('gameAvailable');
      }
    }, 1000);
  }

  onMount(() => {
    io.on('gameAvailable', (data: { available: boolean }) => {
      if (data.available) {
        sendToLobby();
      } else {
        status = 'NO GAME FOUND';
        retryGameAvailable();
      }
    });

    io.on('connect', () => {
      status = 'SEARCHING...';
    });

    io.emit('gameAvailable');

    return () => {
      io.off('gameAvailable');
      io.off('connect');
    };
  });
</script>

<div class="flex flex-col items-center justify-center h-full w-full gap-6">
  <img src="/title.png" alt="Slangen en Ladders" width="285" height="145" />

  <div class="pixel-panel text-center" style="min-width: 260px;">
    <p class="text-[10px] text-white leading-loose {retrying ? '' : 'blink'}">{status}</p>
    {#if retrying}
      <p class="text-[8px] text-gray-400 mt-4 leading-loose">RETRY IN {retryIn}...</p>
    {/if}
  </div>
</div>
