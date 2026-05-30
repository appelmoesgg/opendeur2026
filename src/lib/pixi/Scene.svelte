<script lang="ts">
  import Board from './Board.svelte';
  import Players from './Players.svelte';
  import { onMount } from 'svelte';
  import { Game } from '$lib/game/Game';
  import { Application } from 'svelte-pixi';
  import type { Socket } from 'socket.io-client';

  let { io } = $props<{ io: Socket }>();

  let game: Game = $state(new Game());

  onMount(() => {
    // Add some test players
    game.addPlayer('1', 'Player 1', 'red', 1);
    game.addPlayer('2', 'Player 2', 'blue', 1);
    game.addPlayer('3', 'Player 3', 'yellow', 2);
    game.addPlayer('4', 'Player 4', 'green', 3);

    /*setInterval(() => {
      for (const player of game.players){
        game.updatePlayerPosition(player.id, player.position + 1);
        console.log(player)
      }
      
      game.players = [...game.players];
    }, 500)*/
  });

</script>

<Application width={600} height={600}>
  <Board />
  <Players {game} />
</Application>