<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Application as PixiApp, Sprite, Assets } from 'pixi.js';
  import { Board } from '$lib/game/Board';
  import type { Texture } from 'pixi.js';

  type PlayerData = { id: string; color: string; position: number };

  let { players, textures }: { players: PlayerData[]; textures: Record<string, Texture> } = $props();

  const board = new Board(5, 5);
  let container: HTMLDivElement;
  let app: PixiApp | null = null;
  let appReady = $state(false);
  const sprites = new Map<string, Sprite>();

  onMount(async () => {
    app = new PixiApp();
    await app.init({ width: 600, height: 600, background: 0x111111 });
    container.appendChild(app.canvas);

    const bgTexture = await Assets.load('/background.png');
    bgTexture.source.scaleMode = 'nearest';
    const bg = new Sprite(bgTexture);
    bg.width = 600;
    bg.height = 600;
    app.stage.addChild(bg);

    appReady = true;
  });

  $effect(() => {
    if (!appReady || !app) return;

    for (const player of players) {
      const texture = textures[player.color];
      if (!texture) continue;

      if (!sprites.has(player.id)) {
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.scale.set(3);
        app.stage.addChild(sprite);
        sprites.set(player.id, sprite);
      }

      const sprite = sprites.get(player.id)!;
      const offset = players.filter(p => p.position === player.position).indexOf(player);
      const pos = board.getXY(player.position, offset);
      sprite.x = pos.x;
      sprite.y = pos.y;
    }

    const playerIds = new Set(players.map(p => p.id));
    for (const [id, sprite] of [...sprites.entries()]) {
      if (!playerIds.has(id)) {
        app.stage.removeChild(sprite);
        sprite.destroy();
        sprites.delete(id);
      }
    }
  });

  onDestroy(() => {
    app?.destroy(true);
  });
</script>

<div bind:this={container}></div>
