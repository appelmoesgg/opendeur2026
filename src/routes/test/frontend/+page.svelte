<script lang="ts">
  import { onMount } from 'svelte';
  import { io } from '$lib/webSocketConnection.js';

  let coolText: string = $state("");

  function sendToLobby() {
    window.location.href = '/test/frontend/lobby';
  }

  function retryGameAvailable() {
    let secs = 5;
    let intervalID = setInterval(() => {
      coolText = "No game available... retrying in " + secs + " seconds";
      secs--;

      if (secs < 0) {
        clearInterval(intervalID);
        io.emit("gameAvailable");
      }


    }, 1000);
  }

  onMount(() => {
      io.on('gameAvailable', (data: { available: boolean}) => {
        if (data.available) {
          sendToLobby();
        } else {
          retryGameAvailable();
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

<p class="text-2xl font-bold text-center text-white">{coolText}</p>