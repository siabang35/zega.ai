// Dedicated test script for @Soft_yee invoice dispatch against Local Backend (http://localhost:3001)
async function testSoftYeeLocal() {
  console.log('📡 Testing direct invoice dispatch to @Soft_yee on Local Backend (http://localhost:3001)...\n');

  const targetApi = 'http://localhost:3001';

  try {
    const res = await fetch(`${targetApi}/v1/zeroclaw/channels/send-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: 'DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK',
        amount: 0.23,
        description: 'Snack untuk @Soft_yee (0.23 USDC)',
        target: '@Soft_yee',
        channel: 'telegram',
        tier: 'enterprise'
      })
    });

    const json: any = await res.json();
    console.log(`STATUS CODE: ${res.status}`);
    console.log(`RESPONSE:\n${JSON.stringify(json, null, 2)}`);
  } catch (err: any) {
    console.error(`ERROR: ${err.message}`);
  }
}

testSoftYeeLocal();
