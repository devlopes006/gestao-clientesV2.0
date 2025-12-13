"use client";

import { useState } from "react";

export default function CanvasPreview() {
  const [tab, setTab] = useState<"header" | "card" | "social">("header");

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setTab("header")} className={`px-3 py-1 rounded-lg border ${tab === 'header' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>Web Header</button>
          <button onClick={() => setTab("card")} className={`px-3 py-1 rounded-lg border ${tab === 'card' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>Business Card</button>
          <button onClick={() => setTab("social")} className={`px-3 py-1 rounded-lg border ${tab === 'social' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>Social</button>
        </div>
        <div className="text-sm text-slate-400">Preview</div>
      </div>

      <div className="w-full h-[420px] border border-dashed border-slate-700 rounded-xl flex items-center justify-center bg-slate-800">
        {tab === 'header' && <div className="w-full h-20 flex items-center px-6 bg-slate-700 rounded-lg">
          <div className="text-xl font-bold text-white">Client Logo</div>
        </div>}
        {tab === 'card' && <div className="w-72 h-40 bg-slate-700 rounded-lg p-4 shadow flex flex-col justify-center items-start">
          <div className="text-lg font-semibold text-white">Company Name</div>
          <div className="text-sm text-slate-300">Job Title</div>
        </div>}
        {tab === 'social' && <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center text-white">Avatar</div>}
      </div>
    </div>
  );
}
