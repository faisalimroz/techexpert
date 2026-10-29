import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/seed.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  sourcemap: true,
  // workspace packages ship TS source → bundle them; npm deps stay external
  noExternal: [/^@te\//],
});
