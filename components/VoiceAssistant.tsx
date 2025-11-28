
import React, { useState, useEffect, useRef } from 'react';
import Waveform from './Waveform';
import { connectToLiveApi } from '../services/geminiService';
import { ChatMessage, EventData, CocktailRecipe } from '../types';

interface VoiceAssistantProps {
  eventContext: EventData | EventData[]; // Updated to accept array
  onTranscription: (text: string, isUser: boolean, source?: 'voice' | 'text') => void;
  history: ChatMessage[];
  onUpdateHeadcount: (count: number) => void;
  onGenerateList: () => void;
  onAddRecipe: (recipe: CocktailRecipe) => void;
  onUpdateCocktails: (action: 'add' | 'remove', name: string) => void;
  onUpdateDetails: (field: string, value: string) => void;
  onUpdateRental: (action: string, itemType: string, subtype?: string, quantity?: number) => void;
  onSendEmail: (recipientName?: string) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
    eventContext, 
    onTranscription, 
    history,
    onUpdateHeadcount,
    onGenerateList,
    onAddRecipe,
    onUpdateCocktails,
    onUpdateDetails,
    onUpdateRental,
    onSendEmail
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [inputText, setInputText] = useState("");
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sessionRef = useRef<any>(null);
  
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Initialize Audio Contexts
  const initAudio = () => {
     if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
         analyzerRef.current = audioContextRef.current.createAnalyser();
     }
     if (!outputContextRef.current) {
         outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
     }
  };

  const handleToggleMic = async () => {
    if (isActive) {
      stopSession();
    } else {
      await startSession();
    }
  };

  const startSession = async () => {
    try {
      initAudio();
      setIsActive(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const inputCtx = audioContextRef.current!;
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(analyzerRef.current!);
      analyzerRef.current!.connect(processor); 
      processor.connect(inputCtx.destination);

      const sessionPromise = connectToLiveApi(
        playAudioChunk, 
        (text, isUser) => onTranscription(text, isUser, 'voice'), 
        eventContext,
        {
            onUpdateHeadcount,
            onGenerateList,
            onAddRecipe,
            onUpdateCocktails,
            onUpdateDetails,
            onUpdateRental,
            onSendEmail
        }
      );

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = inputData[i] * 32768;
        }
        
        const uint8 = new Uint8Array(pcmData.buffer);
        let binary = '';
        for (let i = 0; i < uint8.byteLength; i++) {
             binary += String.fromCharCode(uint8[i]);
        }
        const b64 = btoa(binary);

        sessionPromise.then(session => {
            sessionRef.current = session;
            setIsConnected(true);
            session.sendRealtimeInput({
                media: {
                    mimeType: "audio/pcm;rate=16000",
                    data: b64
                }
            });
        });
      };
      
    } catch (err) {
      console.error("Failed to start voice session", err);
      setIsActive(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnected(false);
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    processorRef.current?.disconnect();
    if (sessionRef.current) {
        sessionRef.current = null;
    }
  };
  
  const playAudioChunk = async (base64String: string) => {
      const ctx = outputContextRef.current;
      if (!ctx) return;

      const binaryString = atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768.0;
      }
      
      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onTranscription(inputText, true, 'text');
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-black/20">
      
      {/* --- TOP: VOICE HEADER --- */}
      <div className="shrink-0 flex flex-col items-center pt-6 pb-2 relative z-10 bg-gradient-to-b from-dark-900 to-transparent">
        <div className="relative">
            <button
            onClick={handleToggleMic}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl
                ${isActive 
                ? 'bg-burgundy-900 shadow-[0_0_30px_rgba(122,31,47,0.5)] scale-105' 
                : 'bg-dark-800 border-2 border-gold-400/30 hover:border-gold-400 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                }`}
            >
            {isActive ? (
                <div className="w-6 h-6 bg-white rounded animate-pulse" />
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            )}
            </button>
        </div>
        
        {/* Compact Waveform */}
        <div className="w-64 h-12 mt-4">
             <Waveform isActive={isActive} analyzer={analyzerRef.current || undefined} />
        </div>
        
        <div className={`mt-2 text-center font-serif text-xs tracking-widest transition-colors duration-300 ${isActive ? 'text-gold-400' : 'text-gray-600'}`}>
          {isActive ? (isConnected ? "LISTENING..." : "CONNECTING...") : "TAP TO SPEAK"}
        </div>
      </div>

      {/* --- MIDDLE: CHAT HISTORY --- */}
      <div className="flex-1 w-full max-w-4xl mx-auto overflow-y-auto px-6 py-4 scrollbar-thin space-y-4">
        {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <span className="text-sm font-medium">Start the conversation...</span>
            </div>
        )}
        
        {history.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
                <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                        <div 
                            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md
                            ${isUser 
                                ? 'bg-gold-500 text-dark-900 font-medium rounded-br-none' 
                                : 'bg-white/10 backdrop-blur-md text-gray-100 border border-white/10 rounded-bl-none'
                            }`}
                        >
                            {msg.content}
                        </div>
                        <span className="text-[10px] text-gray-600 mt-1 px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                </div>
            );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* --- BOTTOM: INPUT BAR --- */}
      <div className="shrink-0 p-6 w-full max-w-4xl mx-auto z-20">
          <form onSubmit={handleInputSubmit} className="relative group">
              <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message or update details..." 
                  className="w-full bg-dark-900/90 backdrop-blur border border-white/10 rounded-full py-4 px-6 pr-14 text-white placeholder-gray-500 focus:outline-none focus:border-gold-400/50 transition-all shadow-lg group-hover:border-white/20"
              />
              <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all duration-200 shadow-md flex items-center justify-center
                    ${!inputText.trim() 
                      ? 'bg-white/10 text-gray-500 cursor-not-allowed' 
                      : 'bg-gold-400 hover:bg-gold-500 text-dark-900 cursor-pointer'
                    }`}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
              </button>
          </form>
      </div>
    </div>
  );
};

export default VoiceAssistant;
