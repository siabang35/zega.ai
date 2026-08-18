export type StreamEventType =
  | 'token'
  | 'tool_call'
  | 'tool_result'
  | 'reasoning_status'
  | 'finish'
  | 'error';

export interface UnifiedStreamEvent {
  type: StreamEventType;
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, any>;
  };
  toolResult?: {
    id: string;
    name: string;
    result: any;
  };
  reasoningStatus?: {
    stage: string;
    message: string;
    step?: number;
  };
  metadata?: {
    model: string;
    provider: string;
    ttftMs?: number;
    usage?: {
      promptTokens: number;
      completionTokens: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export function formatSSEChunk(event: UnifiedStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function createTokenChunk(token: string, model?: string, provider?: string): string {
  const event: UnifiedStreamEvent = {
    type: 'token',
    content: token,
    metadata: model && provider ? { model, provider } : undefined,
    timestamp: new Date().toISOString(),
  };
  return formatSSEChunk(event);
}

export function createReasoningChunk(stage: string, message: string, step?: number): string {
  const event: UnifiedStreamEvent = {
    type: 'reasoning_status',
    reasoningStatus: { stage, message, step },
    timestamp: new Date().toISOString(),
  };
  return formatSSEChunk(event);
}

export function createToolCallChunk(id: string, name: string, args: Record<string, any>): string {
  const event: UnifiedStreamEvent = {
    type: 'tool_call',
    toolCall: { id, name, arguments: args },
    timestamp: new Date().toISOString(),
  };
  return formatSSEChunk(event);
}

export function createToolResultChunk(id: string, name: string, result: any): string {
  const event: UnifiedStreamEvent = {
    type: 'tool_result',
    toolResult: { id, name, result },
    timestamp: new Date().toISOString(),
  };
  return formatSSEChunk(event);
}

export function createFinishChunk(model: string, provider: string, promptTokens: number, completionTokens: number, ttftMs?: number): string {
  const event: UnifiedStreamEvent = {
    type: 'finish',
    metadata: {
      model,
      provider,
      ttftMs,
      usage: { promptTokens, completionTokens },
    },
    timestamp: new Date().toISOString(),
  };
  return formatSSEChunk(event);
}

export function createErrorChunk(code: string, message: string): string {
  const event: UnifiedStreamEvent = {
    type: 'error',
    error: { code, message },
    timestamp: new Date().toISOString(),
  };
  return formatSSEChunk(event);
}
