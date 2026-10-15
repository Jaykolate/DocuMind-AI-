import React, { useState } from 'react';
import { 
  Sparkles, 
  GitCompare, 
  Search, 
  CheckSquare, 
  Square, 
  Loader2, 
  AlertCircle
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
  const [compareTopic, setCompareTopic] = useState('Key methodology, findings, and conclusions');
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
      setCompareError('Select at least 2 documents to compare.');
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
      setSearchError(err.message || 'Failed to search vector index.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#000000]">
      
      {/* Vercel Style Segmented Navigation Bar */}
      <div className="flex border-b border-[#222222] space-x-1">
        <button
          onClick={() => setActiveTool('summarize')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTool === 'summarize'
              ? 'border-white text-white'
              : 'border-transparent text-[#737373] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Summarizer</span>
        </button>

        <button
          onClick={() => setActiveTool('compare')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTool === 'compare'
              ? 'border-white text-white'
              : 'border-transparent text-[#737373] hover:text-white'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Comparator</span>
        </button>

        <button
          onClick={() => setActiveTool('search')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTool === 'search'
              ? 'border-white text-white'
              : 'border-transparent text-[#737373] hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Vector Explorer</span>
        </button>
      </div>

      {/* TOOL 1: SUMMARIZER */}
      {activeTool === 'summarize' && (
        <div className="space-y-4">
          <div className="p-5 rounded-lg bg-[#0a0a0a] border border-[#222222] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Document Summarizer</h3>
              <p className="text-[11px] text-[#737373]">Extracts and synthesizes core themes, key findings, and takeaways.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#737373] mb-1.5">DOCUMENT</label>
                <select
                  value={summarizeDocId}
                  onChange={(e) => setSummarizeDocId(e.target.value)}
                  className="w-full bg-[#000000] border border-[#262626] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#555555]"
                >
                  <option value="">-- Choose document --</option>
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>{d.filename}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#737373] mb-1.5">STYLE</label>
                <select
                  value={summaryStyle}
                  onChange={(e) => setSummaryStyle(e.target.value)}
                  className="w-full bg-[#000000] border border-[#262626] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#555555]"
                >
                  <option value="detailed">Executive Brief (Detailed)</option>
                  <option value="brief">High-Level Summary</option>
                  <option value="bullets">Bullet Points & Highlights</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSummarize}
              disabled={!summarizeDocId || isSummarizing}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-white hover:bg-[#e5e5e5] disabled:opacity-40 text-black text-xs font-medium transition-colors"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <span>Generate Summary</span>
              )}
            </button>

            {summaryError && (
              <div className="p-3 rounded-md bg-[#141414] border border-[#333333] text-white text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#888888] shrink-0" />
                <span>{summaryError}</span>
              </div>
            )}
          </div>

          {summaryResult && (
            <div className="p-5 rounded-lg bg-[#0a0a0a] border border-[#222222] space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#222222] text-xs">
                <span className="font-medium text-white">{summaryResult.filename}</span>
                <span className="font-mono text-[#737373] text-[11px]">{summaryResult.latencyMs}ms</span>
              </div>
              <div className="text-xs leading-relaxed text-[#cccccc] whitespace-pre-wrap font-sans">
                {summaryResult.summary}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 2: COMPARATOR */}
      {activeTool === 'compare' && (
        <div className="space-y-4">
          <div className="p-5 rounded-lg bg-[#0a0a0a] border border-[#222222] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Cross-Document Comparator</h3>
              <p className="text-[11px] text-[#737373]">Compare methodologies, findings, or metrics across two or more documents.</p>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#737373] mb-2">
                SELECT DOCUMENTS (MIN 2):
              </label>
              {documents.length < 2 ? (
                <p className="text-xs text-[#888888] font-mono">Upload at least two documents in Document Library to use the comparator.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {documents.map(d => {
                    const isSelected = selectedForCompare.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        onClick={() => toggleCompareDoc(d.id)}
                        className={`p-2.5 rounded-md border cursor-pointer select-none transition-colors flex items-center gap-2 text-xs ${
                          isSelected
                            ? 'bg-[#171717] border-white text-white'
                            : 'bg-[#000000] border-[#262626] text-[#888888] hover:border-[#404040]'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-white shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-[#555555] shrink-0" />
                        )}
                        <span className="truncate">{d.filename}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#737373] mb-1.5">FOCUS TOPIC</label>
              <input
                type="text"
                value={compareTopic}
                onChange={(e) => setCompareTopic(e.target.value)}
                placeholder="e.g. Core architectural differences, metrics, or limitations"
                className="w-full bg-[#000000] border border-[#262626] rounded-md px-3 py-2 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#555555]"
              />
            </div>

            <button
              onClick={handleCompare}
              disabled={selectedForCompare.length < 2 || isComparing}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-white hover:bg-[#e5e5e5] disabled:opacity-40 text-black text-xs font-medium transition-colors"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Comparing...</span>
                </>
              ) : (
                <span>Execute Comparison</span>
              )}
            </button>

            {compareError && (
              <div className="p-3 rounded-md bg-[#141414] border border-[#333333] text-white text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#888888] shrink-0" />
                <span>{compareError}</span>
              </div>
            )}
          </div>

          {compareResult && (
            <div className="p-5 rounded-lg bg-[#0a0a0a] border border-[#222222] space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#222222] text-xs">
                <span className="font-medium text-white">Focus: "{compareResult.focusTopic}"</span>
                <span className="font-mono text-[#737373] text-[11px]">{compareResult.latencyMs}ms</span>
              </div>
              <div className="text-xs leading-relaxed text-[#cccccc] whitespace-pre-wrap font-sans">
                {compareResult.comparison}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: DEEP SEMANTIC SEARCH */}
      {activeTool === 'search' && (
        <div className="space-y-4">
          <div className="p-5 rounded-lg bg-[#0a0a0a] border border-[#222222] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Vector Search Explorer</h3>
              <p className="text-[11px] text-[#737373]">Query raw cosine similarity vectors directly against the indexed chunks.</p>
            </div>

            <form onSubmit={handleDeepSearch} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#737373] mb-1.5">QUERY</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter keywords or semantic concept..."
                    className="flex-1 bg-[#000000] border border-[#262626] rounded-md px-3 py-2 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#555555]"
                  />
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || isSearching}
                    className="px-4 py-2 rounded-md bg-white hover:bg-[#e5e5e5] disabled:opacity-40 text-black text-xs font-medium transition-colors shrink-0"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Search</span>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono text-[#737373] mb-1">DOCUMENT FILTER</label>
                  <select
                    value={searchDocId}
                    onChange={(e) => setSearchDocId(e.target.value)}
                    className="w-full bg-[#000000] border border-[#262626] rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">All Documents</option>
                    {documents.map(d => (
                      <option key={d.id} value={d.id}>{d.filename}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#737373] mb-1">
                    TOP-K: <span className="text-white font-mono">{searchTopK}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={searchTopK}
                    onChange={(e) => setSearchTopK(e.target.value)}
                    className="w-full accent-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#737373] mb-1">
                    THRESHOLD: <span className="text-white font-mono">{searchThreshold}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={searchThreshold}
                    onChange={(e) => setSearchThreshold(e.target.value)}
                    className="w-full accent-white"
                  />
                </div>
              </div>
            </form>

            {searchError && (
              <div className="p-3 rounded-md bg-[#141414] border border-[#333333] text-white text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#888888] shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {searchResults && (
            <div className="p-5 rounded-lg bg-[#0a0a0a] border border-[#222222] space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#222222] text-xs">
                <span className="font-medium text-white">
                  Matches: {searchResults.totalMatches}
                </span>
                <span className="font-mono text-[#737373] text-[11px]">{searchResults.latencyMs}ms</span>
              </div>

              {searchResults.results.length === 0 ? (
                <div className="text-center py-6 text-[#737373] text-xs font-mono">
                  No chunks met the similarity threshold ({searchThreshold}).
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.results.map((res, i) => (
                    <div key={res.id || i} className="p-3 rounded-md bg-[#000000] border border-[#222222] hover:border-[#383838] transition-colors">
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-[#171717] text-white font-mono text-[10px] border border-[#333333]">
                            #{i + 1}
                          </span>
                          <span className="font-medium text-white">{res.filename}</span>
                          <span className="text-[#737373] font-mono text-[11px]">p.{res.pageNumber}</span>
                        </div>
                        <span className="font-mono text-[10px] text-white px-1.5 py-0.2 rounded bg-[#171717] border border-[#262626]">
                          {Math.round(res.similarityScore * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-[#cccccc] font-mono leading-relaxed bg-[#0a0a0a] p-2 rounded border border-[#1f1f1f]">
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
