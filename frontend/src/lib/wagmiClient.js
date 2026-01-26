import { WagmiProvider as BaseWagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arbitrumSepolia, hardhat } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const transports = {
  [hardhat.id]: http(process.env.NEXT_PUBLIC_LOCAL_RPC_URL || 'http://127.0.0.1:8545'),
  [arbitrumSepolia.id]: http(
    process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'
  ),
};

const config = createConfig({
  chains: [hardhat, arbitrumSepolia],
  connectors: [injected({ target: 'metaMask' })],
  transports,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 4_000, // BOLT: Cache data for 4s (approx 1 block) to prevent RPC spam
    },
  },
});

export function WagmiProvider({ children }) {
  return (
    <BaseWagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BaseWagmiProvider>
  );
}

export { config };
