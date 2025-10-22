(function initCodexWallet() {
  if (window.codexWallet?.tronProvider) {
    return;
  }

  const callbacks = new Map();
  let requestId = 0;

  class CodexTronProvider {
    constructor() {
      this.isCodexWallet = true;
      this.isTronLink = true;
      this.ready = false;
      this._address = null;
      this._chainId = '0x2b6653dc'; // Tron mainnet
      this._connect();
    }

    async _connect() {
      try {
        const state = await this.request({ method: 'tron_getProviderState' });
        this._address = state?.address || null;
        this.ready = true;
        if (this._address) {
          this._emit('accountsChanged', [this._address]);
        }
      } catch (err) {
        console.warn('CodexWallet provider init failed', err);
      }
    }

    request({ method, params }) {
      if (!method) {
        return Promise.reject(new Error('CodexWallet: método requerido'));
      }
      const id = ++requestId;
      return new Promise((resolve, reject) => {
        callbacks.set(id, { resolve, reject });
        window.postMessage(
          {
            source: 'codexwallet:page',
            type: 'REQUEST',
            id,
            payload: { method, params },
          },
          '*'
        );
      });
    }

    async enable() {
      const accounts = await this.request({ method: 'tron_requestAccounts' });
      return accounts;
    }

    get selectedAddress() {
      return this._address;
    }

    set selectedAddress(value) {
      this._address = value;
    }

    on(event, callback) {
      document.addEventListener(`codexwallet:${event}`, callback);
    }

    removeListener(event, callback) {
      document.removeEventListener(`codexwallet:${event}`, callback);
    }

    _emit(event, detail) {
      document.dispatchEvent(
        new CustomEvent(`codexwallet:${event}`, { detail })
      );
    }
  }

  const provider = new CodexTronProvider();

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'codexwallet:content') {
      return;
    }
    const { id, payload } = event.data;
    const callback = callbacks.get(id);
    if (!callback) {
      return;
    }
    callbacks.delete(id);
    if (payload && payload.error) {
      callback.reject(new Error(payload.error));
      return;
    }
    if (payload && Object.prototype.hasOwnProperty.call(payload, 'result')) {
      if (payload.result && payload.result.accounts) {
        provider._address = payload.result.accounts[0] || null;
        provider._emit('accountsChanged', payload.result.accounts);
      }
      callback.resolve(payload.result.value ?? payload.result);
    } else {
      callback.resolve(payload);
    }
  });

  const tronWebShim = {
    get ready() {
      return provider.ready;
    },
    setAddress(address) {
      provider.selectedAddress = address;
    },
    async request(args) {
      return provider.request(args);
    },
    get defaultAddress() {
      return { base58: provider.selectedAddress, hex: null };
    },
  };

  window.codexWallet = { tronProvider: provider };
  window.tronLink = provider;
  window.tronWeb = tronWebShim;
  window.dispatchEvent(new Event('tronWeb#initialized'));
})();
