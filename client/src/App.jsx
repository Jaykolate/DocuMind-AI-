import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ChatWindow from './components/Chat/ChatWindow';
import DocumentLibrary from './components/Documents/DocumentLibrary';
import KnowledgeTools from './components/Tools/KnowledgeTools';
import SystemHealth from './components/Health/SystemHealth';
import UploadModal from './components/Documents/UploadModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [healthData, setHealthData] = useState(null);

  const loadData = async () => {
    try {
      const [docsRes, healthRes] = await Promise.allSettled([
        api.getDocuments(),
        api.getHealth()
      ]);

      if (docsRes.status === 'fulfilled') {
        setDocuments(docsRes.value.documents || []);
      }
      if (healthRes.status === 'fulfilled') {
        setHealthData(healthRes.value);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
    // Poll health/status occasionally
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDocumentSelectForChat = (docId) => {
    setSelectedDocId(docId);
    setActiveTab('chat');
  };

  const handleDocumentSelectForSummarize = (docId) => {
    setSelectedDocId(docId);
    setActiveTab('tools');
  };

  return (
    <div className="flex h-screen bg-[#0a0e18] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        documentsCount={documents.length}
        vectorStatus={healthData?.services?.vectorStore}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        <Navbar
          activeTab={activeTab}
          documents={documents}
          selectedDocId={selectedDocId}
          setSelectedDocId={setSelectedDocId}
          onOpenUpload={() => setIsUploadOpen(true)}
          health={healthData}
        />

        <main className="flex-1 flex min-h-0 overflow-hidden">
          {activeTab === 'chat' && (
            <ChatWindow
              documents={documents}
              selectedDocId={selectedDocId}
              setSelectedDocId={setSelectedDocId}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentLibrary
              documents={documents}
              onRefresh={loadData}
              onOpenUpload={() => setIsUploadOpen(true)}
              onSelectForChat={handleDocumentSelectForChat}
              onSelectForSummarize={handleDocumentSelectForSummarize}
            />
          )}

          {activeTab === 'tools' && (
            <KnowledgeTools
              documents={documents}
              initialDocId={selectedDocId}
            />
          )}

          {activeTab === 'health' && (
            <SystemHealth />
          )}
        </main>
      </div>

      {/* Upload Document Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(newDoc) => {
          loadData();
          if (newDoc?.id) setSelectedDocId(newDoc.id);
        }}
      />
    </div>
  );
}
