const randomHex = (length = 32) => {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const emitter = () => {
  const listeners = new Map();
  return {
    on(event, handler) {
      const handlers = listeners.get(event) || [];
      handlers.push(handler);
      listeners.set(event, handlers);
    },
    off(event, handler) {
      const handlers = listeners.get(event) || [];
      listeners.set(
        event,
        handlers.filter((fn) => fn !== handler)
      );
    },
    emit(event, payload) {
      const handlers = listeners.get(event) || [];
      handlers.forEach((fn) => fn(payload));
    },
  };
};

export class TronWalletConnectSession {
  constructor({ metadata }) {
    this.metadata = metadata;
    this.topic = null;
    this.uri = null;
    this.connected = false;
    this.accounts = [];
    this._events = emitter();
  }

  async init() {
    this.topic = randomHex(40);
    this.uri = `tronwalletconnect://${this.topic}?publicKey=${randomHex(66)}`;
    this._events.emit('created', { topic: this.topic, uri: this.uri });
    return this.uri;
  }

  on(event, handler) {
    this._events.on(event, handler);
  }

  off(event, handler) {
    this._events.off(event, handler);
  }

  async approve({ accounts }) {
    this.connected = true;
    this.accounts = accounts;
    this._events.emit('approved', { accounts });
    return { topic: this.topic, accounts };
  }

  async reject(reason) {
    this.connected = false;
    this._events.emit('rejected', { reason });
  }

  async disconnect() {
    this.connected = false;
    const payload = { topic: this.topic };
    this._events.emit('disconnected', payload);
    return payload;
  }
}
