import {defineConfig, loadEnv} from "vite";
import {resolve} from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({mode}) => {
    console.log("Build mode:", mode);
    return {
        plugins: [
            tailwindcss(),
        ],
        build: {
            sourcemap: true,
            minify: mode === 'production',
            outDir: resolve(__dirname, 'dist'),
            rollupOptions: {
                output: {
                    assetFileNames: '[name]-[hash][extname]',
                    chunkFileNames: '[name]-[hash].js',
                    entryFileNames: '[name]-[hash].js',
                },
                input: {
                    app: resolve(__dirname, './index.html'),
                    "404": resolve(__dirname, './404.html'),
                },
            }
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern',
                }
            }
        }
    }
});