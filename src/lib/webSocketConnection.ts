import ioClient from 'socket.io-client';
import { browser } from '$app/environment';

const socket = browser ? ioClient() : null;

export const io = socket!;
