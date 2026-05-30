<script lang="ts">
  import { Sprite } from 'svelte-pixi';
  import { Assets, Texture } from 'pixi.js';
  import type { Player } from '$lib/game/Player';

  let { game } = $props();

  const players = $derived(game.players);

  const drawQueue = $derived.by(() => {
    const queue: Record<number, Player[]> = {};
    for (const player of players) {
      if (!queue[player.position]) queue[player.position] = [];
      queue[player.position].push(player);
    }
    return queue;
  });

  const drawCells = $derived(Object.keys(drawQueue).map(Number));

  let textures = $state<Record<string, Texture>>({});

  $effect(() => {
    loadTextures();
  });

  async function loadTextures() {
    for (const player of players) {
      if (!textures[player.color]) {
        const texture = await Assets.load(`/${player.color}pion.png`);
        texture.source.scaleMode = 'nearest';
        textures[player.color] = texture;
      }
    }
  }
</script>

{#each drawCells as cellNr}
  {#each drawQueue[cellNr] as player, i}
    {#if textures[player.color]}
      <Sprite
        texture={textures[player.color]}
        x={game.board.getXY(player.position, i).x}
        y={game.board.getXY(player.position, i).y}
        anchor={0.5}
        scale={3}
      />
    {/if}
  {/each}
{/each}