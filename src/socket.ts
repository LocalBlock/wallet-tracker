import { io } from 'socket.io-client';

// production : connect to the host that serves the file
// developpement : connect to the separate express server
const URL = import.meta.env.MODE === 'production' ? "" : 'http://localhost:3000';

export const socket = io(URL);