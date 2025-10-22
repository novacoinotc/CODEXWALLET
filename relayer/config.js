export const CONFIG = {
  tron: {
    fullHost: process.env.TRON_FULLNODE_URL || 'https://api.trongrid.io',
    apiKey: process.env.TRON_API_KEY || '',
    relayerPrivateKey: process.env.TRON_RELAYER_PRIVATE_KEY || '',
    usdtContract: process.env.TRON_USDT_CONTRACT || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    sunSwapRouter: process.env.SUNSWAP_ROUTER || 'TPpSeYd2CrFbwzfo98rxhLT8Dnc5QwtAuT'
  },
  oracle: {
    endpoint: process.env.PRICE_ORACLE_URL || 'https://api.coingecko.com/api/v3/simple/price',
    quoteCurrency: process.env.ORACLE_QUOTE || 'usd',
    pollingIntervalMs: Number(process.env.ORACLE_POLL_MS || 60_000)
  },
  risk: {
    dailyTrxLimit: Number(process.env.DAILY_TRX_LIMIT || 10_000),
    dailyUsdtLimit: Number(process.env.DAILY_USDT_LIMIT || 10_000),
    perUserUsdtLimit: Number(process.env.PER_USER_USDT_LIMIT || 1_000),
    kycRequired: process.env.KYC_REQUIRED === 'true',
    swapRetryAttempts: Number(process.env.SWAP_RETRY_ATTEMPTS || 3),
    swapRetryDelayMs: Number(process.env.SWAP_RETRY_DELAY_MS || 5_000)
  },
  liquidity: {
    strategy: process.env.LIQUIDITY_STRATEGY || 'dex',
    fallbackTrxBuffer: Number(process.env.FALLBACK_TRX_BUFFER || 10_000_000)
  },
  persistence: {
    stateFile: process.env.STATE_FILE || './relayer_state.json'
  }
};
