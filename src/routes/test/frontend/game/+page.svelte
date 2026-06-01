
<script lang="ts">
  import Scene from '$lib/pixi/Scene.svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { io } from '$lib/webSocketConnection.js';
  import type { Board } from '$lib/game/Board';
  import type { Player } from '$lib/game/Player';

  
  onMount(() => {
      io.on('gameAllowed', (data: { allowed: boolean }) => {
        if (data.allowed) {
          io.emit('requestGameData');
        } else {
          alert("You weren't in the lobby, were you?");
          io.disconnect();
          window.location.href = '/test/frontend';
        }
      });
      
      io.on('connect', () => {
          console.log('Connected to server');
          io.emit("gameAllowed");
      });

      io.on('gameData', (data: { board: Board, players: Player[] }) => {
          console.log('Received game data:', data);
      });

      io.on('disconnect', () => {
          console.log('Disconnected from server');
      });

      return () => {
        io.disconnect();
      };
  });
</script>

<div class="flex flex-col h-full w-full items-center justify-center">
  <img src="/title.png" alt="logo" style="image-rendering:pixelated;" class="mb-4" width="570" height="290">
  {#if browser}
    <Scene {io} />
  {/if}
</div>