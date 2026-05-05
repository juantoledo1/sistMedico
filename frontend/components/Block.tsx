
import React, { useState } from 'react';
import { StitchBlock, StitchType } from '../types';

interface BlockProps {
  block: StitchBlock;
  onUpdate: (id: string, updates: Partial<StitchBlock>) => void;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  onPlayAudio?: (base64: string) => void;
}

export const Block: React.FC<BlockProps> = ({ block, onUpdate, onRun, onDelete, onPlayAudio }) => {
  const [isFocused, setIsFocused] = useState(false);

  const typeIcons = {
    [StitchType.TEXT]: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z',
    [StitchType.IMAGE]: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14',
    [StitchType.VIDEO]: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14',
    [StitchType.AUDIO]: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4',
  };

  return (
    <div className={`group relative mb-8 rounded-2xl border transition-all duration-300 ${
      isFocused ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] bg-zinc-900/80' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${
            block.type === StitchType.TEXT ? 'bg-blue-600/20 text-blue-400' :
            block.type === StitchType.IMAGE ? 'bg-green-600/20 text-green-400' :
            block.type === StitchType.VIDEO ? 'bg-purple-600/20 text-purple-400' : 'bg-pink-600/20 text-pink-400'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={typeIcons[block.type]} />
            </svg>
          </div>
          <input 
            value={block.name}
            onChange={(e) => onUpdate(block.id, { name: e.target.value })}
            className="bg-transparent font-medium text-zinc-300 focus:outline-none focus:text-white"
          />
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <select 
            value={block.type}
            onChange={(e) => onUpdate(block.id, { type: e.target.value as StitchType })}
            className="bg-zinc-800 text-[10px] px-2 py-1 rounded border border-zinc-700 text-zinc-400"
          >
            {Object.values(StitchType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button 
            onClick={() => onDelete(block.id)}
            className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors text-zinc-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Prompt</label>
          <textarea 
            value={block.prompt}
            onChange={(e) => onUpdate(block.id, { prompt: e.target.value })}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type your prompt... use {{VariableName}} to reference other blocks."
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all min-h-[80px] resize-none"
          />
        </div>

        {/* Run Button */}
        <div className="flex items-center justify-between pt-2">
           <div className="flex gap-2">
             <span className="text-[10px] text-zinc-600 font-mono">ID: {block.id.split('-')[0]}</span>
           </div>
           <button 
             onClick={() => onRun(block.id)}
             disabled={block.isGenerating}
             className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-sm transition-all shadow-lg ${
               block.isGenerating 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-blue-500/20'
             }`}
           >
             {block.isGenerating ? (
               <>
                 <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 Generating...
               </>
             ) : (
               <>
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                 Run Block
               </>
             )}
           </button>
        </div>

        {/* Output */}
        {(block.output || block.error) && (
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-4">Result</label>
            
            {block.error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {block.error}
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden bg-zinc-950/30">
                {block.type === StitchType.TEXT && (
                  <div className="p-4 text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm italic border-l-2 border-blue-500 bg-blue-500/5">
                    {block.output}
                  </div>
                )}
                {block.type === StitchType.IMAGE && (
                  <img src={block.output} className="w-full h-auto rounded-lg shadow-2xl" alt="Result" />
                )}
                {block.type === StitchType.VIDEO && (
                  <video src={block.output} controls className="w-full rounded-lg" />
                )}
                {block.type === StitchType.AUDIO && (
                  <div className="p-4 flex items-center gap-4 bg-zinc-900 rounded-lg">
                    <button 
                      onClick={() => onPlayAudio?.(block.output)}
                      className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center text-white shadow-lg"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    </button>
                    <div className="flex-1">
                      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 w-1/3 animate-pulse"></div>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 block">Generated Voice Stream</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
