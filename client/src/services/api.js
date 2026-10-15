const API_BASE = '/api';

/**
 * Common fetch helper with JSON parsing and standardized error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' })
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Document Operations
  getDocuments: () => request('/documents'),
  getDocumentById: (id) => request(`/documents/${id}`),
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/documents/upload', {
      method: 'POST',
      body: formData
    });
  },

  // RAG Chat
  chat: ({ question, documentId, conversationHistory, topK, scoreThreshold }) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({
        question,
        documentId: documentId || null,
        conversationHistory: conversationHistory || [],
        topK,
        scoreThreshold
      })
    }),

  // AI Knowledge Tools
  summarize: (documentId, style = 'detailed') =>
    request(`/documents/${documentId}/summarize`, {
      method: 'POST',
      body: JSON.stringify({ style })
    }),

  compare: ({ documentIds, focusTopic }) =>
    request('/documents/compare', {
      method: 'POST',
      body: JSON.stringify({ documentIds, focusTopic })
    }),

  search: ({ query, documentId, topK = 6, scoreThreshold = 0.25 }) =>
    request('/documents/search', {
      method: 'POST',
      body: JSON.stringify({ query, documentId, topK, scoreThreshold })
    }),

  // System Health
  getHealth: () => request('/health')
};
