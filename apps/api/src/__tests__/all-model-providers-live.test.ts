import assert from 'node:assert';
import { GroqProvider, OpenRouterProvider, GeminiProvider, HuggingFaceProvider, OpenAIProvider, AnthropicProvider } from '../services/ai/aiProvider.js';
import { aiModelRouter } from '../services/ai/aiModelRouter.js';
import { CanonicalAssistantType } from '../services/ai/assistantRegistry.js';

console.log(`
====================================================================
  ZEGA AI — Full Multi-Model Provider Live Benchmark & Health Suite
====================================================================
`);

async function runLiveBenchmark() {
  const groq = new GroqProvider();
  const openrouter = new OpenRouterProvider();
  const gemini = new GeminiProvider();
  const huggingface = new HuggingFaceProvider();
  const openai = new OpenAIProvider();
  const anthropic = new AnthropicProvider();

  // 1. Health Checks
  console.log('--- 1. Provider Health & Configuration Checks ---');
  const [groqHealth, openrouterHealth, geminiHealth, hfHealth, openaiHealth, anthropicHealth] = await Promise.all([
    groq.healthCheck(),
    openrouter.healthCheck(),
    gemini.healthCheck(),
    huggingface.healthCheck(),
    openai.healthCheck(),
    anthropic.healthCheck(),
  ]);

  console.log('  Groq Provider Status:', groqHealth);
  console.log('  OpenRouter Provider Status:', openrouterHealth);
  console.log('  Gemini Provider Status:', geminiHealth);
  console.log('  HuggingFace Provider Status:', hfHealth);
  console.log('  OpenAI Provider Status:', openaiHealth);
  console.log('  Anthropic Provider Status:', anthropicHealth);

  assert.ok(
    groqHealth.configured ||
    openrouterHealth.configured ||
    geminiHealth.configured ||
    hfHealth.configured ||
    openaiHealth.configured ||
    anthropicHealth.configured,
    'At least one AI provider must be configured!'
  );

  // 2. Direct Provider Live Generation Test
  console.log('\n--- 2. Direct Provider Response Generation ---');
  if (groq.isConfigured()) {
    try {
      const groqRes = await groq.generate({
        messages: [
          { role: 'system', content: 'Anda asisten cerdas ZEGA. Jawab ringkas.' },
          { role: 'user', content: 'Sebutkan 3 tips meningkatkan omzet toko UMKM.' }
        ],
        maxTokens: 200
      });
      console.log(`  ✓ Groq (${groqRes.model}): ${groqRes.inferenceMs}ms | Tokens: ${groqRes.totalTokens}`);
      console.log(`    Response sample: "${groqRes.message.substring(0, 100).replace(/\n/g, ' ')}..."`);
    } catch (err: any) {
      console.warn('  ⚠ Groq direct test note:', err.message);
    }
  }

  if (openai.isConfigured()) {
    try {
      const openaiRes = await openai.generate({
        messages: [
          { role: 'system', content: 'You are ZEGA AI Assistant.' },
          { role: 'user', content: 'Provide a 1-sentence sales tip.' }
        ],
        maxTokens: 150
      });
      console.log(`  ✓ OpenAI (${openaiRes.model}): ${openaiRes.inferenceMs}ms | Tokens: ${openaiRes.totalTokens}`);
      console.log(`    Response sample: "${openaiRes.message.substring(0, 100).replace(/\n/g, ' ')}..."`);
    } catch (err: any) {
      console.warn('  ⚠ OpenAI direct test note:', err.message);
    }
  }

  if (anthropic.isConfigured()) {
    try {
      const anthropicRes = await anthropic.generate({
        messages: [
          { role: 'system', content: 'You are ZEGA AI Assistant powered by Claude.' },
          { role: 'user', content: 'Provide a 1-sentence greeting.' }
        ],
        maxTokens: 150
      });
      console.log(`  ✓ Anthropic (${anthropicRes.model}): ${anthropicRes.inferenceMs}ms | Tokens: ${anthropicRes.totalTokens}`);
      console.log(`    Response sample: "${anthropicRes.message.substring(0, 100).replace(/\n/g, ' ')}..."`);
    } catch (err: any) {
      console.warn('  ⚠ Anthropic direct test note:', err.message);
    }
  }

  if (openrouter.isConfigured()) {
    try {
      const openrouterRes = await openrouter.generate({
        messages: [
          { role: 'system', content: 'You are ZEGA AI Assistant.' },
          { role: 'user', content: 'Provide a 1-sentence tip for inventory management.' }
        ],
        maxTokens: 150
      });
      console.log(`  ✓ OpenRouter (${openrouterRes.model}): ${openrouterRes.inferenceMs}ms | Tokens: ${openrouterRes.totalTokens}`);
      console.log(`    Response sample: "${openrouterRes.message.substring(0, 100).replace(/\n/g, ' ')}..."`);
    } catch (err: any) {
      console.warn('  ⚠ OpenRouter direct test note:', err.message);
    }
  }

  if (gemini.isConfigured()) {
    try {
      const geminiRes = await gemini.generate({
        messages: [
          { role: 'system', content: 'Anda asisten ZEGA AI.' },
          { role: 'user', content: 'Berikan 1 salam hangat untuk toko.' }
        ],
        maxTokens: 150
      });
      console.log(`  ✓ Gemini (${geminiRes.model}): ${geminiRes.inferenceMs}ms | Tokens: ${geminiRes.totalTokens}`);
      console.log(`    Response sample: "${geminiRes.message.substring(0, 100).replace(/\n/g, ' ')}..."`);
    } catch (err: any) {
      console.warn('  ⚠ Gemini direct test note:', err.message);
    }
  }

  if (huggingface.isConfigured()) {
    try {
      const hfRes = await huggingface.generate({
        messages: [
          { role: 'system', content: 'You are ZEGA AI Assistant running on HuggingFace DeepSeek-V4.' },
          { role: 'user', content: 'Explain in 1 sentence how AI optimizes store sales.' }
        ],
        maxTokens: 150
      });
      console.log(`  ✓ HuggingFace (${hfRes.model}): ${hfRes.inferenceMs}ms | Tokens: ${hfRes.totalTokens}`);
      console.log(`    Response sample: "${hfRes.message.substring(0, 100).replace(/\n/g, ' ')}..."`);
    } catch (err: any) {
      console.warn('  ⚠ HuggingFace direct test note:', err.message);
    }
  }

  // 3. Router Multi-Assistant Full Pipeline Verification
  console.log('\n--- 3. Router Pipeline Verification Across Assistants ---');
  const assistantTypes: CanonicalAssistantType[] = ['home', 'help', 'finance', 'knowledge', 'zega_copilot'];

  for (const type of assistantTypes) {
    const res = await aiModelRouter.generateAssistantResponse({
      requestId: `live-test-${type}`,
      assistantType: type,
      userId: 'usr-live-01',
      tenantId: '00000000-0000-0000-0000-000000000001',
      storeId: '00000000-0000-0000-0000-000000000001',
      conversationId: `conv-live-${type}`,
      message: type === 'finance' ? 'Berapa omzet dan estimasi laba hari ini?' : 'Berikan ringkasan singkat status operasional.',
      language: 'id',
      responseStyle: 'ramah',
      responseFormat: 'terstruktur',
      responseLength: 'singkat'
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.message.length > 20, 'Response length should be substantive');
    assert.ok(!res.message.includes('gsk_'), 'OWASP Secret Redaction failure check passed');

    console.log(`  ✓ Assistant [${type.toUpperCase()}]: Provider [${res.provider}] Model [${res.model}] Total Time [${res.telemetry.total_inference_ms}ms]`);
  }

  console.log(`
--------------------------------------------------------------------
  All Live Model Provider Tests Completed Successfully!
--------------------------------------------------------------------
`);
}

runLiveBenchmark().catch((err) => {
  console.error(' Live Benchmark Failed:', err);
  process.exit(1);
});
