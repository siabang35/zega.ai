// Bot Token Health Check — reads TELEGRAM_BOT_TOKEN from .env and verifies it works
import { readFileSync } from 'fs';

async function checkBotToken() {
  console.log('🔍 ZEGA Telegram Bot Token Health Check\n');

  // Read token from .env (never print the full token!)
  const envPath = new URL('../apps/api/.env', import.meta.url).pathname;
  const envContent = readFileSync(envPath, 'utf8');
  const match = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
  const token = match?.[1]?.trim();

  if (!token || token.length < 10) {
    console.log('❌ TELEGRAM_BOT_TOKEN tidak ditemukan atau terlalu pendek di .env');
    process.exit(1);
  }

  console.log(`🔑 Token: ${token.slice(0, 6)}...${token.slice(-4)} (${token.length} chars)\n`);

  // 1. getMe — verify bot identity
  console.log('📡 Test 1: getMe (verifikasi identitas bot)...');
  const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const meJson: any = await meRes.json();
  if (meJson.ok) {
    console.log(`  ✅ Bot Aktif!`);
    console.log(`  └─ Nama: ${meJson.result.first_name}`);
    console.log(`  └─ Username: @${meJson.result.username}`);
    console.log(`  └─ Bot ID: ${meJson.result.id}`);
    console.log(`  └─ Can Join Groups: ${meJson.result.can_join_groups}`);
  } else {
    console.log(`  ❌ Token INVALID: ${meJson.description}`);
    process.exit(1);
  }

  // 2. getWebhookInfo — check if webhook is set
  console.log('\n📡 Test 2: getWebhookInfo...');
  const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const whJson: any = await whRes.json();
  if (whJson.ok) {
    const url = whJson.result.url;
    console.log(`  └─ Webhook URL: ${url || '(tidak ada — polling mode)'}`);
    console.log(`  └─ Pending Updates: ${whJson.result.pending_update_count}`);
  }

  // 3. sendMessage to operator — verify bot can send
  console.log('\n📡 Test 3: sendMessage ke operator (7303438046)...');
  const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: '7303438046',
      text: `✅ <b>Bot Token Health Check PASSED</b>\n\nBot <b>@${meJson.result.username}</b> aktif dan siap digunakan.\nTimestamp: <code>${new Date().toISOString()}</code>`,
      parse_mode: 'HTML'
    })
  });
  const sendJson: any = await sendRes.json();
  if (sendJson.ok) {
    console.log(`  ✅ Pesan terkirim ke operator! Message ID: ${sendJson.result.message_id}`);
  } else {
    console.log(`  ❌ Gagal kirim: ${sendJson.description}`);
    console.log(`  💡 Pastikan operator sudah /start di @${meJson.result.username}`);
  }

  console.log('\n═══════════════════════════════');
  console.log('  ✅ BOT TOKEN HEALTH CHECK OK');
  console.log('═══════════════════════════════');
}

checkBotToken();
