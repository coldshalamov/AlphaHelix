import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { arbitrumSepolia } from 'wagmi/chains';

export const config = createConfig({
  appName: 'Alpha Helix',
  projectId: 'YOUR_PROJECT_ID', // Replace with a real WalletConnect ID
  chains: [arbitrumSepolia],
  connectors: [
    injected(),
    walletConnect({ projectId: 'YOUR_PROJECT_ID' }),
  ],
  ssr: true, // If your dApp uses server side rendering (SSR)
  transports: {
    [arbitrumSepolia.id]: http(),
  },
});
