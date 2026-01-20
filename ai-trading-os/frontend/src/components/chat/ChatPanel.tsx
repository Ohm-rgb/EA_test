'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useChat } from '@/hooks';
import { GlassCard, Badge } from '@/components/ui';

export function ChatPanel() {
    const pathname = usePathname();
    const {
        messages,
        loading,
        sending,
        error,
        tokenUsage,
        sendMessage
    } = useChat({ contextPage: pathname });

    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const content = input;
        setInput('');
        await sendMessage(content);
    };

    return (
        <>
            {/* Toggle Button (FAB) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all z-50 ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
            >
                {isOpen ? (
                    <span className="text-2xl text-white">×</span>
                ) : (
                    <span className="text-2xl text-white">💬</span>
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[600px] z-40 fade-in">
                    <GlassCard className="h-full flex flex-col overflow-hidden border-emerald-500/30 shadow-2xl backdrop-blur-xl">
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-emerald-400">AI Secretary</h3>
                                <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Online • {tokenUsage ? `${tokenUsage.today} tokens used today` : 'Ready'}
                                </div>
                            </div>
                            <div className="text-xs">
                                <Badge variant="info">
                                    {pathname.split('/').pop() || 'Home'}
                                </Badge>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-[var(--text-muted)] mt-10">
                                    <div className="text-4xl mb-4">🤖</div>
                                    <p>Hello! I'm your AI trading assistant.</p>
                                    <p className="text-sm mt-2">Ask me about your portfolio, bots, or market analysis.</p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                            ? 'bg-emerald-500/20 text-emerald-100 rounded-tr-none'
                                            : 'bg-white/10 text-white rounded-tl-none'
                                            }`}
                                    >
                                        <div className="break-words">{msg.content}</div>
                                        {msg.model_used && (
                                            <div className="text-[10px] opacity-50 mt-1 text-right">
                                                {msg.model_used} • {msg.tokens_used}t
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {sending && (
                                <div className="flex justify-start">
                                    <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-2 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-75" />
                                        <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-150" />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="text-center text-red-400 text-xs bg-red-500/10 p-2 rounded">
                                    Error: {error}
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black/20">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || sending}
                                    className="absolute right-2 top-2 p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ➤
                                </button>
                            </div>
                            <div className="text-[10px] text-center text-[var(--text-muted)] mt-2">
                                AI can make mistakes. Consider checking important info.
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </>
    );
}

export default ChatPanel;
