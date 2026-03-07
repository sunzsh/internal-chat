const tests = [
  require('./room-routing.test'),
  require('./data-public-room.test'),
  require('./peer-state.test'),
  require('./network-health.test')
];

let passed = 0;
for (const run of tests) {
  run();
  passed += 1;
}

console.log(`All tests passed: ${passed}/${tests.length}`);
