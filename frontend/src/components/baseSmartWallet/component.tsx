import CoinbaseWalletSDK from '@coinbase/wallet-sdk';

const coinbaseWallet = new CoinbaseWalletSDK({
  appName: 'Your App Name',
  appChainIds: [84532],
});

export const coinbaseProvider = coinbaseWallet.makeWeb3Provider();