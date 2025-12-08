import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Alpha Helix',
  projectId: 'YOUR_PROJECT_ID', // Replace with a real WalletConnect ID
  chains: [arbitrumSepolia],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
