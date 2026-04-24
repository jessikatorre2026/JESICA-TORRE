import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatInterface() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', parts: { text: string }[] }[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, parts: [{ text: input }] }];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMessages([...newMessages, { role: 'assistant' as const, parts: [{ text: data.response }] }]);
    } catch (error: any) {
      setMessages([...newMessages, { role: 'assistant' as const, parts: [{ text: "Error: " + error.message }] }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0b10] text-slate-200 p-6 font-sans grid-bg relative">
      <div className="scanline" />
      <header className="flex justify-between items-end border-b border-slate-800 pb-4 mb-6">
        <div className="flex flex-col">
          <span className="terminal-font text-[10px] text-slate-500 uppercase tracking-widest mb-1">Deep Space Network // Unit Z-7</span>
          <h1 className="text-2xl font-bold tracking-tighter text-white">AXIOMA-MATH <span className="text-slate-500 font-light">OS v4.26</span></h1>
        </div>
      </header>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start gap-2 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {m.role === 'assistant' ? <Bot className="text-green-500 mt-1" /> : <User className="text-blue-500 mt-1" />}
              <div className={`p-3 rounded-lg text-sm ${m.role === 'user' ? 'user-bubble' : 'chat-bubble'}`}>
                {m.parts[0].text}
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-center gap-2 text-green-500 terminal-font text-xs">
            <Loader2 className="animate-spin" /> Z-7 analizando datos...
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4 border-t border-slate-800 pt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 bg-black border border-slate-700 rounded p-3 text-sm terminal-font focus:outline-none focus:border-green-500 text-green-400"
          placeholder="Introduzca datos de resolución..."
        />
        <button onClick={sendMessage} className="bg-green-600 hover:bg-green-500 text-black font-bold px-6 py-2 rounded terminal-font text-xs transition-colors">
          TRANSMITIR
        </button>
      </div>
    </div>
  );
}
