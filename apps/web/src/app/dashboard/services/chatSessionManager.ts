import { supabase } from '../../../lib/supabase';
import { isValidUuid, umkmSupabaseService, getActiveTenantIds } from './umkmSupabaseService';
import { SupabaseDashboardService } from './supabaseService';
import { waitForAuthReady } from '../../components/auth/PrivyAuthBridge';
import { canonicalAuthManager } from '../../services/CanonicalAuthManager';

export type CanonicalAssistantType = 'home' | 'help' | 'finance' | 'knowledge' | 'zega_copilot';
export type LegacyAssistantType = 'home_assistant' | 'finance_ai' | 'live_help';
export type AssistantType = CanonicalAssistantType | LegacyAssistantType;

/**
 * Normalizes legacy or shorthand assistant type strings into canonical assistant types.
 */
export function normalizeAssistantType(rawType?: string): CanonicalAssistantType {
  if (!rawType) return 'home';
  const clean = rawType.trim().toLowerCase();
  if (clean === 'home' || clean === 'home_assistant') return 'home';
  if (clean === 'help' || clean === 'live_help' || clean === 'support') return 'help';
  if (clean === 'finance' || clean === 'finance_ai') return 'finance';
  if (clean === 'knowledge' || clean === 'knowledge_base') return 'knowledge';
  if (clean === 'zega_copilot' || clean === 'copilot') return 'zega_copilot';
  return 'home';
}

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

export type ChatManagerState = Record<CanonicalAssistantType, AssistantState>;

class ChatSessionManager {
  private state: ChatManagerState = {
    home: { activeChatId: null, chats: [], loadedMessages: {}, loading: false, error: null },
    help: { activeChatId: null, chats: [], loadedMessages: {}, loading: false, error: null },
    finance: { activeChatId: null, chats: [], loadedMessages: {}, loading: false, error: null },
    knowledge: { activeChatId: null, chats: [], loadedMessages: {}, loading: false, error: null },
    zega_copilot: { activeChatId: null, chats: [], loadedMessages: {}, loading: false, error: null }
  };

  private listeners: Set<(state: any) => void> = new Set();
  private inFlightRestoration: Map<string, Promise<string | null>> = new Map();
  private inFlightCreation: Map<string, Promise<ChatSession | null>> = new Map();
  private inFlightMessages: Map<string, Promise<ChatMessage[]>> = new Map();
  private inFlightPersist: Map<string, Promise<ChatMessage | null>> = new Map();

  public subscribe(listener: (state: any) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): any {
    const canonicalState = {
      home: { ...this.state.home, loadedMessages: { ...this.state.home.loadedMessages } },
      help: { ...this.state.help, loadedMessages: { ...this.state.help.loadedMessages } },
      finance: { ...this.state.finance, loadedMessages: { ...this.state.finance.loadedMessages } },
      knowledge: { ...this.state.knowledge, loadedMessages: { ...this.state.knowledge.loadedMessages } },
      zega_copilot: { ...this.state.zega_copilot, loadedMessages: { ...this.state.zega_copilot.loadedMessages } }
    };

    // Alias mapping for legacy components
    return {
      ...canonicalState,
      home_assistant: canonicalState.home,
      finance_ai: canonicalState.finance,
      live_help: canonicalState.help
    };
  }

  public getAssistantState(typeInput: AssistantType): AssistantState {
    const canonical = normalizeAssistantType(typeInput);
    return this.state[canonical] || { activeChatId: null, chats: [], loadedMessages: {}, loading: false, error: null };
  }

  public setActiveChatId(typeInput: AssistantType, chatId: string | null): void {
    const canonical = normalizeAssistantType(typeInput);
    if (this.state[canonical].activeChatId !== chatId) {
      this.state[canonical] = {
        ...this.state[canonical],
        activeChatId: chatId
      };
      if (chatId && typeof sessionStorage !== 'undefined') {
        try {
          const authUser = canonicalAuthManager.getSnapshot().authUserId;
          const tenant = getActiveTenantIds();
          if (authUser && tenant.storeId) {
            sessionStorage.setItem(`zega_active_chat:${canonical}:${authUser}:${tenant.storeId}`, chatId);
          }
        } catch { }
      }
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
    typeInput: AssistantType,
    providedStoreId?: string | null
  ): Promise<string | null> {
    const canonical = normalizeAssistantType(typeInput);
    const currentState = this.getAssistantState(canonical);
    if (currentState.activeChatId && isValidUuid(currentState.activeChatId)) {
      return currentState.activeChatId;
    }

    const chatContext = await umkmSupabaseService.resolveCanonicalChatContext(providedStoreId);
    if (!chatContext.ok || chatContext.status === 'DEFERRED' || !chatContext.storeId) {
      console.warn('[CHAT_CONTEXT_DEFERRED]', {
        assistantType: canonical,
        action: 'restore',
        reason: chatContext.reason || 'CHAT_WAITING_FOR_CANONICAL_TENANT_CONTEXT',
        status: chatContext.status
      });
      return null;
    }

    const authUserId = chatContext.userId;
    const storeId = chatContext.storeId;
    const workspaceId = chatContext.workspaceId;

    // Check SessionStorage Cache (Tier 2 Lookup)
    const sessionCacheKey = `zega_active_chat:${canonical}:${authUserId}:${storeId}`;
    if (typeof sessionStorage !== 'undefined') {
      try {
        const cachedChatId = sessionStorage.getItem(sessionCacheKey);
        if (cachedChatId && isValidUuid(cachedChatId)) {
          this.setActiveChatId(canonical, cachedChatId);
          this.loadChatMessages(canonical, cachedChatId);
          return cachedChatId;
        }
      } catch { }
    }

    const flightKey = `restore:${canonical}:${authUserId}:${storeId}:${workspaceId}`;
    if (this.inFlightRestoration.has(flightKey)) {
      return await this.inFlightRestoration.get(flightKey)!;
    }

    const promise = (async () => {
      try {
        this.updateAssistant(canonical, { loading: true });

        // Fetch recent chats from DB
        const dbChats = await this.fetchChatListFromDb(canonical, providedStoreId);

        if (dbChats && dbChats.length > 0) {
          const selectedChatId = dbChats[0].id;
          this.updateAssistant(canonical, {
            chats: dbChats,
            activeChatId: selectedChatId,
            loading: false
          });
          console.log('[CHAT_RESTORE]', { assistantType: canonical, activeChatId: selectedChatId, count: dbChats.length });
          this.loadChatMessages(canonical, selectedChatId);
          return selectedChatId;
        }

        // If zero chats exist in DB, create ONE new chat row
        const newChat = await this.createNewChatSession(canonical, undefined, providedStoreId);
        if (newChat?.id) {
          console.log('[CHAT_RESTORE]', { assistantType: canonical, activeChatId: newChat.id, status: 'BOOTSTRAPPED_NEW' });
        }
        return newChat ? newChat.id : null;
      } catch (err: any) {
        console.warn(`[ChatSessionManager] Restore exception for ${canonical}:`, err);
        this.updateAssistant(canonical, { loading: false, error: err?.message || 'Restore error' });
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
    typeInput: AssistantType,
    title?: string,
    providedStoreId?: string | null
  ): Promise<ChatSession | null> {
    const canonical = normalizeAssistantType(typeInput);
    const chatContext = await umkmSupabaseService.resolveCanonicalChatContext(providedStoreId);
    if (!chatContext.ok || chatContext.status === 'DEFERRED' || !chatContext.storeId) {
      console.warn('[CHAT_CONTEXT_DEFERRED]', {
        assistantType: canonical,
        action: 'create',
        reason: chatContext.reason || 'CHAT_WAITING_FOR_CANONICAL_TENANT_CONTEXT'
      });
      return null;
    }

    const authUserId = chatContext.userId;
    const storeId = chatContext.storeId;
    const workspaceId = chatContext.workspaceId;

    const flightKey = `create:${canonical}:${authUserId}:${storeId}:${workspaceId}`;

    if (this.inFlightCreation.has(flightKey)) {
      return await this.inFlightCreation.get(flightKey)!;
    }

    const promise = (async () => {
      try {
        let createdSession: ChatSession | null = null;
        if (canonical === 'zega_copilot') {
          createdSession = await SupabaseDashboardService.createUmkmZegaCopilotChat(
            storeId,
            undefined,
            title || 'Diskusi ZEGA Copilot Utama'
          );
        } else {
          let roleTitle = 'ZEGA Assistant';
          if (canonical === 'home') roleTitle = 'ZEGA Home Assistant';
          if (canonical === 'help') roleTitle = 'ZEGA Help Assistant';
          if (canonical === 'finance') roleTitle = 'ZEGA Finance Assistant';
          if (canonical === 'knowledge') roleTitle = 'ZEGA Knowledge Assistant';

          createdSession = await SupabaseDashboardService.createUmkmAiAssistantChat(
            storeId,
            undefined,
            title || `Diskusi ${roleTitle}`,
            roleTitle
          );
        }

        if (createdSession && createdSession.id) {
          const currentChats = this.getAssistantState(canonical).chats;
          const updatedChats = [createdSession, ...currentChats.filter(c => c.id !== createdSession!.id)];

          this.updateAssistant(canonical, {
            chats: updatedChats,
            activeChatId: createdSession.id,
            loadedMessages: {
              ...this.getAssistantState(canonical).loadedMessages,
              [createdSession.id]: []
            },
            loading: false
          });
          console.log('[CHAT_CREATE]', { assistantType: canonical, chatId: createdSession.id, title: createdSession.title });
        }
        return createdSession;
      } catch (err: any) {
        console.warn(`[ChatSessionManager] createNewChatSession error for ${canonical}:`, err);
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
  public async loadChatMessages(typeInput: AssistantType, chatId: string): Promise<ChatMessage[]> {
    const canonical = normalizeAssistantType(typeInput);
    if (!chatId || !isValidUuid(chatId)) return [];

    const existing = this.getAssistantState(canonical).loadedMessages[chatId];
    if (existing) return existing;

    const flightKey = `messages:${canonical}:${chatId}`;
    if (this.inFlightMessages.has(flightKey)) {
      return await this.inFlightMessages.get(flightKey)!;
    }

    const promise = (async () => {
      try {
        let msgs: ChatMessage[] = [];
        if (canonical === 'zega_copilot') {
          msgs = await SupabaseDashboardService.getUmkmZegaCopilotMessages(chatId);
        } else {
          msgs = await SupabaseDashboardService.getUmkmAiAssistantMessages(chatId);
        }

        this.updateAssistant(canonical, {
          loadedMessages: {
            ...this.getAssistantState(canonical).loadedMessages,
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
    typeInput: AssistantType,
    chatId: string,
    sender: 'user' | 'assistant' | 'system' | 'copilot' | 'ai',
    message: string
  ): Promise<ChatMessage | null> {
    const canonical = normalizeAssistantType(typeInput);
    if (!chatId || !isValidUuid(chatId)) return null;

    const flightKey = `persist:${chatId}:${sender}:${message.slice(0, 50)}`;
    if (this.inFlightPersist.has(flightKey)) {
      return await this.inFlightPersist.get(flightKey)!;
    }

    const promise = (async (): Promise<ChatMessage | null> => {
      const currentMsgs = this.getAssistantState(canonical).loadedMessages[chatId] || [];
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
      this.updateAssistant(canonical, {
        loadedMessages: {
          ...this.getAssistantState(canonical).loadedMessages,
          [chatId]: optimisticMsgs
        }
      });

      console.log('[CHAT_MESSAGE_PERSIST]', { assistantType: canonical, chatId, sender, length: message.length });

      try {
        let persisted: ChatMessage | null = null;
        if (canonical === 'zega_copilot') {
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
          this.updateAssistant(canonical, {
            loadedMessages: {
              ...this.getAssistantState(canonical).loadedMessages,
              [chatId]: finalMsgs
            }
          });
          return persisted;
        }
      } catch (err: any) {
        console.warn(`[ChatSessionManager] appendAndPersistMessage exception:`, err);
      } finally {
        this.inFlightPersist.delete(flightKey);
      }
      return tempMsg;
    })();

    this.inFlightPersist.set(flightKey, promise);
    return await promise;
  }

  public async fetchChatList(typeInput: AssistantType, providedStoreId?: string | null): Promise<ChatSession[]> {
    const canonical = normalizeAssistantType(typeInput);
    const list = await this.fetchChatListFromDb(canonical, providedStoreId);
    this.updateAssistant(canonical, { chats: list });
    console.log('[CHAT_HISTORY]', { assistantType: canonical, count: list.length });
    return list;
  }

  private async fetchChatListFromDb(
    typeInput: AssistantType,
    providedStoreId?: string | null
  ): Promise<ChatSession[]> {
    const canonical = normalizeAssistantType(typeInput);
    const cleanUserId = (getActiveTenantIds().userId || '');
    let chatType: 'zega_copilot' | 'ai_assistant' | 'finance_ai' | 'live_help' = 'ai_assistant';

    if (canonical === 'zega_copilot') chatType = 'zega_copilot';
    else if (canonical === 'finance') chatType = 'finance_ai';
    else if (canonical === 'help') chatType = 'live_help';

    return await SupabaseDashboardService.getUmkmRecentChatHistory(cleanUserId, chatType);
  }

  private updateAssistant(canonical: CanonicalAssistantType, partial: Partial<AssistantState>): void {
    this.state[canonical] = {
      ...this.state[canonical],
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
