import React, { useState } from 'react';
import {
  Copy,
  Terminal,
  Check,
  Code,
  Zap,
  ChevronDown,
  Layers,
  Search,
  BookOpen
} from 'lucide-react';
import { getR2CdnUrl } from '../../../../utils/cdn';

interface CodeExamplesTabProps {
  onTriggerToast?: (msg: string) => void;
  onNavigateToDocs: () => void;
}

export function CodeExamplesTab({
  onTriggerToast,
  onNavigateToDocs
}: CodeExamplesTabProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState('POST /v1/agents/run');
  const [selectedLanguage, setSelectedLanguage] = useState<'cURL' | 'JavaScript' | 'Python' | 'Go' | 'Java'>('cURL');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    if (onTriggerToast) onTriggerToast(`📋 ${label} copied to clipboard!`);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Sample Snippets Map
  const getRequestSnippet = () => {
    if (selectedLanguage === 'cURL') {
      return `curl --request POST \\
  --url 'https://api.zegaai.site/v1/agents/run' \\
  --header 'Authorization: Bearer zga_live_xxxxxxxxxxxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "agent_id": "support-agent",
    "input": "Summarize last 10 support tickets",
    "stream": false,
    "temperature": 0.7
  }'`;
    }
    if (selectedLanguage === 'JavaScript') {
      return `import { ZegaClient } from '@zega/sdk';

const zega = new ZegaClient({ apiKey: process.env.ZEGA_API_KEY });

const response = await zega.agents.run({
  agentId: 'support-agent',
  input: 'Summarize last 10 support tickets',
  temperature: 0.7
});

console.log(response.output.text);`;
    }
    if (selectedLanguage === 'Python') {
      return `from zega import ZegaClient

zega = ZegaClient(api_key="zga_live_xxxxxxxxxxxx")

response = zega.agents.run(
    agent_id="support-agent",
    input="Summarize last 10 support tickets",
    temperature=0.7
)

print(response.output["text"])`;
    }
    if (selectedLanguage === 'Go') {
      return `package main

import (
    "fmt"
    "github.com/zega/zega-go"
)

func main() {
    client := zega.NewClient("zga_live_xxxxxxxxxxxx")
    resp, err := client.RunAgent("support-agent", "Summarize last 10 support tickets")
    if err != nil {
        panic(err)
    }
    fmt.Println(resp.Output.Text)
}`;
    }
    return `// Java SDK
ZegaClient client = new ZegaClient("zga_live_xxxxxxxxxxxx");
AgentResponse res = client.agents().run("support-agent", "Summarize last 10 support tickets");
System.out.println(res.getOutput().getText());`;
  };

  const sampleResponse = `{
  "id": "run_1234567890",
  "agent_id": "support-agent",
  "status": "completed",
  "output": {
    "text": "Here is the summary of the last 10 support tickets...",
    "tokens_used": 532,
    "model": "zega-ai-1.3"
  },
  "created_at": "2026-05-27T10:30:45Z",
  "duration_ms": 1420
}`;

  return (
    <div className="space-y-6">
      {/* TOP CONTROLS CARD */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* ENDPOINT SELECTOR */}
          <div className="space-y-1.5 flex-1">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Choose Endpoint
            </label>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden focus:border-indigo-500"
            >
              <option value="POST /v1/agents/run">POST /v1/agents/run — Execute an agent workflow</option>
              <option value="GET /v1/agents">GET /v1/agents — List all registered agents</option>
              <option value="POST /v1/workflows/execute">POST /v1/workflows/execute — Trigger workflow DAG</option>
              <option value="GET /v1/knowledge/search">GET /v1/knowledge/search — Semantic RAG search</option>
              <option value="GET /v1/analytics/usage">GET /v1/analytics/usage — Fetch telemetry stats</option>
              <option value="POST /v1/webhooks">POST /v1/webhooks — Subscribe to webhook events</option>
              <option value="GET /v1/models">GET /v1/models — List available 9Router models</option>
            </select>
            <span className="text-[11px] text-slate-400 block">Run an AI agent with the provided input and configuration.</span>
          </div>

          {/* LANGUAGE PILLS */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Language
            </label>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {[
                { id: 'cURL', icon: getR2CdnUrl('/design/design_enterprise/Curl-logo.webp', true) },
                { id: 'JavaScript', icon: getR2CdnUrl('/design/design_enterprise/JavaScript-logo.png', true) },
                { id: 'Python', icon: getR2CdnUrl('/design/design_enterprise/python_logo.webp', true) },
                { id: 'Go', icon: getR2CdnUrl('/design/design_enterprise/Go-Logo_LightBlue.png', true) },
                { id: 'Java', icon: getR2CdnUrl('/design/design_enterprise/java.png', true) }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedLanguage === lang.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <img src={lang.icon} alt={lang.id} className="size-3.5 object-contain" />
                  <span>{lang.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* REQUEST & RESPONSE TERMINAL BLOCKS GRID */}
      <div className="grid grid-cols-1 gap-5">
        {/* REQUEST EXAMPLE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-300">Request Example</span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 font-mono text-[10px] font-bold">
                {selectedLanguage}
              </span>
            </div>
            <button
              onClick={() => copyCode(getRequestSnippet(), 'Request Example')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[11px] cursor-pointer transition-colors border border-slate-800"
            >
              {copiedSection === 'Request Example' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedSection === 'Request Example' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="font-mono text-xs text-emerald-400 overflow-x-auto p-2 leading-relaxed">
            <pre>{getRequestSnippet()}</pre>
          </div>
        </div>

        {/* RESPONSE EXAMPLE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-300">Response Example</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold">
                200 OK
              </span>
            </div>
            <button
              onClick={() => copyCode(sampleResponse, 'Response Example')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[11px] cursor-pointer transition-colors border border-slate-800"
            >
              {copiedSection === 'Response Example' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedSection === 'Response Example' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="font-mono text-xs text-cyan-300 overflow-x-auto p-2 leading-relaxed">
            <pre>{sampleResponse}</pre>
          </div>
        </div>
      </div>

      {/* EXAMPLE INFORMATION METADATA GRID */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Example Information</h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Authentication</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Bearer Token (API Key)</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rate Limit</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">1000 requests / minute</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Request Body</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">application/json</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Response Format</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">application/json</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SDK Support</span>
            <div className="flex items-center gap-1.5 pt-1">
              <img src={getR2CdnUrl('/design/design_enterprise/JavaScript-logo.png', true)} alt="JS" className="size-4 object-contain" />
              <img src={getR2CdnUrl('/design/design_enterprise/python_logo.webp', true)} alt="Py" className="size-4 object-contain" />
              <img src={getR2CdnUrl('/design/design_enterprise/Go-Logo_LightBlue.png', true)} alt="Go" className="size-4 object-contain" />
              <img src={getR2CdnUrl('/design/design_enterprise/java.png', true)} alt="Java" className="size-4 object-contain" />
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Permissions Required</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">v1/agents:run</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Best For</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Read / Write</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Response Required</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Running AI agents and processing tasks</span>
          </div>
        </div>
      </div>

      {/* MORE EXAMPLES GRID */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">More Examples</h4>
          <button onClick={onNavigateToDocs} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
            View all examples →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {[
            { ep: 'GET /v1/agents', desc: 'List all agents' },
            { ep: 'GET /v1/analytics/usage', desc: 'Get usage analytics' },
            { ep: 'GET /v1/knowledge/search', desc: 'Search knowledge base' },
            { ep: 'POST /v1/webhooks', desc: 'Create webhook' },
            { ep: 'POST /v1/workflows/execute', desc: 'Execute a workflow' },
            { ep: 'GET /v1/models', desc: 'List available models' }
          ].map((item) => (
            <div
              key={item.ep}
              onClick={() => setSelectedEndpoint(item.ep)}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">{item.ep}</span>
                <span className="text-[11px] text-slate-500">{item.desc}</span>
              </div>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
