import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
    exclude: [
      'lucide-react',
      'protobufjs',
      '@wallet-standard/errors',
      '@walletconnect/sign-client',
      '@walletconnect/universal-provider',
      '@walletconnect/utils',
      '@reown/appkit',
      '@reown/appkit-controllers',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      target: 'es2020',
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
