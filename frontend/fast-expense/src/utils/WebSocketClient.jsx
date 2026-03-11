// WebSocketClient.js
export default class WebSocketClient extends WebSocket {
  constructor(url) {
    super(url);
    // Forzamos reconexión automática si hace falta
    this.reconnectInterval = 3000;
    this.url = url;
    this.addEventListener('close', () => {
      setTimeout(() => {
        const ws = new WebSocketClient(this.url);
        Object.assign(this, ws);
      }, this.reconnectInterval);
    });
  }
}
