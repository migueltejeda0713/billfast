// socket.js
import WebSocketClient from './WebSocketClient';
import { API_URL } from './api';

let socket;

export function initSocket(onMessage, onOpen, onClose) {
  // Aseguramos usar ws://<host>:<puerto> donde corre tu backend
  const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws';
  socket = new WebSocketClient(wsUrl);

  socket.onopen = () => {
    if (onOpen) onOpen();
  };

  socket.onmessage = evt => {
    if (onMessage) onMessage(JSON.parse(evt.data));
  };

  socket.onclose = () => {
    if (onClose) onClose();
  };

  socket.onerror = err => {
    // Error silenciado
  };

  return socket;
}
