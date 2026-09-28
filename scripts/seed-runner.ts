import { runSeed } from '../src/lib/seed';

try {
  runSeed();
  console.log('Seed runner executed successfully.');
} catch (err) {
  console.error('Seed runner failed:', err);
  process.exit(1);
}
