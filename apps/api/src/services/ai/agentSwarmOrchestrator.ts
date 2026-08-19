/**
 * ZEGA AI — Inter-Agent Swarm Orchestrator
 *
 * Facilitates real-time inter-agent handshakes, delegation directives,
 * and cross-assistant swarm synthesis across the 5 canonical ZEGA AI Assistants:
 * 1. home (Business Overview & Daily Guidance)
 * 2. help (Onboarding & Troubleshooting)
 * 3. finance (CFO AI & Financial Intelligence)
 * 4. knowledge (Tenant SOP & Document RAG)
 * 5. zega_copilot (Executive Swarm Leader)
 */

import { CanonicalAssistantType, AI_ASSISTANTS } from './assistantRegistry.js';

export interface SwarmDelegationResult {
  primaryAgent: CanonicalAssistantType;
  collaboratingAgents: CanonicalAssistantType[];
  isSwarmDelegated: boolean;
  delegationReason?: string;
  synthesizedDirective: string;
}

/**
 * Evaluates whether a prompt requires cross-agent collaboration or delegation,
 * and builds a synthesized inter-agent directive.
 */
export function orchestrateAgentSwarm(
  primaryType: CanonicalAssistantType,
  prompt: string
): SwarmDelegationResult {
  const p = prompt.toLowerCase();
  const collaboratingAgents: CanonicalAssistantType[] = [];
  let isSwarmDelegated = false;
  let delegationReason = '';

  // Inter-Agent Detection Logic
  const needsFinance = p.includes('omzet') || p.includes('pajak') || p.includes('pph') || p.includes('ppn') || p.includes('keuangan') || p.includes('margin') || p.includes('laba') || p.includes('biaya');
  const needsKnowledge = p.includes('sop') || p.includes('dokumen') || p.includes('kebijakan') || p.includes('retur') || p.includes('katalog') || p.includes('aturan');
  const needsHelp = p.includes('cara') || p.includes('integrasi') || p.includes('pos') || p.includes('whatsapp') || p.includes('error') || p.includes('fitur');
  const needsHome = p.includes('performa') || p.includes('penjualan') || p.includes('ringkasan') || p.includes('harian');

  if (primaryType === 'zega_copilot') {
    // ZEGA Copilot is the Master Swarm Leader — automatically orchestrates all sub-domain agents
    isSwarmDelegated = true;
    delegationReason = 'ZEGA Copilot Swarm Leader active: Synthesizing multi-domain AI intelligence.';
    if (needsFinance) collaboratingAgents.push('finance');
    if (needsKnowledge) collaboratingAgents.push('knowledge');
    if (needsHelp) collaboratingAgents.push('help');
    if (needsHome) collaboratingAgents.push('home');
    if (collaboratingAgents.length === 0) collaboratingAgents.push('home', 'finance');
  } else {
    // Specialized Assistant Handshake Rules
    if (primaryType === 'home' && (needsFinance || needsKnowledge)) {
      isSwarmDelegated = true;
      if (needsFinance) collaboratingAgents.push('finance');
      if (needsKnowledge) collaboratingAgents.push('knowledge');
      delegationReason = 'ZEGA Home consulting specialist AI agents for financial/SOP accuracy.';
    } else if (primaryType === 'finance' && (needsKnowledge || needsHome)) {
      isSwarmDelegated = true;
      if (needsKnowledge) collaboratingAgents.push('knowledge');
      if (needsHome) collaboratingAgents.push('home');
      delegationReason = 'ZEGA Finance consulting Knowledge/Home for operational context.';
    } else if (primaryType === 'knowledge' && (needsFinance || needsHome)) {
      isSwarmDelegated = true;
      if (needsFinance) collaboratingAgents.push('finance');
      if (needsHome) collaboratingAgents.push('home');
      delegationReason = 'ZEGA Knowledge consulting Finance/Home for data synthesis.';
    } else if (primaryType === 'help' && (needsFinance || needsHome)) {
      isSwarmDelegated = true;
      if (needsFinance) collaboratingAgents.push('finance');
      if (needsHome) collaboratingAgents.push('home');
      delegationReason = 'ZEGA Help consulting Finance/Home for tenant data simulation.';
    }
  }

  // Build Inter-Agent Collaboration Directive
  let synthesizedDirective = `\n\n=== INTER-AGENT SWARM ORCHESTRATION DIRECTIVE ===\n`;
  synthesizedDirective += `Primary Agent Role: ${AI_ASSISTANTS[primaryType].name} (${primaryType})\n`;

  if (isSwarmDelegated && collaboratingAgents.length > 0) {
    synthesizedDirective += `Swarm Status: AGENTIC COLLABORATION ACTIVE\n`;
    synthesizedDirective += `Reason: ${delegationReason}\n`;
    synthesizedDirective += `Collaborating Specialist Agents: ${collaboratingAgents.map(a => AI_ASSISTANTS[a].name).join(', ')}\n`;
    synthesizedDirective += `Instruction: Gunakan keahlian agentic terspesialisasi di atas untuk memberikan jawaban komprehensif, terstruktur, dan terinterkoneksi secara seamless bagi merchant UMKM.\n`;
  } else {
    synthesizedDirective += `Swarm Status: DIRECT DOMAIN EXECUTION\n`;
  }

  return {
    primaryAgent: primaryType,
    collaboratingAgents,
    isSwarmDelegated,
    delegationReason,
    synthesizedDirective
  };
}
