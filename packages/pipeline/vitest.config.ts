import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'pipeline',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
