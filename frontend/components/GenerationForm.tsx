
import { useState } from 'react';
import { StitchType } from '../types';

interface GenerationFormProps {
  type: StitchType;
  onGenerate: (prompt: string, options?: any) => void;
  isGenerating: boolean;
}

export function GenerationForm({ type, onGenerate, isGenerating }: GenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [voice, setVoice] = useState('Kore');

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt, { voice });
    setPrompt('');
  };

  const getPlaceholder = () => {
    switch (type) {
      case StitchType.TEXT: return "Describe the story or theme you want to write...";
      case StitchType.IMAGE: return "A cinematic wide shot of a futuristic city with neon lights...";
      case StitchType.VIDEO: return "A slow motion drone shot flying through a mountain range...";
      case StitchType.AUDIO: return "Enter text you want to hear spoken aloud...";
      default: return "What should Gemini create?";
    }
  };

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 shadow-xl">
      <div className="flex flex-col gap-3">
        {type === StitchType.AUDIO && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {voices.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setVoice(v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  voice === v ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
        
        <div className="relative flex items-end gap-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={getPlaceholder()}
            className="flex-1 min-h-[100px] max-h-[300px] bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600 transition-all resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
              !prompt.trim() || isGenerating 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20'
            }`}
          >
            {isGenerating ? (
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex justify-between items-center px-2">
           <span className="text-[10px] text-zinc-600 font-mono">POWERED BY {type === StitchType.VIDEO ? 'VEO 3.1' : 'GEMINI 2.5/3'}</span>
           <span className="text-[10px] text-zinc-600">Press Enter to generate</span>
        </div>
      </div>
    </form>
  );
};
