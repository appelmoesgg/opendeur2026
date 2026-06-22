<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { io } from '$lib/webSocketConnection.js';

  let status = $state('SEARCHING...');
  let zoeken = $state(false);
  let volgendePoging = $state(0);

  function sendToLobby() {
    goto('/lobby');
  }

  function zoekGame() {
    zoeken = true;
    volgendePoging = 5;
    const intervalID = setInterval(() => {
      volgendePoging--;
      if (volgendePoging <= 0) {
        clearInterval(intervalID);
        zoeken = false;
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
        status = 'GEEN SPEL VRIJ';
        zoekGame();
      }
    });

    io.on('connect', () => {
      status = 'SEARCHING...';
    });

    io.emit('gameAvailable');

    // disconnect alles
    return () => {
      io.off('gameAvailable');
      io.off('connect');
    };
  });
</script>

<div class="page">
  <img src="/title.png" alt="Slangen en Ladders" width="285" height="145" />

  <div class="pixel-panel text-center" style="min-width: 260px;">
    <p class="text-[10px] text-white leading-loose {zoeken ? '' : 'blink'}">{status}</p>
    {#if zoeken}
      <p class="text-[8px] text-gray-400 mt-4 leading-loose">RETRY IN {volgendePoging}...</p>
    {/if}
  </div>
</div>
