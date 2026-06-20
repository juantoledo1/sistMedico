
/* Fix: Changed StitchItem to StitchBlock as StitchItem is not exported from types */
import { StitchBlock, StitchType } from '../types';

interface TimelineProps {
  /* Fix: Changed StitchItem[] to StitchBlock[] */
  items: StitchBlock[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function Timeline({ items, activeId, onSelect, onRemove }: TimelineProps) {
  return (
    <div className="h-32 border-t border-zinc-800 bg-zinc-950 p-4 flex gap-4 overflow-x-auto items-center">
      {items.length === 0 ? (
        <div className="w-full flex items-center justify-center text-zinc-600 italic text-sm">
          Your creative journey starts here. Generate something!
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className={`flex-shrink-0 relative group h-24 w-40 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
              activeId === item.id ? 'border-indigo-500 scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
            }`}
            onClick={() => onSelect(item.id)}
          >
            <div className="absolute top-1 left-1 z-10">
              <span className={`px-1.5 py-0.5 text-[10px] rounded font-bold uppercase ${
                item.type === StitchType.TEXT ? 'bg-blue-600' :
                item.type === StitchType.IMAGE ? 'bg-green-600' :
                item.type === StitchType.VIDEO ? 'bg-purple-600' : 'bg-pink-600'
              }`}>
                {item.type}
              </span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
              className="absolute top-1 right-1 z-20 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>

            {/* Fix: Changed item.content to item.output to match StitchBlock interface */}
            {item.type === StitchType.TEXT && (
              <div className="w-full h-full bg-zinc-900 p-2 text-[8px] overflow-hidden leading-tight">
                {item.output}
              </div>
            )}
            {item.type === StitchType.IMAGE && (
              <img src={item.output} className="w-full h-full object-cover" alt="stitch" />
            )}
            {item.type === StitchType.VIDEO && (
              <video src={item.output} className="w-full h-full object-cover" muted />
            )}
            {item.type === StitchType.AUDIO && (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0" />
                </svg>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-[10px] text-zinc-300 truncate mt-3">{item.prompt}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
