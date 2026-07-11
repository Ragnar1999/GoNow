import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, type ChatMessage } from '../api/client';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [toolStatus, setToolStatus] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setToolStatus('Thinking...');

    try {
      const res = await sendChatMessage(userMsg.content, undefined, messages);
      setToolStatus('');
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setToolStatus('');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    'Search for player "Zhan Shi"',
    'How does Go rating work?',
    'Compare two top players',
  ];

  return (
    <>
      {/* Floating Button - Stone shaped */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} style={styles.fab}>
          <span style={{ fontSize: 22 }}>&#x2686;</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={styles.chatWindow}>
          {/* Header */}
          <div style={styles.chatHeader}>
            <div style={styles.headerLeft}>
              <div style={styles.headerStone}>&#x268A;</div>
              <div>
                <h3 style={styles.chatTitle}>Go Assistant</h3>
                <p style={styles.chatSubtitle}>Ask about players, ratings &middot; EGD powered</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>
              &times;
            </button>
          </div>

          {/* Messages */}
          <div style={styles.messagesArea}>
            {messages.length === 0 && (
              <div style={styles.welcome}>
                <div style={styles.welcomeStone}>&#x2686;</div>
                <p style={styles.welcomeText}>
                  Hi! I'm your Go analytics assistant. I can look up players,
                  compare stats, and answer Go questions.
                </p>
                <div style={styles.quickPrompts}>
                  {quickPrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(p); }}
                      style={styles.quickBtn}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={msg.role === 'user' ? styles.userMsg : styles.assistantMsg}
              >
                <div style={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={styles.assistantMsg}>
                {toolStatus && (
                  <div style={styles.toolIndicator}>
                    <div style={styles.toolDot} />
                    <span>{toolStatus}</span>
                  </div>
                )}
                <div style={styles.assistantBubble}>
                  <span style={styles.typing}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={styles.inputArea}>
            <input
              className="search-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Go..."
              style={styles.input}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={styles.sendBtn}
            >
              &#x25B6;
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fab: {
    position: 'fixed' as const, bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, #444, var(--stone-black))',
    border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, color: '#fff',
  },
  chatWindow: {
    position: 'fixed' as const, bottom: 24, right: 24,
    width: 380, height: 520, borderRadius: 16,
    background: 'var(--bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column' as const,
    zIndex: 1000, overflow: 'hidden',
    border: '1px solid var(--border)',
  },
  chatHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', background: 'var(--slate)', color: '#fff',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerStone: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, #555, #1a1a1a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, color: '#fff',
  },
  chatTitle: { fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--wood)' },
  chatSubtitle: { fontSize: 11, margin: 0, opacity: 0.7, color: '#ccc' },
  closeBtn: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
    fontSize: 24, cursor: 'pointer', padding: 0, lineHeight: 1,
  },
  messagesArea: {
    flex: 1, overflowY: 'auto' as const, padding: 16,
    display: 'flex', flexDirection: 'column' as const, gap: 10,
  },
  welcome: { textAlign: 'center' as const, padding: '20px 0' },
  welcomeStone: {
    fontSize: 40, marginBottom: 12,
    textShadow: '2px 2px 4px rgba(0,0,0,0.15)',
  },
  welcomeText: { fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5 },
  quickPrompts: { display: 'flex', flexDirection: 'column' as const, gap: 6, marginTop: 14 },
  quickBtn: {
    background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--wood-dark)',
    textAlign: 'left' as const, fontWeight: 500,
  },
  userMsg: { display: 'flex', justifyContent: 'flex-end' },
  assistantMsg: { display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' as const, gap: 4 },
  userBubble: {
    background: 'var(--wood-dark)', color: '#fff', borderRadius: '16px 16px 4px 16px',
    padding: '10px 14px', maxWidth: '80%', fontSize: 14, lineHeight: 1.4,
  },
  assistantBubble: {
    background: 'var(--card-bg)', color: 'var(--text)', borderRadius: '16px 16px 16px 4px',
    padding: '10px 14px', maxWidth: '80%', fontSize: 14, lineHeight: 1.4,
    border: '1px solid var(--border)',
  },
  toolIndicator: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, color: 'var(--wood-dark)', fontWeight: 500,
    padding: '2px 8px',
  },
  toolDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--wood-dark)',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
  typing: { color: 'var(--text-light)', fontStyle: 'italic' },
  inputArea: {
    display: 'flex', gap: 8, padding: '10px 14px',
    borderTop: '1px solid var(--border)', background: 'var(--card-bg)',
  },
  input: {
    flex: 1, border: '1px solid var(--border)', borderRadius: 8,
    padding: '8px 12px', fontSize: 14, outline: 'none',
    background: 'var(--bg)',
  },
  sendBtn: {
    background: 'var(--wood-dark)', color: '#fff', border: 'none', borderRadius: '50%',
    width: 36, height: 36, cursor: 'pointer', fontSize: 14, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
