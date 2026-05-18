<script lang="ts">
  import { Graphics } from 'svelte-pixi';
  let { game } = $props();

  const players = $derived(() => game.players);
</script>

{#each players as player (player.id)}
  <Graphics
    x={game.board.getXY(player.position).x}
    y={game.board.getXY(player.position).y}
    draw={(g) => {
      g.clear();
      g.beginFill(player.color);
      g.drawCircle(0, 0, 10);
      g.endFill();
    }}
  />
{/each}