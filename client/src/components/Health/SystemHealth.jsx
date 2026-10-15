import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Server, 
  Key,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../../services/api';

export default function SystemHealth() {
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getHealth();
      setHealthData(data);
    } catch (err) {
      console.error('Health check error:', err);
      setError(err.message || 'Could not connect to NexusRAG backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const envSnippet = `# NexusRAG Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_CHAT_MODEL=gemini-1.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=nexusrag_documents
PORT=5000`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#0a0e18]">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Engine Architecture & Diagnostics</h3>
          <p className="text-xs text-slate-400">Live operational status of Gemini LLM, Qdrant Vector Engine, and backend pipelines.</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Vector Store Status */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Vector Store Engine</h4>
                  <p className="text-[11px] text-slate-400">Cosine Similarity Search Engine</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                healthData.services.vectorStore.isQdrantReady
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {healthData.services.vectorStore.backend === 'qdrant' ? 'Qdrant Cloud/Local' : 'In-Memory Engine'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Engine Type:</span>
                <span className="font-mono text-slate-200 capitalize">{healthData.services.vectorStore.backend}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Collection Name:</span>
                <span className="font-mono text-slate-200">{healthData.services.vectorStore.collectionName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Vector Dimensions:</span>
                <span className="font-mono text-slate-200">{healthData.services.vectorStore.dimensions} floats</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Total Vectors Stored:</span>
                <span className="font-mono font-semibold text-indigo-400">{healthData.services.vectorStore.vectorCount} vectors</span>
              </div>
            </div>
          </div>

          {/* Card 2: Gemini AI Service */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Google Gemini AI Engine</h4>
                  <p className="text-[11px] text-slate-400">Embedding & Grounded Generation</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                healthData.services.gemini.configured
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}>
                {healthData.services.gemini.configured ? 'API Key Active' : 'Offline Mode'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Generation Model:</span>
                <span className="font-mono text-indigo-300 font-semibold">{healthData.services.gemini.chatModel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Embedding Model:</span>
                <span className="font-mono text-indigo-300 font-semibold">{healthData.services.gemini.embeddingModel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">API Status:</span>
                <span className="text-slate-200">
                  {healthData.services.gemini.configured ? 'Configured & Ready' : 'API Key placeholder (Synthesis active)'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Hallucination Guardrail:</span>
                <span className="text-emerald-400 font-medium">Strict Grounding Enabled</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Configuration Quick Guide Box */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-white">Environment Configuration (.env)</h4>
          </div>
          <button
            onClick={copyEnv}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Template'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-indigo-200 border border-slate-800/80 overflow-x-auto leading-relaxed">
          {envSnippet}
        </pre>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 pt-2">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <h5 className="font-semibold text-slate-200">1. Google Gemini API</h5>
            <p>Generate a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Google AI Studio</a>. Set it as <code className="text-slate-300">GEMINI_API_KEY</code>.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <h5 className="font-semibold text-slate-200">2. Qdrant Vector Database</h5>
            <p>Use local docker container (<code className="text-slate-300">docker run -p 6333:6333 qdrant/qdrant</code>) or create a free cluster on <a href="https://cloud.qdrant.io" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Qdrant Cloud</a>.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
