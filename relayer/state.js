import fs from 'fs/promises';
import { CONFIG } from './config.js';

export class RelayerState {
  constructor() {
    this.state = {
      totals: {
        trx: 0,
        usdt: 0
      },
      perUser: {},
      lastReset: new Date().toISOString()
    };
  }

  async load() {
    try {
      const raw = await fs.readFile(CONFIG.persistence.stateFile, 'utf-8');
      this.state = JSON.parse(raw);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('Failed to load state file, starting fresh:', error.message);
      }
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(CONFIG.persistence.stateFile, JSON.stringify(this.state, null, 2));
  }

  maybeReset() {
    const lastReset = new Date(this.state.lastReset);
    const now = new Date();
    if (lastReset.toDateString() !== now.toDateString()) {
      this.state.totals.trx = 0;
      this.state.totals.usdt = 0;
      this.state.perUser = {};
      this.state.lastReset = now.toISOString();
    }
  }

  track(userId, trxAmount, usdtAmount) {
    this.maybeReset();
    this.state.totals.trx += trxAmount;
    this.state.totals.usdt += usdtAmount;
    if (!this.state.perUser[userId]) {
      this.state.perUser[userId] = { usdt: 0, trx: 0 };
    }
    this.state.perUser[userId].trx += trxAmount;
    this.state.perUser[userId].usdt += usdtAmount;
  }

  getTotals() {
    this.maybeReset();
    return this.state.totals;
  }

  getUserTotals(userId) {
    this.maybeReset();
    return this.state.perUser[userId] || { usdt: 0, trx: 0 };
  }
}
