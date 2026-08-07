import { toHex } from 'viem';

const randomBuffer = new Uint8Array(32);
crypto.getRandomValues(randomBuffer);

const iterations = 100000;

// Manual Method
const startManual = performance.now();
for (let i = 0; i < iterations; i++) {
  '0x' + Array.from(randomBuffer).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const endManual = performance.now();

// Viem Method
const startViem = performance.now();
for (let i = 0; i < iterations; i++) {
  toHex(randomBuffer);
}
const endViem = performance.now();

console.log(`Manual: ${(endManual - startManual).toFixed(2)}ms`);
console.log(`Viem: ${(endViem - startViem).toFixed(2)}ms`);
console.log(`Speedup: ${(endManual - startManual) / (endViem - startViem)}x`);

// Verification
const manualResult = '0x' + Array.from(randomBuffer).map((b) => b.toString(16).padStart(2, '0')).join('');
const viemResult = toHex(randomBuffer);

if (manualResult !== viemResult) {
  console.error('Mismatch!');
  console.error('Manual:', manualResult);
  console.error('Viem:  ', viemResult);
  process.exit(1);
} else {
  console.log('Results match ✅');
}
