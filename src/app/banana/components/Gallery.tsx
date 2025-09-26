'use client';

import React, { useEffect, useState } from 'react';

interface GalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ isOpen, onClose, onSelectImage }) => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const savedHistory = localStorage.getItem('bananaHistory');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to load history:', e);
        }
      }
    }
  }, [isOpen]);

  const handleClearHistory = () => {
    localStorage.removeItem('bananaHistory');
    setHistory([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-fast">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-orange-500">Gallery</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {history.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((imageUrl, index) => (
                  <div
                    key={index}
                    onClick={() => onSelectImage(imageUrl)}
                    className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-800 aspect-square"
                  >
                    <img
                      src={imageUrl}
                      alt={`Gallery item ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Use This</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleClearHistory}
                className="mt-6 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-md transition-colors"
              >
                Clear History
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No images in gallery yet</p>
              <p className="text-sm mt-2">Generated images will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gallery;