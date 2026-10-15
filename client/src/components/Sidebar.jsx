import React from 'react';
import { 
  MessageSquare, 
  FileText, 
  Cpu, 
  Activity, 
  Database,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, documentsCount = 0, vectorStatus }) {
  const navItems = [
    { id: 'chat', label: 'AI Chat Workspace', icon: MessageSquare, badge: null },
    { id: 'documents', label: 'Document Library', icon: FileText, badge: documentsCount > 0 ? documentsCount : null },
    { id: 'tools', label: 'Intelligence Tools', icon: Cpu, badge: 'Agentic' },
    { id: 'health', label: 'Engine & Health', icon: Activity, badge: null }
  ];

  return (
    <aside className="w-64 bg-[#0d121f] border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0d121f] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse-subtle" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-lg tracking-tight text-white">Nexus<span className="text-indigo-400">RAG</span></h1>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">v1.0</span>
              </div>
              <p className="text-xs text-slate-400">Agentic Retrieval Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-indigo-500/30 text-indigo-200'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0a0e18]/80">
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" /> Vector Engine
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {vectorStatus?.backend === 'qdrant' ? 'Qdrant Active' : 'Memory Vector'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> Vectors
            </span>
            <span className="text-[11px] font-mono text-slate-300">
              {vectorStatus?.vectorCount ?? 0} vectors
            </span>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
          <span>Google Gemini + Qdrant RAG</span>
        </div>
      </div>
    </aside>
  );
}
