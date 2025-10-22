import TronWeb from 'tronweb';
import { CONFIG } from './config.js';

const SUNSWAP_ROUTER_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "amount_in", "type": "uint256" },
      { "name": "amount_out_min", "type": "uint256" },
      { "name": "path", "type": "address[]" },
      { "name": "to", "type": "address" },
      { "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [{ "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "amount_in", "type": "uint256" },
      { "name": "amount_out_min", "type": "uint256" },
      { "name": "path", "type": "address[]" },
      { "name": "to", "type": "address" },
      { "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForETH",
    "outputs": [{ "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const toBigInt = (value) => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'string') return BigInt(value);
  if (typeof value === 'number') return BigInt(value);
  if (value?._hex) return BigInt(value._hex);
  if (value?.remaining) return BigInt(value.remaining);
  if (value?.toString) return BigInt(value.toString());
  throw new Error('Unsupported numeric type');
};

export class Swapper {
  constructor(tronWeb) {
    this.tronWeb = tronWeb;
    const routerAddress = TronWeb.address.toHex(CONFIG.tron.sunSwapRouter);
    this.router = tronWeb.contract(SUNSWAP_ROUTER_ABI, routerAddress);
  }

  async ensureAllowance(tokenAddress, owner, spender, amount) {
    const tokenContract = await this.tronWeb.contract().at(TronWeb.address.toHex(tokenAddress));
    const allowance = await tokenContract.allowance(
      TronWeb.address.toHex(owner),
      TronWeb.address.toHex(spender)
    ).call();
    const allowanceValue = toBigInt(allowance);
    if (allowanceValue >= BigInt(amount)) {
      return;
    }
    await tokenContract.approve(TronWeb.address.toHex(spender), amount).send({
      feeLimit: 20_000_000
    });
  }

  async swapUsdtToTrx(amountUsdt, minTrxOut, recipient) {
    if (CONFIG.liquidity.strategy === 'internal') {
      throw new Error('Internal liquidity strategy not implemented');
    }

    const path = [
      TronWeb.address.toHex(CONFIG.tron.usdtContract),
      TronWeb.address.toHex('T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb')
    ];
    const deadline = Math.floor(Date.now() / 1000) + 60;

    await this.ensureAllowance(CONFIG.tron.usdtContract, recipient, CONFIG.tron.sunSwapRouter, amountUsdt);

    const tx = await this.router.swapExactTokensForETH(
      amountUsdt,
      minTrxOut,
      path,
      TronWeb.address.toHex(recipient),
      deadline
    ).send({ feeLimit: 20_000_000 });

    return tx;
  }
}
