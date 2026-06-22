<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Application as PixiApp, Sprite as PixiSprite, Assets } from 'pixi.js';
  import { Board } from '$lib/game/Board';
  import type { Texture } from 'pixi.js';

  type PlayerData = { id: string; color: string; position: number };

  let { players, textures }: { players: PlayerData[]; textures: Record<string, Texture> } = $props();

  const board = new Board(5, 5);
  let container: HTMLDivElement;
  let app: PixiApp | null = null;

  // track of spel al klaar is anders big problemo (anders sprites op onbestaand bord tekenen)
  let appReady = $state(false);

    // string: playerid, Sprite: tekeningetje van de speler
  const spelerSprites = new Map<string, PixiSprite>();

  onMount(async () => {
    app = new PixiApp();
    await app.init({ width: 600, height: 600, background: 0x111111 });
    container.appendChild(app.canvas);

    // CSS zodat canvas altijd max ruimte die hij kan innemen inneemt
    app.canvas.style.width = '100%';
    app.canvas.style.height = '100%';

    const bgTexture = await Assets.load('/background.png');
    bgTexture.source.scaleMode = 'nearest';
    const bg = new PixiSprite(bgTexture);
    bg.width = 600;
    bg.height = 600;
    app.stage.addChild(bg);

    appReady = true;
  });

  // runt bij elke state change (dus bv als players wordt geupdate)
  $effect(() => {
    if (!appReady || !app) return;

    for (const player of players) {
      const texture = textures[player.color];
      if (!texture) continue;

      // sprite toevoegen voor nieuwe speler
      if (!spelerSprites.has(player.id)) {
        const sprite = new PixiSprite(texture);
        sprite.anchor.set(0.5);
        sprite.scale.set(3);
        app.stage.addChild(sprite);
        spelerSprites.set(player.id, sprite);
      }

      const sprite = spelerSprites.get(player.id)!;

      // offset als meerdere mensen op 1 vakje staan (anders worden ze boven mekaar getekend)
      const playersOnSameSquare = players.filter((p) => p.position === player.position);
      const offset = playersOnSameSquare.indexOf(player);
      const pos = board.getXY(player.position, offset);
      sprite.x = pos.x;
      sprite.y = pos.y;
    }

    // verwijder spelers die nie meer in players lijst zitten (zijn dus disconnected)
    const playerIds = new Set(players.map((p) => p.id));
    for (const [id, sprite] of [...spelerSprites.entries()]) {
      if (!playerIds.has(id)) {
        app.stage.removeChild(sprite);
        sprite.destroy();
        spelerSprites.delete(id);
      }
    }
  });

  onDestroy(() => {
    app?.destroy(true);
  });
</script>

<div bind:this={container}></div>
