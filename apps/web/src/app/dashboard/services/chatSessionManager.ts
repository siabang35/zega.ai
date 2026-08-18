import { supabase } from '../../../lib/supabase';
import { isValidUuid, umkmSupabaseService, getActiveTenantIds } from './umkmSupabaseService';
import { SupabaseDashboardService } from './supabaseService';

export type AssistantType = 'home_assistant' | 'zega_copilot' | 'finance_ai' | 'live_help';

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender: 'user' | 'assistant' | 'copilot' | 'system' | 'ai';
  message?: string;
  text?: string;
  created_at?: string;
  model_engine?: string;
  inference_ms?: number;
  tokens_used?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  agent_role?: string;
  copilot_type?: string;
  status?: string;
}

export interface AssistantState {
  activeChatId: string | null;
  chats: ChatSession[];
  loadedMessages: Record<string, ChatMessage[]>;
  loading: boolean;
  error: string | null;
}

export type ChatManagerState = Record<AssistantType, AssistantState>;

class ChatSessionManager {
  private state: ChatManagerState = {
    home_assistant: { activeChatId: null, chats: [], loadedMessages: {}, loading: false, error: null },
    zega_copilot: { activeChatId: null, chats: [], loadedMessages: {}, loading: false, error: null },
    finance_ai: { activeChatId: null, chats: [], loadedMessages: {}, loading: false, error: null },
    live_help: { activeChatId: null, chats: [], loadedMessages: {}, loading: false, error: null }
  };

  private listeners: Set<(state: ChatManagerState) => void> = new Set();
  private inFlightRestoration: Map<string, Promise<string | null>> = new Map();
  private inFlightCreation: Map<string, Promise<ChatSession | null>> = new Map();
  private inFlightMessages: Map<string, Promise<ChatMessage[]>> = new Map();

  public subscribe(listener: (state: ChatManagerState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): ChatManagerState {
    return {
      home_assistant: { ...this.state.home_assistant, loadedMessages: { ...this.state.home_assistant.loadedMessages } },
      zega_copilot: { ...this.state.zega_copilot, loadedMessages: { ...this.state.zega_copilot.loadedMessages } },
      finance_ai: { ...this.state.finance_ai, loadedMessages: { ...this.state.finance_ai.loadedMessages } },
      live_help: { ...this.state.live_help, loadedMessages: { ...this.state.live_help.loadedMessages } }
    };
  }

  public getAssistantState(assistantType: AssistantType): AssistantState {
    return this.state[assistantType] || { activeChatId: null, chats: [], loadedMessages: {}, loading: false, error: null };
  }

  public setActiveChatId(assistantType: AssistantType, chatId: string | null): void {
    if (this.state[assistantType].activeChatId !== chatId) {
      this.state[assistantType] = {
        ...this.state[assistantType],
        activeChatId: chatId
      };
      this.notify();
    }
  }

  /**
   * Single-flight DB-driven session restoration algorithm:
   * 1. If activeChatId is set and valid, returns it.
   * 2. Loads chat history list for assistantType from DB.
   * 3. Selects most recent chat if available.
   * 4. If zero chats exist, provisions ONE new chat session row in DB.
   */
  public async restoreOrBootstrapAssistantSession(
    assistantType: AssistantType,
    providedStoreId?: string | null
  ): Promise<string | null> {
    const currentState = this.getAssistantState(assistantType);
    if (currentState.activeChatId && isValidUuid(currentState.activeChatId)) {
      return currentState.activeChatId;
    }

    const tenantCtx = await umkmSupabaseService.getCanonicalTenantContext(providedStoreId);
    if (!tenantCtx.verified || !isValidUuid(tenantCtx.storeId) || !isValidUuid(tenantCtx.organizationId) || !isValidUuid(tenantCtx.workspaceId)) {
      console.warn('[CHAT_CONTEXT_INCOMPLETE]', {
        assistantType,
        action: 'restore',
        verified: tenantCtx.verified,
        storeId: tenantCtx.storeId,
        organizationId: tenantCtx.organizationId,
        workspaceId: tenantCtx.workspaceId
      });
      return null;
    }

    const flightKey = `restore:${assistantType}:${tenantCtx.authUserId}:${tenantCtx.storeId}:${tenantCtx.workspaceId}`;
    if (this.inFlightRestoration.has(flightKey)) {
      return await this.inFlightRestoration.get(flightKey)!;
    }

    const promise = (async () => {
      try {
        this.updateAssistant(assistantType, { loading: true });

        // Fetch recent chats from DB
        const dbChats = await this.fetchChatListFromDb(assistantType, providedStoreId);

        if (dbChats && dbChats.length > 0) {
          const selectedChatId = dbChats[0].id;
          this.updateAssistant(assistantType, {
            chats: dbChats,
            activeChatId: selectedChatId,
            loading: false
          });
          console.log('[CHAT_RESTORE]', { assistantType, activeChatId: selectedChatId, count: dbChats.length });
          // Lazily load messages for the selected chat
          this.loadChatMessages(assistantType, selectedChatId);
          return selectedChatId;
        }

        // If zero chats exist in DB, create ONE new chat row
        const newChat = await this.createNewChatSession(assistantType, undefined, providedStoreId);
        if (newChat?.id) {
          console.log('[CHAT_RESTORE]', { assistantType, activeChatId: newChat.id, status: 'BOOTSTRAPPED_NEW' });
        }
        return newChat ? newChat.id : null;
      } catch (err: any) {
        console.warn(`[ChatSessionManager] Restore exception for ${assistantType}:`, err);
        this.updateAssistant(assistantType, { loading: false, error: err?.message || 'Restore error' });
        return null;
      } finally {
        this.inFlightRestoration.delete(flightKey);
      }
    })();

    this.inFlightRestoration.set(flightKey, promise);
    return await promise;
  }

  /**
   * Single-flight creation of a new chat session in the assistant's dedicated database table.
   */
  public async createNewChatSession(
    assistantType: AssistantType,
    title?: string,
    providedStoreId?: string | null
  ): Promise<ChatSession | null> {
    const tenantCtx = await umkmSupabaseService.getCanonicalTenantContext(providedStoreId);
    if (!tenantCtx.verified || !isValidUuid(tenantCtx.storeId) || !isValidUuid(tenantCtx.organizationId) || !isValidUuid(tenantCtx.workspaceId)) {
      console.warn('[CHAT_CONTEXT_INCOMPLETE]', {
        assistantType,
        action: 'create',
        verified: tenantCtx.verified,
        storeId: tenantCtx.storeId,
        organizationId: tenantCtx.organizationId,
        workspaceId: tenantCtx.workspaceId
      });
      return null;
    }

    const flightKey = `create:${assistantType}:${tenantCtx.authUserId}:${tenantCtx.storeId}:${tenantCtx.workspaceId}`;

    if (this.inFlightCreation.has(flightKey)) {
      return await this.inFlightCreation.get(flightKey)!;
    }

    const promise = (async () => {
      try {
        let createdSession: ChatSession | null = null;
        if (assistantType === 'zega_copilot') {
          createdSession = await SupabaseDashboardService.createUmkmZegaCopilotChat(
            tenantCtx.storeId,
            undefined,
            title || 'Diskusi ZEGA Copilot Utama'
          );
        } else if (assistantType === 'home_assistant') {
          createdSession = await SupabaseDashboardService.createUmkmAiAssistantChat(
            tenantCtx.storeId,
            undefined,
            title || 'Diskusi AI Assistant',
            'ZEGA Home Assistant'
          );
        } else if (assistantType === 'finance_ai') {
          createdSession = await SupabaseDashboardService.createUmkmAiAssistantChat(
            tenantCtx.storeId,
            undefined,
            title || 'Diskusi Keuangan AI',
            'ZEGA Finance AI'
          );
        } else if (assistantType === 'live_help') {
          createdSession = await SupabaseDashboardService.createUmkmAiAssistantChat(
            tenantCtx.storeId,
            undefined,
            title || 'Diskusi Bantuan Langsung',
            'ZEGA Live Help'
          );
        }

        if (createdSession && createdSession.id) {
          const currentChats = this.getAssistantState(assistantType).chats;
          const updatedChats = [createdSession, ...currentChats.filter(c => c.id !== createdSession!.id)];

          this.updateAssistant(assistantType, {
            chats: updatedChats,
            activeChatId: createdSession.id,
            loadedMessages: {
              ...this.getAssistantState(assistantType).loadedMessages,
              [createdSession.id]: []
            },
            loading: false
          });
          console.log('[CHAT_CREATE]', { assistantType, chatId: createdSession.id, title: createdSession.title });
        }
        return createdSession;
      } catch (err: any) {
        console.warn(`[ChatSessionManager] createNewChatSession error for ${assistantType}:`, err);
        return null;
      } finally {
        this.inFlightCreation.delete(flightKey);
      }
    })();

    this.inFlightCreation.set(flightKey, promise);
    return await promise;
  }

  /**
   * Lazily loads messages for a specific chatId from DB and caches under loadedMessages[chatId].
   */
  public async loadChatMessages(assistantType: AssistantType, chatId: string): Promise<ChatMessage[]> {
    if (!chatId || !isValidUuid(chatId)) return [];

    const existing = this.getAssistantState(assistantType).loadedMessages[chatId];
    if (existing) return existing;

    const flightKey = `messages:${assistantType}:${chatId}`;
    if (this.inFlightMessages.has(flightKey)) {
      return await this.inFlightMessages.get(flightKey)!;
    }

    const promise = (async () => {
      try {
        let msgs: ChatMessage[] = [];
        if (assistantType === 'zega_copilot') {
          msgs = await SupabaseDashboardService.getUmkmZegaCopilotMessages(chatId);
        } else {
          msgs = await SupabaseDashboardService.getUmkmAiAssistantMessages(chatId);
        }

        this.updateAssistant(assistantType, {
          loadedMessages: {
            ...this.getAssistantState(assistantType).loadedMessages,
            [chatId]: msgs
          }
        });
        return msgs;
      } catch (err: any) {
        console.warn(`[ChatSessionManager] loadChatMessages error for ${chatId}:`, err);
        return [];
      } finally {
        this.inFlightMessages.delete(flightKey);
      }
    })();

    this.inFlightMessages.set(flightKey, promise);
    return await promise;
  }

  /**
   * Persists message to DB and updates local memory state.
   */
  public async appendAndPersistMessage(
    assistantType: AssistantType,
    chatId: string,
    sender: 'user' | 'assistant' | 'system' | 'copilot' | 'ai',
    message: string
  ): Promise<ChatMessage | null> {
    if (!chatId || !isValidUuid(chatId)) return null;

    const currentMsgs = this.getAssistantState(assistantType).loadedMessages[chatId] || [];
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      chat_id: chatId,
      sender,
      message,
      text: message,
      created_at: new Date().toISOString()
    };

    // Optimistically update memory state
    const optimisticMsgs = [...currentMsgs, tempMsg];
    this.updateAssistant(assistantType, {
      loadedMessages: {
        ...this.getAssistantState(assistantType).loadedMessages,
        [chatId]: optimisticMsgs
      }
    });

    console.log('[CHAT_MESSAGE_PERSIST]', { assistantType, chatId, sender, length: message.length });

    try {
      let persisted: ChatMessage | null = null;
      if (assistantType === 'zega_copilot') {
        const copilotSender = (sender === 'copilot' || sender === 'ai') ? 'assistant' : (sender === 'user' ? 'user' : 'system');
        persisted = await SupabaseDashboardService.saveUmkmZegaCopilotMessage({
          chat_id: chatId,
          sender: copilotSender,
          message
        });
      } else {
        const aiSender = (sender === 'copilot' || sender === 'assistant') ? 'ai' : (sender === 'user' ? 'user' : 'system');
        persisted = await SupabaseDashboardService.saveUmkmAiAssistantMessage({
          chat_id: chatId,
          sender: aiSender,
          text: message
        });
      }

      if (persisted && persisted.id) {
        const finalMsgs = optimisticMsgs.map(m => (m.id === tempMsg.id ? persisted! : m));
        this.updateAssistant(assistantType, {
          loadedMessages: {
            ...this.getAssistantState(assistantType).loadedMessages,
            [chatId]: finalMsgs
          }
        });
        return persisted;
      }
    } catch (err: any) {
      console.warn(`[ChatSessionManager] appendAndPersistMessage exception:`, err);
    }
    return tempMsg;
  }

  public async fetchChatList(assistantType: AssistantType, providedStoreId?: string | null): Promise<ChatSession[]> {
    const list = await this.fetchChatListFromDb(assistantType, providedStoreId);
    this.updateAssistant(assistantType, { chats: list });
    console.log('[CHAT_HISTORY]', { assistantType, count: list.length });
    return list;
  }

  private async fetchChatListFromDb(
    assistantType: AssistantType,
    providedStoreId?: string | null
  ): Promise<ChatSession[]> {
    const cleanUserId = (getActiveTenantIds().userId || '');
    let chatType: 'zega_copilot' | 'ai_assistant' | 'finance_ai' | 'live_help' = 'ai_assistant';
    if (assistantType === 'zega_copilot') chatType = 'zega_copilot';
    else if (assistantType === 'finance_ai') chatType = 'finance_ai';
    else if (assistantType === 'live_help') chatType = 'live_help';

    return await SupabaseDashboardService.getUmkmRecentChatHistory(cleanUserId, chatType);
  }

  private updateAssistant(assistantType: AssistantType, partial: Partial<AssistantState>): void {
    this.state[assistantType] = {
      ...this.state[assistantType],
      ...partial
    };
    this.notify();
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach(l => l(currentState));
  }
}

export const chatSessionManager = new ChatSessionManager();
