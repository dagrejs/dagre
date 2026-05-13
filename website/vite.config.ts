import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];

export default defineConfig({
    base: process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : '/',
    plugins: [react()],
    resolve: {
        alias: {
            '@dagrejs/dagre': path.resolve(dirname, '../index.ts'),
        },
    },
    server: {
        port: 5173,
    },
});
