import React, { useState } from 'react';
import { 
  Play, Send, Check, Settings, Plus, Sparkles, Sliders, 
  Code2, ArrowRight, RefreshCw, ZoomIn, ZoomOut, Maximize2, 
  Cpu, Database, Mail, Layers, Eye
} from 'lucide-react';
import { WorkflowNode } from '../types';
import { SupabaseDashboardService } from '../services/supabaseService';

const INITIAL_NODES: WorkflowNode[] = [
  { id: '1', title: 'New Ticket', type: 'trigger', icon: '🎫', x: 250, y: 30, status: 'success', subText: 'Zendesk Webhook' },
  { id: '2', title: 'Analyze Sentiment', type: 'action', icon: '✨', x: 250, y: 140, status: 'running', subText: 'GPT-4o • 28ms', model: 'GPT-4o-mini (Fastest)', temperature: 0.2, prompt: 'You are a customer support triage agent. Analyze incoming message stored in {{trigger.message}}.' },
  { id: '3', title: 'Route: Critical', type: 'logic', icon: '🚨', x: 80, y: 260, status: 'idle', subText: 'If sentiment < 0.3' },
  { id: '4', title: 'Route: Inquiry', type: 'logic', icon: '❓', x: 250, y: 260, status: 'idle', subText: 'If type is "Question"' },
  { id: '5', title: 'Route: Praise', type: 'logic', icon: '👍', x: 420, y: 260, status: 'idle', subText: 'If sentiment > 0.8' },
  { id: '6', title: 'Escalate to Slack', type: 'integration', icon: '💬', x: 80, y: 380, status: 'idle', subText: 'Channel #urgent' },
  { id: '7', title: 'Draft Response', type: 'action', icon: '📝', x: 250, y: 380, status: 'idle', subText: 'Using KB Articles' },
  { id: '8', title: 'Log Feedback', type: 'integration', icon: '🗄️', x: 420, y: 380, status: 'idle', subText: 'Airtable: Testimonials' },
  { id: '9', title: 'Mark Ticket Resolved', type: 'end', icon: '✅', x: 250, y: 500, status: 'success', subText: 'System Closed' },
];

export function SandboxWorkflowView() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('2');
  const [zoom, setZoom] = useState<number>(100);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mobileTab, setMobileTab] = useState<'canvas' | 'library' | 'inspector'>('canvas');

  const [testOutput, setTestOutput] = useState<string | null>(JSON.stringify({
    sentiment: 0.85,
    urgency: "low",
    summary: "User loves the new dashboard"
  }, null, 2));

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[1];

  // Mouse & Touch Drag Handlers
  const handleDragStart = (clientX: number, clientY: number, nodeId: string) => {
    setSelectedNodeId(nodeId);
    setDraggedNodeId(nodeId);
    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode) {
      setDragOffset({
        x: clientX - targetNode.x,
        y: clientY - targetNode.y,
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    handleDragStart(e.clientX, e.clientY, nodeId);
  };

  const handleTouchStart = (e: React.TouchEvent, nodeId: string) => {
    e.stopPropagation();
    if (e.touches.length > 0) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY, nodeId);
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!draggedNodeId) return;
    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;
    setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x: Math.max(10, newX), y: Math.max(10, newY) } : n));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedNodeId && e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleEnd = () => {
    setDraggedNodeId(null);
  };

  const runLiveTest = () => {
    setIsRunningTest(true);
    setTimeout(async () => {
      setIsRunningTest(false);
      const output = {
        sentiment: 0.94,
        urgency: "low",
        resolution: "Automated AI Response Dispatched",
        execution_time_ms: 42,
        tokens_used: 128
      };
      setTestOutput(JSON.stringify(output, null, 2));

      await SupabaseDashboardService.logSandboxExecution({
        nodes_json: nodes,
        status: 'success',
        execution_time_ms: 42,
        output_json: output,
      });
    }, 1200);
  };

  return (
    <div 
      className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col animate-fadeIn text-slate-800 dark:text-slate-100 touch-none select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
    >
      {/* Top Workflow Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-6 sm:py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 gap-2.5">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xs font-bold text-slate-400">Workflows /</span>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px] sm:max-w-none">Customer Support Agent v2</h2>
          <span className="rounded-md bg-[#e05638]/10 text-[#e05638] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase">
            Draft Sandbox
          </span>
        </div>

        {/* Mobile View Switcher Tabs (Canvas / Library / Config) */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex lg:hidden rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setMobileTab('canvas')}
              className={`px-2.5 py-1 rounded-md transition-all ${mobileTab === 'canvas' ? 'bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}
            >
              Canvas
            </button>
            <button
              onClick={() => setMobileTab('library')}
              className={`px-2.5 py-1 rounded-md transition-all ${mobileTab === 'library' ? 'bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}
            >
              Library
            </button>
            <button
              onClick={() => setMobileTab('inspector')}
              className={`px-2.5 py-1 rounded-md transition-all ${mobileTab === 'inspector' ? 'bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}
            >
              Config
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={runLiveTest}
              disabled={isRunningTest}
              className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 sm:px-4 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play size={12} className={isRunningTest ? "animate-spin text-[#e05638]" : "text-emerald-500"} />
              <span className="hidden xs:inline">{isRunningTest ? "Running..." : "Test Run"}</span>
            </button>
            <button className="flex items-center gap-1 rounded-lg bg-[#e05638] px-2.5 sm:px-4 py-1.5 text-xs font-bold text-white hover:bg-[#c8462b] active:scale-95 transition-all cursor-pointer">
              <Sparkles size={12} />
              <span>Publish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Sandbox Canvas & Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Library Sidebar */}
        <div className={`w-full lg:w-56 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 flex flex-col justify-between select-none ${mobileTab === 'library' ? 'flex absolute inset-0 z-20 bg-white dark:bg-slate-900' : 'hidden lg:flex'}`}>
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NODE LIBRARY</div>
            
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase text-slate-400">LOGIC BLOCKS</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#e05638] cursor-grab text-center">
                  <span className="text-sm">🧠</span>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1">AI Reason</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#e05638] cursor-grab text-center">
                  <span className="text-sm">🔀</span>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1">Branch</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-mono uppercase text-slate-400">INTEGRATIONS</div>
              <div className="space-y-1.5">
                {[
                  { name: 'Slack', desc: 'Send message', icon: '💬' },
                  { name: 'Email', desc: 'Send via SMTP', icon: '✉️' },
                  { name: 'Notion', desc: 'Update DB', icon: '📝' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-grab">
                    <span className="text-sm">{item.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                      <div className="text-[9px] text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
            ZEGA Sandbox Node Engine v2.4
          </div>
        </div>

        {/* Center Node Workflow Canvas */}
        <div className={`flex-1 relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] overflow-auto p-4 sm:p-8 ${mobileTab === 'canvas' ? 'block' : 'hidden lg:block'}`}>
          <div className="relative w-full h-full min-h-[580px] min-w-[500px]">
            {/* SVG Connecting Curves */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-300 dark:stroke-slate-700" strokeWidth="2" fill="none">
              <path d="M 320 80 L 320 140" />
              <path d="M 320 190 L 150 260" stroke="#e05638" strokeWidth="2" />
              <path d="M 320 190 L 320 260" stroke="#0EA5E9" strokeWidth="2" />
              <path d="M 320 190 L 490 260" stroke="#10B981" strokeWidth="2" />
              <path d="M 150 310 L 150 380" />
              <path d="M 320 310 L 320 380" />
              <path d="M 490 310 L 490 380" />
              <path d="M 320 430 L 320 500" stroke="#10B981" strokeWidth="2" />
            </svg>

            {/* Render Draggable Nodes with Touch Support */}
            {nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  onTouchStart={(e) => handleTouchStart(e, node.id)}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  className={`absolute w-40 sm:w-44 rounded-xl border p-2.5 sm:p-3 bg-white dark:bg-slate-900 transition-all cursor-move touch-none ${
                    isSelected 
                      ? 'border-[#e05638] ring-2 ring-[#e05638]/20 z-10' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs flex-shrink-0">
                      {node.icon}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{node.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{node.subText}</div>
                    </div>
                  </div>

                  {node.status === 'running' && (
                    <div className="mt-2 text-[9px] font-bold text-[#e05638] flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-[#e05638] animate-pulse" /> Active Node
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Floating Canvas Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-1 z-10">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><ZoomOut size={13} /></button>
            <span className="text-[11px] font-mono font-bold px-1.5">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><ZoomIn size={13} /></button>
            <button onClick={() => setZoom(100)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><Maximize2 size={13} /></button>
          </div>
        </div>

        {/* Right Node Configuration Inspector */}
        <div className={`w-full lg:w-80 border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto ${mobileTab === 'inspector' ? 'flex absolute inset-0 z-20 bg-white dark:bg-slate-900' : 'hidden lg:flex'}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedNode.icon}</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedNode.title}</h3>
              </div>
              <span className="text-[9px] font-bold uppercase text-[#e05638] bg-[#e05638]/10 px-2 py-0.5 rounded-md">
                {selectedNode.type}
              </span>
            </div>

            {/* Model & System Prompt Config */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">AI MODEL</label>
                <select className="w-full h-8.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#e05638]">
                  <option>GPT-4o-mini (Fastest)</option>
                  <option>Claude 3.5 Sonnet (Intelligent)</option>
                  <option>ZEGA Local Agent v2</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">SYSTEM PROMPT</label>
                <textarea
                  rows={4}
                  defaultValue={selectedNode.prompt || "Analyze the incoming message stored in variable {{trigger.message}}."}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#e05638]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono uppercase text-slate-400 mb-1">
                  <span>TEMPERATURE</span>
                  <span>0.2</span>
                </div>
                <input type="range" min="0" max="1" step="0.1" defaultValue="0.2" className="w-full accent-[#e05638]" />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">OUTPUT SCHEMA (JSON)</label>
                <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                  {testOutput}
                </pre>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button onClick={runLiveTest} className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer">
              Test Step
            </button>
            <button className="flex-1 h-9 rounded-lg bg-[#e05638] text-white hover:bg-[#c8462b] text-xs font-bold transition-all cursor-pointer">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
