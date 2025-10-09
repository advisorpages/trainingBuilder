import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import net from 'node:net'

async function findAvailablePort(startPort: number, maxAttempts = 20): Promise<number> {
  let port = startPort

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const isFree = await isPortFree(port)
    if (isFree) {
      return port
    }
    port += 1
  }

  throw new Error(`No available port found in range ${startPort}-${port - 1}`)
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => {
        resolve(false)
      })
      .once('listening', () => {
        tester.close(() => resolve(true))
      })

    tester.listen(port, '0.0.0.0')
  })
}

// https://vitejs.dev/config/
export default defineConfig(async ({ command }) => {
  const preferredPort = Number(process.env.PORT ?? 3000)
  const resolvedPort =
    command === 'serve' ? await findAvailablePort(preferredPort, 32) : preferredPort

  if (command === 'serve' && resolvedPort !== preferredPort) {
    // eslint-disable-next-line no-console
    console.log(
      `[vite] Port ${preferredPort} unavailable, using ${resolvedPort} instead.`,
    )
  }

  return {
    plugins: [
      react(),
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    css: {
      postcss: './postcss.config.js',
    },
    server: {
      host: '0.0.0.0',
      port: resolvedPort,
      strictPort: false,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: 'http://leadership-training-backend:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      target: 'esnext',
      minify: 'terser',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@heroicons/react'],
            charts: ['recharts'],
            utils: ['axios'],
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, '../shared/src'),
      },
    },
  }
})
