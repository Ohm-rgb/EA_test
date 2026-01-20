'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { ChatMessage, ChatResponse, TokenUsage, SessionHistory } from '@/lib/api';

interface UseChatOptions {
    contextPage?: string;
    autoLoadHistory?: boolean;
}

interface UseChatReturn {
    messages: ChatMessage[];
    sessions: SessionHistory[];
    tokenUsage: TokenUsage | null;
    loading: boolean;
    sending: boolean;
    error: string | null;
    sendMessage: (content: string) => Promise<ChatResponse | null>;
    loadSession: (sessionId: number) => Promise<void>;
    refreshUsage: () => Promise<void>;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
    const { contextPage, autoLoadHistory = true } = options;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessions, setSessions] = useState<SessionHistory[]>([]);
    const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load sessions list
    const loadSessions = useCallback(async () => {
        try {
            const data = await api.getChatSessions(10);
            setSessions(data);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        }
    }, []);

    // Load messages from a session
    const loadSession = useCallback(async (sessionId: number) => {
        setLoading(true);
        try {
            const data = await api.getSessionMessages(sessionId);
            setMessages(data);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load session';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load token usage
    const refreshUsage = useCallback(async () => {
        try {
            const data = await api.getTokenUsage();
            setTokenUsage(data);
        } catch (err) {
            console.error('Failed to load token usage:', err);
        }
    }, []);

    // Send a message
    const sendMessage = useCallback(async (content: string): Promise<ChatResponse | null> => {
        if (!content.trim()) return null;

        setSending(true);
        setError(null);

        // Add user message optimistically
        const userMessage: ChatMessage = {
            role: 'user',
            content,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await api.sendChatMessage(content, contextPage);

            // Add AI response
            const aiMessage: ChatMessage = {
                role: response.role,
                content: response.message,
                tokens_used: response.tokens_used,
                model_used: response.model_used,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, aiMessage]);

            // Refresh token usage
            refreshUsage();

            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send message';
            setError(message);

            // Remove optimistic user message on error
            setMessages(prev => prev.slice(0, -1));

            return null;
        } finally {
            setSending(false);
        }
    }, [contextPage, refreshUsage]);

    // Initial load
    useEffect(() => {
        if (autoLoadHistory) {
            loadSessions();
            refreshUsage();
        }
    }, [autoLoadHistory, loadSessions, refreshUsage]);

    return {
        messages,
        sessions,
        tokenUsage,
        loading,
        sending,
        error,
        sendMessage,
        loadSession,
        refreshUsage,
    };
}

export default useChat;
