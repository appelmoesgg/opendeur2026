<script lang="ts">
  import Scene from '$lib/pixi/Scene.svelte';
  import { onMount } from 'svelte';
  import { io } from '$lib/webSocketConnection.js';

  function sendToLobby() {
    window.location.href = '/test/frontend/lobby';
  }

  onMount(() => {
      io.on('gameAvailable', (data: { available: boolean}) => {
        if (data.available) {
          //sendToLobby();
        } else {
          alert("No game free... try again later");
        }
      });
      
      io.on('connect', () => {
          console.log('Connected to server');
      });

      io.emit("gameAvailable");

      return () => {
        io.disconnect();
      };
  });
</script>

<div class="flex flex-col h-full w-full items-center justify-center">
  <img src="/title.png" alt="logo" style="image-rendering:pixelated;" class="mb-4" width="570" height="290">
  <Scene {io} />
</div>