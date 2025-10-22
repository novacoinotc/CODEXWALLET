import { v4 as uuidv4 } from 'uuid';

type DeepLinkOptions = {
  address: string;
  callback: string;
  action?: 'connect' | 'sign' | 'transfer';
  amount?: string;
  token?: string;
};

export function generateTronDeepLink(options: DeepLinkOptions) {
  const params = new URLSearchParams({
    action: options.action ?? 'connect',
    address: options.address,
    callback: options.callback,
    client_id: uuidv4(),
  });
  if (options.amount) params.append('amount', options.amount);
  if (options.token) params.append('token', options.token);
  return `codexwallet-tron://deeplink?${params.toString()}`;
}

export function formatTronAddress(address: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
