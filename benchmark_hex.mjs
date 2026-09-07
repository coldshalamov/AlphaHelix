import { toHex } from 'viem';

const buffer = new Uint8Array(32);
crypto.getRandomValues(buffer);

// Manual
function manual(buf) {
  return '0x' + Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Viem
function optimized(buf) {
  return toHex(buf);
}

const iterations = 100000;

console.time('Manual');
for (let i = 0; i < iterations; i++) {
  manual(buffer);
}
console.timeEnd('Manual');

console.time('Viem');
for (let i = 0; i < iterations; i++) {
  optimized(buffer);
}
console.timeEnd('Viem');

console.log('Manual result:', manual(buffer));
console.log('Viem result:  ', optimized(buffer));
