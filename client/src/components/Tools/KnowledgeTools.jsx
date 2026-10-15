import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  GitCompare, 
  Search, 
  FileText, 
  CheckSquare, 
  Square, 
  Loader2, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';

export default function KnowledgeTools({ documents = [], initialDocId }) {
  const [activeTool, setActiveTool] = useState('summarize');

  // Tool 1: Summarize State
  const [summarizeDocId, setSummarizeDocId] = useState(initialDocId || documents[0]?.id || '');
  const [summaryStyle, setSummaryStyle] = useState('detailed');
  const [summaryResult, setSummaryResult] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Tool 2: Compare State
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [compareTopic, setCompareTopic] = useState('Key methodology, findings, and core conclusions');
  const [compareResult, setCompareResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState(null);

  // Tool 3: Deep Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDocId, setSearchDocId] = useState('');
  const [searchTopK, setSearchTopK] = useState(6);
  const [searchThreshold, setSearchThreshold] = useState(0.25);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Execute Summarize
  const handleSummarize = async () => {
    if (!summarizeDocId) return;
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const data = await api.summarize(summarizeDocId, summaryStyle);
      setSummaryResult(data);
    } catch (err) {
      console.error('Summarize error:', err);
      setSummaryError(err.message || 'Failed to summarize document.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Toggle Compare doc
  const toggleCompareDoc = (id) => {
    setSelectedForCompare(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Execute Compare
  const handleCompare = async () => {
    if (selectedForCompare.length < 2) {
      setCompareError('Please select at least 2 documents to compare.');
      return;
    }
    setIsComparing(true);
    setCompareError(null);
    try {
      const data = await api.compare({
        documentIds: selectedForCompare,
        focusTopic: compareTopic
      });
      setCompareResult(data);
    } catch (err) {
      console.error('Compare error:', err);
      setCompareError(err.message || 'Failed to compare documents.');
    } finally {
      setIsComparing(false);
    }
  };

  // Execute Deep Search
  const handleDeepSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const data = await api.search({
        query: searchQuery,
        documentId: searchDocId || null,
        topK: parseInt(searchTopK, 10),
        scoreThreshold: parseFloat(searchThreshold)
      });
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setSearchError(err.message || 'Failed to perform semantic search.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#0a0e18]">
      
      {/* Tool Selector Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTool('summarize')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTool === 'summarize'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Document Summarizer</span>
        </button>

        <button
          onClick={() => setActiveTool('compare')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTool === 'compare'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Multi-Doc Comparator</span>
        </button>

        <button
          onClick={() => setActiveTool('search')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTool === 'search'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Semantic Search Explorer</span>
        </button>
      </div>

      {/* TOOL 1: SUMMARIZER */}
      {activeTool === 'summarize' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Automated Document Summarizer</h3>
              <p className="text-xs text-slate-400">Extracts and synthesizes core themes, key findings, and actionable takeaways.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Document</label>
                <select
                  value={summarizeDocId}
                  onChange={(e) => setSummarizeDocId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose a document --</option>
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>{d.filename} ({d.chunkCount} chunks)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Summary Format</label>
                <select
                  value={summaryStyle}
                  onChange={(e) => setSummaryStyle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="detailed">Executive Brief (Thorough Analysis)</option>
                  <option value="brief">High-Level Executive Summary</option>
                  <option value="bullets">Key Bullet Points & Metrics</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSummarize}
              disabled={!summarizeDocId || isSummarizing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Document Summary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Summary</span>
                </>
              )}
            </button>

            {summaryError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{summaryError}</span>
              </div>
            )}
          </div>

          {summaryResult && (
            <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{summaryResult.filename}</span>
                  <span className="text-[11px] text-slate-400">({summaryResult.chunkCount} chunks analyzed)</span>
                </div>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> {summaryResult.latencyMs}ms
                </span>
              </div>
              <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
                {summaryResult.summary}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 2: COMPARATOR */}
      {activeTool === 'compare' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Cross-Document Comparative Intelligence</h3>
              <p className="text-xs text-slate-400">Select two or more documents to contrast viewpoints, methodologies, or findings side-by-side.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Select Documents to Compare (Min 2):
              </label>
              {documents.length < 2 ? (
                <p className="text-xs text-amber-400">Upload at least two documents in the Document Library to use the comparator tool.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {documents.map(d => {
                    const isSelected = selectedForCompare.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        onClick={() => toggleCompareDoc(d.id)}
                        className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-center gap-2.5 text-xs ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate font-medium">{d.filename}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Comparison Focus / Query</label>
              <input
                type="text"
                value={compareTopic}
                onChange={(e) => setCompareTopic(e.target.value)}
                placeholder="e.g. Architecture differences, security considerations, or performance metrics"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleCompare}
              disabled={selectedForCompare.length < 2 || isComparing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Comparing Across Documents...</span>
                </>
              ) : (
                <>
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Execute Comparison</span>
                </>
              )}
            </button>

            {compareError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{compareError}</span>
              </div>
            )}
          </div>

          {compareResult && (
            <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">Comparison Result: "{compareResult.focusTopic}"</span>
                </div>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> {compareResult.latencyMs}ms
                </span>
              </div>
              <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
                {compareResult.comparison}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: DEEP SEMANTIC SEARCH */}
      {activeTool === 'search' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Direct Vector Search & Similarity Explorer</h3>
              <p className="text-xs text-slate-400">Test raw cosine similarity retrieval directly against the vector index without LLM synthesis.</p>
            </div>

            <form onSubmit={handleDeepSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Search Query</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter keywords or semantic concept..."
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || isSearching}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all shrink-0"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Search Index</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Filter Document</label>
                  <select
                    value={searchDocId}
                    onChange={(e) => setSearchDocId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Documents</option>
                    {documents.map(d => (
                      <option key={d.id} value={d.id}>{d.filename}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Top-K Results: <span className="font-mono text-indigo-400">{searchTopK}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={searchTopK}
                    onChange={(e) => setSearchTopK(e.target.value)}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Score Threshold: <span className="font-mono text-indigo-400">{searchThreshold}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={searchThreshold}
                    onChange={(e) => setSearchThreshold(e.target.value)}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            </form>

            {searchError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {searchResults && (
            <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="font-semibold text-white">
                  Found {searchResults.totalMatches} Matching Chunks
                </span>
                <span className="font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Latency: {searchResults.latencyMs}ms
                </span>
              </div>

              {searchResults.results.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No chunks matched the current threshold ({searchThreshold}). Try lowering the score threshold.
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.results.map((res, i) => (
                    <div key={res.id || i} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-semibold">
                            Rank #{i + 1}
                          </span>
                          <span className="font-semibold text-slate-200 text-xs">{res.filename}</span>
                          <span className="text-slate-400 text-xs">• p.{res.pageNumber}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-semibold">
                          Score: {Math.round(res.similarityScore * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-serif leading-relaxed italic bg-slate-950/60 p-3 rounded-lg border-l-2 border-indigo-500">
                        "{res.content}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
