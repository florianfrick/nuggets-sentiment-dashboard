import React, { useState, useRef, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Assuming you have generated this query via Amplify. 
// If not, you can define it locally here like this:
const askNuggetsAIGraphQL = /* GraphQL */ `
  query AskNuggetsAI($question: String!) {
    askNuggetsAI(question: $question)
  }
`;

const client = generateClient();

export default function AIChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: "Hello! I'm the Nuggets AI. Ask me anything about player sentiment, performance, recent games, or season trends." 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQuestion = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuestion }]);
    setIsLoading(true);

    try {
      // Call the AppSync Lambda Resolver
      const response = await client.graphql({
        query: askNuggetsAIGraphQL,
        variables: { question: userQuestion }
      });

      const aiResponse = response.data.askNuggetsAI;
      
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('Error querying AI:', error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "Sorry, I couldn't connect to the server right now. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col mt-6 overflow-hidden w-full">
      
      {/* Header */}
      <div className="bg-slate-800/40 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-yellow-500" />
        <h4 className="text-white font-bold text-sm uppercase tracking-wider">
          Ask Nuggets AI
        </h4>
        <span className="ml-auto text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
          Gemma 3 27B
        </span>
      </div>

      {/* Chat Messages Area */}
      <div className="p-4 h-64 sm:h-80 overflow-y-auto flex flex-col gap-4 scrollbar-hide">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-[#38bdf8] text-slate-900' : 'bg-slate-800 border border-slate-700 text-yellow-500'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                    ? 'bg-[#38bdf8]/10 text-slate-200' 
                    : 'bg-slate-800/50 text-slate-300'
                }`}>
                {/* If it's the AI, render as Markdown. If it's the user, just show text. */}
                {msg.role === 'ai' ? (
                    <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                    {msg.content}
                    </ReactMarkdown>
                ) : (
                    msg.content
                )}
            </div>

          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 flex-row">
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 text-yellow-500">
              <Bot size={16} />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 bg-slate-800/50 border border-slate-700 flex items-center">
              <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
              <span className="ml-2 text-sm text-slate-400 animate-pulse">Analyzing stats...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/60">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="E.g., How did Jokic's sentiment change after this game?"
            className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all placeholder:text-slate-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-1.5 bg-[#38bdf8] text-slate-900 rounded-lg hover:bg-sky-400 disabled:opacity-50 disabled:hover:bg-[#38bdf8] transition-colors"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
}