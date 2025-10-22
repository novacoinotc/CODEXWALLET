import fetch from 'node-fetch';
import { CONFIG } from './config.js';

export class PriceOracle {
  constructor() {
    this.cachedPrice = null;
    this.lastUpdated = 0;
  }

  async getTrxPriceUsd() {
    const now = Date.now();
    if (this.cachedPrice && now - this.lastUpdated < CONFIG.oracle.pollingIntervalMs) {
      return this.cachedPrice;
    }

    const url = new URL(CONFIG.oracle.endpoint);
    url.searchParams.set('ids', 'tron');
    url.searchParams.set('vs_currencies', CONFIG.oracle.quoteCurrency);

    const response = await fetch(url.toString(), { timeout: 10_000 });
    if (!response.ok) {
      throw new Error(`Price oracle request failed with status ${response.status}`);
    }

    const data = await response.json();
    const price = data?.tron?.[CONFIG.oracle.quoteCurrency];
    if (!price) {
      throw new Error('Invalid oracle payload: TRX price missing');
    }

    this.cachedPrice = price;
    this.lastUpdated = now;
    return price;
  }
}
