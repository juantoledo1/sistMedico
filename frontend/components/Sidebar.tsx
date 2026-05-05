
import React from 'react';
import { StitchType } from '../types';

interface SidebarProps {
  activeType: StitchType;
  onSelectType: (type: StitchType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeType, onSelectType }) => {
  const menuItems = [
    { type: StitchType.TEXT, label: 'Story', icon: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z' },
    { type: StitchType.IMAGE, label: 'Visual', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { type: StitchType.VIDEO, label: 'Motion', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { type: StitchType.AUDIO, label: 'Voice', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
  ];

  return (
    <aside className="w-20 lg:w-64 border-r border-zinc-800 flex flex-col py-6 px-3 bg-zinc-950">
      <div className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.type}
            onClick={() => onSelectType(item.type)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
              activeType === item.type 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-lg' 
                : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeType === item.type ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
              </svg>
            </div>
            <span className="hidden lg:block font-medium">{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="hidden lg:block p-4 mt-auto rounded-xl bg-zinc-900/50 border border-zinc-800">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Creative Tip</h4>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Stitch different media to tell a cinematic story. Try generating a text script, then converting it to voice.
        </p>
      </div>
    </aside>
  );
};
