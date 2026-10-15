import React from 'react';
import { 
  MessageSquare, 
  FileText, 
  Terminal
} from 'lucide-react';
import Logo from './Logo';

export default function Sidebar({ activeTab, setActiveTab, documentsCount = 0 }) {
  const navItems = [
    { id: 'chat', label: 'Chat Workspace', icon: MessageSquare, badge: null },
    { id: 'documents', label: 'Document Library', icon: FileText, badge: documentsCount > 0 ? documentsCount : null },
    { id: 'tools', label: 'Intelligence Tools', icon: Terminal, badge: null }
  ];

  return (
    <aside className="w-60 bg-[#000000] border-r border-[#222222] flex flex-col justify-between shrink-0 h-screen select-none">
      <div>
        {/* Brand Header with New Custom Logo */}
        <div className="h-16 px-5 border-b border-[#222222] flex items-center">
          <div className="flex items-center gap-3">
            <Logo className="w-7 h-7" />
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm tracking-tight text-white">NexusRAG</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#111111] text-[#888888] border border-[#262626]">
                v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-mono font-medium tracking-wider text-[#666666] uppercase">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#171717] text-white border border-[#333333]'
                    : 'text-[#888888] hover:text-white hover:bg-[#0f0f0f]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#888888]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                      isActive
                        ? 'bg-[#262626] text-white'
                        : 'bg-[#141414] text-[#888888] border border-[#222222]'
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

      {/* Clean minimal footer */}
      <div className="p-4 border-t border-[#222222]">
        <div className="flex items-center justify-between text-[11px] text-[#666666] font-mono">
          <span>nexusrag</span>
          <span className="flex items-center gap-1.5 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            ready
          </span>
        </div>
      </div>
    </aside>
  );
}
