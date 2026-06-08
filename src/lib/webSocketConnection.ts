import ioClient from 'socket.io-client';
import { browser } from '$app/environment';

// Connect back to the server that's hosting this page — no hardcoded address needed.
// The `browser` check stops this from running during server-side rendering,
// where there is no page URL to connect to.
const socket = browser ? ioClient() : null;

export const io = socket!;
