import '@/styles/globals.css';
import { WagmiProvider } from '@/lib/wagmiClient';
import Layout from '@/components/Layout';

function MyApp({ Component, pageProps }) {
  return (
    <WagmiProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </WagmiProvider>
  );
}

export default MyApp;
