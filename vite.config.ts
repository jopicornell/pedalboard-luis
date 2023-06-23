import {defineConfig, loadEnv, UserConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {internalIpV4} from 'internal-ip';
import { VitePWA } from 'vite-plugin-pwa'
// https://vitejs.dev/config/
export default defineConfig(async ({mode}): Promise<UserConfig> => {
    const env = loadEnv(mode, process.cwd())

    const host = await internalIpV4()

    return {
        plugins: [vue(), VitePWA({
            registerType: 'autoUpdate',
            includeManifestIcons: true,
            injectRegister: 'auto',
            includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'masked-icon-512x512.svg'],
            manifest: {
                name: 'Pedalboard Middleware',
                short_name: 'Pedalboard',
                description: 'A pedalboard middleware for connecting midi controllers and DAWs to the Uno2',
                theme_color: '#',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })],
        // prevent vite from obscuring rust errors
        clearScreen: false,
        // Tauri expects a fixed port, fail if that port is not available
        server: {
            host: true, // listen on all addresses
            port: 5173,
            strictPort: true,

            hmr: {
                protocol: 'ws',
                host,
                port: 5183,
            },
        },
        // to make use of `TAURI_PLATFORM`, `TAURI_ARCH`, `TAURI_FAMILY`,
        // `TAURI_PLATFORM_VERSION`, `TAURI_PLATFORM_TYPE` and `TAURI_DEBUG`
        // env variables
        envPrefix: ['VITE_', 'TAURI_'],
        build: {
            // Tauri uses Chromium on Windows and WebKit on macOS and Linux
            target: env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
            // don't minify for debug builds
            minify: !env.TAURI_DEBUG ? 'esbuild' : false,
            // produce sourcemaps for debug builds
            sourcemap: !!env.TAURI_DEBUG,
        },
    }
})
