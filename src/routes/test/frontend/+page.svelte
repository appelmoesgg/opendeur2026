<script lang="ts">
  import { Application } from 'svelte-pixi';
  import Scene from '$lib/pixi/Scene.svelte';

  let wrapper: any = $state();
</script>

<div class="flex h-full w-full items-center justify-center">
  <div bind:this={wrapper} class="h-8/12 w-8/12 border border-white">

    {#if wrapper}
      <Application resizeTo={wrapper} antialias>
        <Scene />
      </Application>
    {/if}

  </div>
</div>