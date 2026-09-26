import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

const testEnv = config({ path: '.env.test', override: true, quiet: true }).parsed ?? {};

export default defineConfig({
  test: {
    env: testEnv,
    globalSetup: ['./test/globalSetup.ts'],
    fileParallelism: false,
  },
});
