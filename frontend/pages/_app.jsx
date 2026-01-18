import '@/styles/globals.css';
import { WagmiProvider } from '@/lib/wagmiClient';
import Layout from '@/components/Layout';
import { Space_Mono, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-display',
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['500'],
  subsets: ['latin'],
  variable: '--font-mono',
});

function MyApp({ Component, pageProps }) {
  return (
    <WagmiProvider>
      <Layout className={`${spaceMono.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable}`}>
        <Component {...pageProps} />
      </Layout>
    </WagmiProvider>
  );
}

export default MyApp;
