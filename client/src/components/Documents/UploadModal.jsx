import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setError(null);
    setSuccessInfo(null);
    const validExtensions = ['.pdf', '.docx', '.doc'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25 MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setError(null);

    try {
      const response = await api.uploadDocument(selectedFile);
      setSuccessInfo(response);
      onUploadSuccess(response.document);
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      console.error('Upload error:', err);
      if (err.status === 409) {
        setError(`This document is already indexed.`);
      } else {
        setError(err.message || 'Failed to process document.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError(null);
    setSuccessInfo(null);
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#27272a] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white text-lg">Upload Document</h2>
            <p className="text-sm text-[#a1a1aa] mt-0.5">PDF or Word documents (up to 25 MB)</p>
          </div>
          <button 
            onClick={handleClose}
            disabled={isUploading}
            className="text-[#71717a] hover:text-white p-1.5 rounded-lg hover:bg-[#27272a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#1c1214] border border-[#3f1d24] text-[#fca5a5] text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#f87171] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-3.5 rounded-xl bg-[#0e1f14] border border-[#1b3d27] text-[#86efac] text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />
              <span>Document indexed successfully! ({successInfo.chunkCount} chunks)</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragActive 
                ? 'border-white bg-[#18181b]' 
                : 'border-[#27272a] hover:border-[#3f3f46] bg-[#09090b]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white">
                <Upload className="w-5 h-5 text-[#a1a1aa]" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-white">
                  {selectedFile ? selectedFile.name : 'Choose a file or drag and drop'}
                </p>
                <p className="text-xs text-[#71717a] mt-1">
                  PDF and DOCX formats supported
                </p>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="w-4 h-4 text-[#a1a1aa] shrink-0" />
                <span className="font-medium text-white truncate">{selectedFile.name}</span>
                <span className="text-[#71717a] text-xs font-mono">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="text-[#71717a] hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isUploading && (
            <div className="p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] text-sm text-[#a1a1aa] space-y-2">
              <div className="flex items-center gap-2.5 text-white">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Extracting text and generating embeddings...</span>
              </div>
              <div className="w-full h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#09090b] border-t border-[#27272a] flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-white hover:bg-[#e4e4e7] disabled:opacity-40 text-black transition-colors flex items-center gap-2 shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Indexing...</span>
              </>
            ) : (
              <span>Upload Document</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
