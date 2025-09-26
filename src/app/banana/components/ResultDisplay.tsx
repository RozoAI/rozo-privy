"use client";

import { Button } from "@/components/ui/button";
import { Download, RefreshCcw } from "lucide-react";
import React, { useEffect } from "react";
import { clearStellarToken } from "../services/stellarService";
import type { GeneratedContent } from "../types";
import { downloadImage } from "../utils/fileUtils";

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
  originalImageUrl,
}) => {
  const handleDownload = () => {
    if (!content.imageUrl) return;
    const fileExtension = content.imageUrl.split(";")[0].split("/")[1] || "png";
    downloadImage(
      content.imageUrl,
      `generated-image-${Date.now()}.${fileExtension}`
    );
  };

  useEffect(() => {
    if (content.imageUrl) {
      clearStellarToken();
    }
  }, [content]);

  if (!content.imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <p>No image generated yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative group cursor-pointer"
        onClick={() => onImageClick(content.imageUrl!)}
      >
        <img
          src={content.imageUrl}
          alt="Generated result"
          className="w-full rounded-lg shadow-lg"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </div>
      </div>

      {content.text && (
        <div className="p-3 bg-foreground rounded-lg">
          <p className="text-sm text-gray-300">{content.text}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleDownload} className="flex-1">
          <Download className="size-4" />
          Download
        </Button>
        <Button
          onClick={() => onUseImageAsInput(content.imageUrl!)}
          variant="outline"
          className="flex-1"
        >
          <RefreshCcw className="size-4" />
          Use as Input
        </Button>
      </div>
    </div>
  );
};

export default ResultDisplay;
