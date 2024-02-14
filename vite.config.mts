import {defineConfig, loadEnv} from "vite";
import {resolve} from "path";

export default defineConfig(({mode}) => {
    console.log("Build mode:", mode);
    return {
        build: {
            sourcemap: true,
            minify: mode === 'production',
            outDir: resolve(__dirname, 'dist'),
            rollupOptions: {
                output: {
                    assetFileNames: '[name][extname]',
                    chunkFileNames: '[name].js',
                    entryFileNames: '[name].js',
                },
                input: {
                    "functions/api": resolve(__dirname, './src/worker.ts'),
                    app: resolve(__dirname, './index.html'),
                },
            }
        }
    }
});