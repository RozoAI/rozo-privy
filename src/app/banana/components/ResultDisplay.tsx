'use client';

import React from 'react';
import type { GeneratedContent } from '../types';
import { downloadImage } from '../utils/fileUtils';

interface ResultDisplayProps {
  content: GeneratedContent;
  onUseImageAsInput: (imageUrl: string) => void;
  onImageClick: (imageUrl: string) => void;
  originalImageUrl: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  content,
  onUseImageAsInput,
  onImageClick,
  originalImageUrl
}) => {
  const handleDownload = () => {
    if (!content.imageUrl) return;
    const fileExtension = content.imageUrl.split(';')[0].split('/')[1] || 'png';
    downloadImage(content.imageUrl, `generated-image-${Date.now()}.${fileExtension}`);
  };

  if (!content.imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <p>No image generated yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative group cursor-pointer" onClick={() => onImageClick(content.imageUrl!)}>
        <img
          src={content.imageUrl}
          alt="Generated result"
          className="w-full rounded-lg shadow-lg"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

      {content.text && (
        <div className="p-3 bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-300">{content.text}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download
        </button>
        <button
          onClick={() => onUseImageAsInput(content.imageUrl!)}
          className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Use as Input
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;