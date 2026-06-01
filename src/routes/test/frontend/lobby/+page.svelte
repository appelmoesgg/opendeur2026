<script lang="ts">
  import { onMount } from 'svelte';
  import { io } from '$lib/webSocketConnection';
  import type { Player } from '$lib/game/Player';
  
  let { players }: { players: Player[] } = $state({
    players: []
 });

  let startCountdown: number = $state(Infinity);

  function sendToGame() {
    window.location.href = '/test/frontend/game';
  }

  onMount(() => {
    const onConnect = () => {
        console.log('Connected');
        io.emit('joinLobby');
        io.emit('playerList');
    };

    const onLobbyJoinCB = (data: { success: boolean, reason: string }) => {
        if (!data.success) {
            alert(data.reason);
            window.location.href = '/test/frontend';
        }
    };

    const onPlayerList = (data: { players: Player[] }) => {
        players = data.players;
    };

    const onGameStartCountDown = () => {
        startCountdown = 30;
        const interval = setInterval(() => {
            startCountdown -= 1;
            if (startCountdown <= 0) {
                clearInterval(interval);
            }
        }, 1000);
    }

    const onGameStart = () => {
        sendToGame();
    }

    io.on('connect', onConnect);
    io.on('playerList', onPlayerList);
    io.on('gameStartCountdown', onGameStartCountDown);
    io.on('gameStart', onGameStart);

    return () => {
        io.off('connect', onConnect);
        io.off('playerList', onPlayerList);
        io.off('gameStartCountdown', onGameStartCountDown);
        io.off('gameStart', onGameStart);
    };
});
</script>

<div class="flex flex-col h-full w-full items-center justify-center">
  <img src="/title.png" alt="logo" style="image-rendering:pixelated;" class="mb-10" width="285" height="145">
  <p class="text-white font-bold text-6xl">Lobby</p>
  <p class="text-white font-bold text-2xl">{players.length}/4 players</p>
  {#if startCountdown !== Infinity }
    <p class="text-white font-bold text-2xl">Game starting in {startCountdown} seconds...</p>
  {:else}
    <p class="text-white font-bold text-2xl">Waiting for players...</p>
  {/if}
</div>