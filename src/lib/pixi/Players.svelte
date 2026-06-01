<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { Sprite as PixiSprite } from 'pixi.js';
  import type { Container, Texture } from 'pixi.js';
  import type { Player } from '$lib/game/Player';

  let { game, textures } = $props<{ game: any; textures: Record<string, Texture> }>();

  const { container } = getContext<{ container: Container }>('pixi/container');
  const sprites = new Map<string, PixiSprite>();

  $effect(() => {
    const players = game.players as Player[];

    for (const player of players) {
      const texture = textures[player.color];
      if (!texture) continue;

      if (!sprites.has(player.id)) {
        const sprite = new PixiSprite(texture);
        sprite.anchor.set(0.5);
        sprite.scale.set(3);
        container.addChild(sprite);
        sprites.set(player.id, sprite);
      }

      const sprite = sprites.get(player.id)!;
      const offset = players.filter(p => p.position === player.position).indexOf(player);
      const pos = game.board.getXY(player.position, offset);
      sprite.x = pos.x;
      sprite.y = pos.y;
    }

    const playerIds = new Set(players.map(p => p.id));
    for (const [id, sprite] of [...sprites.entries()]) {
      if (!playerIds.has(id)) {
        container.removeChild(sprite);
        sprite.destroy();
        sprites.delete(id);
      }
    }
  });

  onDestroy(() => {
    for (const sprite of sprites.values()) {
      container?.removeChild(sprite);
      sprite.destroy();
    }
    sprites.clear();
  });
</script>
