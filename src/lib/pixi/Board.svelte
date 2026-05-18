<script lang="ts">
  import { Application, Sprite } from 'svelte-pixi';
  import { Assets } from 'pixi.js';

  let texture = $state();

  let appWidth = 800;
  let appHeight = 600;

  async function load() {
    texture = await Assets.load('/background.png');
  }

  load();
</script>

<Application
  width={appWidth}
  height={appHeight}
  background={0xffffff}
>
  {#if texture}
    <Sprite
      texture={texture}
      x={0}
      y={0}
      width={appWidth}
      height={appHeight}
      anchor={0}
    />
  {/if}
</Application>