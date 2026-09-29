import { defineConfig } from 'vitest/config';

const DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://localhost:5432/futbol_test';
// globalSetup працює в головному процесі — йому теж потрібна тестова база.
process.env.DATABASE_URL = DATABASE_URL;

export default defineConfig({
  test: {
    environment: 'node',
    // Усі тести ділять одну тестову базу — тому по черзі.
    fileParallelism: false,
    globalSetup: './test/globalSetup.ts',
    env: { DATABASE_URL, NODE_ENV: 'test' },
  },
});
