import TronWeb from 'tronweb';
import { CONFIG } from './config.js';
import { PriceOracle } from './oracle.js';
import { RelayerState } from './state.js';
import { Swapper } from './swapper.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class GaslessRelayer {
  constructor({ tronWeb, oracle, state, swapper, kycProvider }) {
    this.tronWeb = tronWeb;
    this.oracle = oracle;
    this.state = state;
    this.swapper = swapper;
    this.kycProvider = kycProvider || { verify: async () => true };
  }

  async init() {
    await this.state.load();
  }

  async getChainParameters() {
    const params = await this.tronWeb.trx.getChainParameters();
    return new Map(params.map((entry) => [entry.key, entry.value]));
  }

  async estimateTransactionCost(signedTx) {
    const chainParams = await this.getChainParameters();
    const energyPriceSun = chainParams.get('getEnergyFee') ?? 420;
    const bandwidthPriceSun = chainParams.get('getTransactionFee') ?? 1000;

    let energyUsage = 0;
    try {
      const contract = signedTx.raw_data?.contract?.[0];
      if (contract?.type === 'TriggerSmartContract') {
        const value = contract.parameter?.value;
        const estimate = await this.tronWeb.transactionBuilder.estimateEnergy(
          value.contract_address,
          value.data,
          value.owner_address
        );
        energyUsage = estimate.energy_required || 0;
      }
    } catch (error) {
      console.warn('Failed to estimate energy usage, assuming 0:', error.message);
    }

    const bandwidthBytes = signedTx.raw_data_hex ? signedTx.raw_data_hex.length / 2 : 0;

    const energyCostSun = energyUsage * energyPriceSun;
    const bandwidthCostSun = bandwidthBytes * bandwidthPriceSun;
    const totalSun = energyCostSun + bandwidthCostSun;

    return {
      energyUsage,
      energyCostSun,
      bandwidthBytes,
      bandwidthCostSun,
      totalSun,
      totalTrx: totalSun / 1_000_000
    };
  }

  async enforceRiskControls(userId, trxAmount, usdtAmount) {
    const totals = this.state.getTotals();
    const userTotals = this.state.getUserTotals(userId);

    if (totals.trx + trxAmount > CONFIG.risk.dailyTrxLimit) {
      throw new Error('Daily TRX relayer limit exceeded');
    }
    if (totals.usdt + usdtAmount > CONFIG.risk.dailyUsdtLimit) {
      throw new Error('Daily USDT relayer limit exceeded');
    }
    if (userTotals.usdt + usdtAmount > CONFIG.risk.perUserUsdtLimit) {
      throw new Error('Per-user USDT limit exceeded');
    }
  }

  async verifyKyc(userId, kycPayload) {
    if (!CONFIG.risk.kycRequired) {
      return true;
    }
    const result = await this.kycProvider.verify(userId, kycPayload);
    if (!result) {
      throw new Error('KYC verification failed');
    }
    return true;
  }

  async executeSwap(usdtAmountSun, trxNeededSun, recipient) {
    let attempts = 0;
    let lastError = null;
    const minTrxOut = (trxNeededSun * 98n) / 100n;

    while (attempts < CONFIG.risk.swapRetryAttempts) {
      try {
        await this.swapper.swapUsdtToTrx(
          usdtAmountSun.toString(),
          minTrxOut.toString(),
          recipient
        );
        return true;
      } catch (error) {
        lastError = error;
        attempts += 1;
        console.warn(`Swap attempt ${attempts} failed:`, error.message);
        if (attempts < CONFIG.risk.swapRetryAttempts) {
          await sleep(CONFIG.risk.swapRetryDelayMs);
        }
      }
    }

    if (CONFIG.liquidity.fallbackTrxBuffer >= Number(trxNeededSun)) {
      console.warn('Using fallback TRX buffer due to swap failure');
      return false;
    }

    throw new Error(`Swap failed after ${attempts} attempts: ${lastError?.message}`);
  }

  async processSignedTransaction({ signedTx, userId, kycPayload }) {
    if (!signedTx) {
      throw new Error('Signed transaction payload is required');
    }
    if (!userId) {
      throw new Error('User identifier is required for risk tracking');
    }

    await this.verifyKyc(userId, kycPayload);

    const cost = await this.estimateTransactionCost(signedTx);
    const trxPrice = await this.oracle.getTrxPriceUsd();
    const trxCost = cost.totalSun / 1_000_000;
    const usdtCost = trxCost * trxPrice;

    await this.enforceRiskControls(userId, trxCost, usdtCost);

    const usdtAmountSun = BigInt(Math.ceil(usdtCost * 1_000_000));
    const trxNeededSun = BigInt(Math.ceil(cost.totalSun));

    const swapExecuted = await this.executeSwap(usdtAmountSun, trxNeededSun, this.tronWeb.defaultAddress.base58);

    const broadcast = await this.tronWeb.trx.sendRawTransaction(signedTx);
    if (!broadcast.result) {
      throw new Error(`Broadcast failed: ${broadcast.code || 'unknown error'}`);
    }

    this.state.track(userId, trxCost, usdtCost);
    await this.state.save();

    return {
      txid: broadcast.txid,
      cost,
      trxPrice,
      usdtCharged: Number(usdtAmountSun) / 1_000_000,
      swapExecuted
    };
  }
}

async function main() {
  const tronWeb = new TronWeb({
    fullHost: CONFIG.tron.fullHost,
    headers: CONFIG.tron.apiKey ? { 'TRON-PRO-API-KEY': CONFIG.tron.apiKey } : undefined,
    privateKey: CONFIG.tron.relayerPrivateKey
  });

  const oracle = new PriceOracle();
  const state = new RelayerState();
  const swapper = new Swapper(tronWeb);

  const relayer = new GaslessRelayer({ tronWeb, oracle, state, swapper });
  await relayer.init();

  if (process.env.DRY_RUN !== 'true') {
    console.log('Relayer ready. Awaiting signed transactions...');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Relayer failed to start:', error);
    process.exit(1);
  });
}
