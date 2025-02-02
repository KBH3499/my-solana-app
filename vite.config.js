import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

// Update Vite config with more polyfills and optimizeDeps
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis', // Use globalThis as global
        process: 'process', // Polyfill process
        Buffer: 'Buffer', // Polyfill Buffer
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true, // Enable Buffer polyfill
          process: true, // Enable process polyfill
          // Add any other necessary globals as needed
        }),
      ],
    },
  },
  resolve: {
    alias: {
      // Add polyfills for Node.js modules that might be required
      stream: 'stream-browserify',
      url: 'url',
      util: 'util',
      assert: 'assert',
      crypto: 'crypto-browserify',
      os: 'os-browserify',
    },
  },
});
