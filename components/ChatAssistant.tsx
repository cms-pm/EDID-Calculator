
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, EdidParams } from '../types';
import { askAssistant } from '../services/geminiService';
import EddyAvatar from './EddyAvatar';

interface ChatAssistantProps {
  onFormUpdate: (params: Partial<EdidParams>) => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ onFormUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hello! I'm Eddy, your display protocol expert. I can help you understand the details of HDMI, EDID, and display timings. Feel free to ask me anything about VESA standards, how pixel clocks are calculated, or what horizontal blanking means. You can also paste in timing data directly, and I'll fill out the form for you!" }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askAssistant(messages, input.trim());
      
      let modelResponseText = response.text;
      if (response.functionCall?.name === 'updateEdidForm') {
        onFormUpdate(response.functionCall.args);
        modelResponseText = "OK, got it! I updated the form for you.";
      }

      const modelMessage: ChatMessage = { role: 'model', text: modelResponseText };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I couldn't connect to the assistant. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm shadow-2xl flex flex-col h-[70vh] lg:h-full rounded-xl border border-gray-700">
      <div className="p-4 border-b border-gray-700 flex items-center justify-center space-x-3">
        <EddyAvatar />
        <h2 className="text-xl font-semibold text-teal-300">Chat with Eddy</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.role === 'model' && <EddyAvatar />}
            <div className={`max-w-xs md:max-w-sm lg:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3 justify-start">
               <EddyAvatar />
              <div className="max-w-xs md:max-w-sm lg:max-w-md px-4 py-2 rounded-2xl bg-gray-700 text-gray-200 rounded-bl-none">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-teal-300 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-teal-300 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-teal-300 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700 sticky bottom-0 bg-gray-800/50 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Eddy a question..."
            className="flex-1 w-full bg-gray-900/50 border-gray-600 rounded-full py-2 px-4 text-gray-200 focus:ring-teal-400 focus:border-teal-400 transition"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-teal-600 text-white rounded-full p-2 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;