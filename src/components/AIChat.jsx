import React, { useState, useRef, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { v4 as uuidv4 } from 'uuid';
import { Send, Bot, User, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const sendQuestionMutation = /* GraphQL */ `
  mutation SendQuestion($sessionId: String!, $question: String!, $history: String) {
    sendQuestion(sessionId: $sessionId, question: $question, history: $history)
  }
`;

const onAIResponseSubscription = /* GraphQL */ `
  subscription OnAIResponse($sessionId: String!) {
    onAIResponse(sessionId: $sessionId) {
      sessionId
      answer
      type
    }
  }
`;

const client = generateClient();

export default function AIChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: "Hello! I'm the Nuggets AI powered by gemma-4-31b-it. Ask me anything about player sentiment, performance, recent games, or season trends.",
      thoughts: [],
      isThinking: false
    }
  ]);
  // Global loading state for disabling inputs
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref for the scrollable chat container
  const chatContainerRef = useRef(null);
  
  const sessionId = useRef(uuidv4()).current;
  const requestStartTime = useRef(null);

  // Directly scroll the container instead of the whole page
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // STEP 1: WebSocket Listener
  useEffect(() => {
    const subscription = client.graphql({
      query: onAIResponseSubscription,
      variables: { sessionId: sessionId }
    }).subscribe({
      next: ({ data }) => {
        const { answer, type } = data.onAIResponse;
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsgIndex = newMessages.length - 1;
          const lastMsg = newMessages[lastMsgIndex];

          if (lastMsg.role === 'ai') {
            const updatedMsg = { ...lastMsg };

            if (type === 'THOUGHT') {
              // Add thought to the array
              updatedMsg.thoughts = [...(updatedMsg.thoughts || []), answer];
            } 
            else if (type === 'DONE') {
              // Pop in the full final text
              updatedMsg.content = answer;
              updatedMsg.isThinking = false;
              setIsLoading(false);
              
              if (requestStartTime.current) {
                const endTime = performance.now();
                updatedMsg.timeTaken = ((endTime - requestStartTime.current) / 1000).toFixed(1);
              }
            }
            else if (type === 'ERROR') {
              updatedMsg.content = answer;
              updatedMsg.isThinking = false;
              setIsLoading(false);
            }

            newMessages[lastMsgIndex] = updatedMsg;
          }
          return newMessages;
        });
      },
      error: (error) => {
        console.error('WebSocket Error:', error);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [sessionId]);

  // STEP 2: Handle Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuestion = input.trim();
    setInput('');
    setIsLoading(true);
    requestStartTime.current = performance.now();

    // Append user message AND an empty AI message that is "thinking"
    setMessages(prev => [
      ...prev, 
      { role: 'user', content: userQuestion },
      { role: 'ai', content: '', thoughts: [], isThinking: true }
    ]);

    try {
      await client.graphql({
        query: sendQuestionMutation,
        variables: { 
          sessionId: sessionId, 
          question: userQuestion,
          history: JSON.stringify(messages)
        }
      });
    } catch (error) {
      console.error('Error triggering AI job:', error);
      setIsLoading(false);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].content = "Failed to connect to server.";
        newMsgs[newMsgs.length - 1].isThinking = false;
        return newMsgs;
      });
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col mt-6 overflow-hidden w-full resize-y min-h-[400px] max-h-[85vh]">
      {/* Header */}
      <div className="bg-slate-800/40 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-yellow-500" />
        <h4 className="text-white font-bold text-sm uppercase tracking-wider">Ask Nuggets AI</h4>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef} 
        className="p-4 flex-1 overflow-y-auto flex flex-col gap-4 scrollbar-hide"
      >
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-[#38bdf8] text-slate-900' : 'bg-slate-800 border border-slate-700 text-yellow-500'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* THOUGHTS RENDERER */}
              {msg.role === 'ai' && msg.thoughts && msg.thoughts.length > 0 && (
                <div className="mb-2 w-full">
                  <details className="group" open={msg.isThinking}>
                    <summary className="flex items-center gap-2 cursor-pointer list-none text-xs text-slate-400 hover:text-slate-300 transition-colors">
                      <BrainCircuit size={12} className={msg.isThinking ? 'animate-pulse text-[#38bdf8]' : ''} />
                      <span className="font-mono">
                        {msg.isThinking ? 'Agent is analyzing...' : 'View thought process'}
                      </span>
                    </summary>
                    <div className="mt-2 pl-4 border-l-2 border-slate-700/50 flex flex-col gap-1.5">
                      {msg.thoughts.map((thought, i) => (
                        <span key={i} className="text-xs font-mono text-slate-500">
                          {">"} {thought}
                        </span>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* MAIN CONTENT OR SPINNER */}
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#38bdf8]/10 text-slate-200' 
                    : 'bg-slate-800/50 text-slate-300'
                }`}>
                
                {msg.role === 'ai' ? (
                  msg.isThinking ? (
                    // Show a nice loading spinner while waiting for the full text
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                      <span className="animate-pulse">Generating response...</span>
                    </div>
                  ) : (
                    // Show the final text once it arrives
                    <div className="flex flex-col">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert prose-sm max-w-none">
                        {msg.content}
                      </ReactMarkdown>
                      {msg.timeTaken && (
                        <span className="text-[10px] text-slate-500 self-end mt-2 select-none">
                          ✨ Generated in {msg.timeTaken}s
                        </span>
                      )}
                    </div>
                  )
                ) : (
                    msg.content
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Input Form & Footer */}
      <div className="border-t border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-2">
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="How have Jokic and AG been playing recently?"
              className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all placeholder:text-slate-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-1.5 bg-[#38bdf8] text-slate-900 rounded-lg hover:bg-sky-400 disabled:opacity-50 disabled:hover:bg-[#38bdf8] transition-colors"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin ml-0.5" /> : <Send size={16} className="ml-0.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}