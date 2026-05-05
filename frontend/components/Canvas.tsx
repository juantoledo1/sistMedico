
import React from 'react';
/* Fix: Changed StitchItem to StitchBlock as StitchItem is not exported from types */
import { StitchBlock, StitchType } from '../types';

interface CanvasProps {
  /* Fix: Changed StitchItem to StitchBlock */
  activeStitch: StitchBlock | null;
  onPlayAudio: (content: string) => void;
  isGenerating: boolean;
  genMessage: string;
}

export const Canvas: React.FC<CanvasProps> = ({ activeStitch, onPlayAudio, isGenerating, genMessage }) => {
  if (isGenerating) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/40 p-12">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-indigo-600/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-indigo-500 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <h3 className="mt-8 text-xl font-medium text-white">{genMessage}</h3>
        <p className="mt-2 text-zinc-400 text-sm">Gemini is hard at work creating your content...</p>
      </div>
    );
  }

  if (!activeStitch) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 p-12 text-center">
        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-zinc-300">Workspace Empty</h2>
        <p className="max-w-xs mt-2">Select a tool from the sidebar and enter a prompt below to start stitching.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-black/40">
      {activeStitch.type === StitchType.TEXT && (
        <div className="max-w-2xl w-full bg-zinc-900/80 p-10 rounded-2xl shadow-2xl border border-zinc-800 animate-in fade-in zoom-in duration-300">
          <h4 className="text-xs font-mono text-zinc-500 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> TEXT CONTENT
          </h4>
          <div className="prose prose-invert prose-indigo">
             {/* Fix: Changed activeStitch.content to activeStitch.output */}
             <p className="text-xl leading-relaxed text-zinc-200 whitespace-pre-wrap">{activeStitch.output}</p>
          </div>
        </div>
      )}

      {activeStitch.type === StitchType.IMAGE && (
        <div className="relative max-h-full group animate-in fade-in scale-95 duration-500">
           {/* Fix: Changed activeStitch.content to activeStitch.output */}
           <img src={activeStitch.output} className="max-h-[70vh] rounded-xl shadow-2xl border border-zinc-800" alt="Generated" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end p-6">
             <p className="text-sm text-zinc-300 italic">{activeStitch.prompt}</p>
           </div>
        </div>
      )}

      {activeStitch.type === StitchType.VIDEO && (
        <div className="w-full max-w-4xl animate-in fade-in duration-500">
           {/* Fix: Changed activeStitch.content to activeStitch.output */}
           <video 
             src={activeStitch.output} 
             controls 
             autoPlay 
             loop 
             className="w-full h-auto rounded-xl shadow-2xl border border-zinc-800"
           />
        </div>
      )}

      {activeStitch.type === StitchType.AUDIO && (
        <div className="max-w-md w-full bg-zinc-900 p-8 rounded-2xl border border-zinc-800 text-center animate-in slide-in-from-bottom duration-300">
          <div className="w-20 h-20 rounded-full bg-pink-600/20 text-pink-500 flex items-center justify-center mx-auto mb-6">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
             </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Voice Generated</h3>
          {/* Fix: StitchBlock doesn't have metadata, using default 'Kore' */}
          <p className="text-zinc-400 text-sm mb-6">Voice: Kore</p>
          <button 
            /* Fix: Changed activeStitch.content to activeStitch.output */
            onClick={() => onPlayAudio(activeStitch.output)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            Play Content
          </button>
        </div>
      )}
    </div>
  );
};
