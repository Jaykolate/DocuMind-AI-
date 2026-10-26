import React from 'react';
import { 
  MessageSquare, 
  FileText, 
  Wrench
} from 'lucide-react';
import Logo from './Logo';

export default function Sidebar({ activeTab, setActiveTab, documentsCount = 0 }) {
  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'documents', label: 'Documents', icon: FileText, count: documentsCount },
    { id: 'tools', label: 'Tools', icon: Wrench }
  ];

  return (
    <aside className="w-56 bg-[#09090b] border-r border-[#27272a] flex flex-col justify-between shrink-0 h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#27272a] flex items-center">
          <div className="flex items-center gap-3">
            <Logo className="w-7 h-7" />
            <span className="font-semibold text-lg text-white tracking-tight">NexusRAG</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[15px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[#18181b] text-white'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-[#121215]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#71717a]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#27272a] text-[#a1a1aa]">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Clean footer */}
      <div className="p-4 border-t border-[#27272a] text-xs text-[#71717a]">
        <span>DocuMind AI</span>
      </div>
    </aside>
  );
}
