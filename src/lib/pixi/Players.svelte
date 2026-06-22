<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { Sprite as PixiSprite } from 'pixi.js';
  import type { Container, Texture } from 'pixi.js';
  import type { Player } from '$lib/game/Player';

  let { game, textures } = $props<{ game: any; textures: Record<string, Texture> }>();

  const { spelbord } = getContext<{ spelbord: Container }>('pixi/container');
  // string: playerid, PixiSprite: tekeningetje van de speler
  const spelerSprites = new Map<string, PixiSprite>();

  $effect(() => {
    const players: Player[] = game.players;

    for (const player of players) {
      const texture = textures[player.color];
      if (!texture) continue;

      if (!spelerSprites.has(player.id)) {
        const sprite = new PixiSprite(texture);
        sprite.anchor.set(0.5);
        sprite.scale.set(3);
        spelbord.addChild(sprite);
        spelerSprites.set(player.id, sprite);
      }

      const sprite = spelerSprites.get(player.id)!;
      // offset gebaseerd op aantal spelers op et vakje, anders worden ze over elkaar getekend
      const offset = players.filter(p => p.position === player.position).indexOf(player);
      const positie = game.board.getXY(player.position, offset);
      sprite.x = positie.x;
      sprite.y = positie.y;
    }

    const playerIds = new Set(players.map(p => p.id));
    for (const [id, sprite] of [...spelerSprites.entries()]) {
      if (!playerIds.has(id)) {
        spelbord.removeChild(sprite);
        sprite.destroy();
        spelerSprites.delete(id);
      }
    }
  });

  onDestroy(() => {
    for (const sprite of spelerSprites.values()) {
      spelbord?.removeChild(sprite);
      sprite.destroy();
    }
    spelerSprites.clear();
  });
</script>
