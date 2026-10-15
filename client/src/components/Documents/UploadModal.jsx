import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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

  const validateAndSetFile = (file) => {
    setError(null);
    setSuccessInfo(null);

    const validExtensions = ['.pdf', '.docx', '.doc'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExt) {
      setError('Invalid file type. Please upload a PDF (.pdf) or Word document (.docx).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25 MB limit.');
      return;
    }

    setSelectedFile(file);
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
      }, 1500);
    } catch (err) {
      console.error('Upload error:', err);
      if (err.status === 409) {
        setError(`Document already exists in your library. (${err.message})`);
      } else {
        setError(err.message || 'Failed to parse and index document.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm">Upload Document</h3>
            <p className="text-[11px] text-[#737373]">PDF & DOCX files will be indexed into 768-dim vector chunks</p>
          </div>
          <button 
            onClick={handleClose}
            disabled={isUploading}
            className="text-[#737373] hover:text-white p-1 rounded hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-[#141414] border border-[#333333] text-white text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#888888] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-3 rounded-md bg-[#141414] border border-[#333333] text-white text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>Indexed {successInfo.chunkCount} chunks into vector store!</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive 
                ? 'border-white bg-[#141414]' 
                : 'border-[#333333] hover:border-[#555555] bg-[#000000]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-center text-white">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-white">
                  {selectedFile ? selectedFile.name : 'Select a document or drag and drop'}
                </p>
                <p className="text-[11px] text-[#737373] mt-0.5">
                  PDF, DOCX up to 25 MB
                </p>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="p-3 rounded-md bg-[#000000] border border-[#222222] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-[#737373] shrink-0" />
                <span className="font-medium text-white truncate">{selectedFile.name}</span>
                <span className="text-[#737373] font-mono">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="text-[#737373] hover:text-white ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isUploading && (
            <div className="p-3 rounded-md bg-[#000000] border border-[#262626] text-xs text-[#888888] space-y-2">
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Extracting text & generating embeddings...</span>
              </div>
              <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#000000] border-t border-[#222222] flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[#888888] hover:text-white hover:bg-[#141414] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-[#e5e5e5] disabled:opacity-40 text-black transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Indexing...</span>
              </>
            ) : (
              <span>Upload & Index</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
