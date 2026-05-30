import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { webSocketServer } from './webSocket.ts';

/** @type {import('vite').UserConfig} */
const config = {
    server: {
        port: 3000
    },
    preview: {
        port: 3000
    },
    plugins: [tailwindcss(), sveltekit(), webSocketServer]
};

export default defineConfig(config);