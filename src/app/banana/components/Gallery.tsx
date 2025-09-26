"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { downloadImage } from "../utils/fileUtils";

interface GalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({
  isOpen,
  onClose,
  onSelectImage,
}) => {
  const [history, setHistory] = useState<string[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedHistory = localStorage.getItem("bananaHistory");
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to load history:", e);
        }
      }
    }
  }, [isOpen]);

  const handleClearHistory = () => {
    localStorage.removeItem("bananaHistory");
    setHistory([]);
  };

  const handleImageClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
  };

  const handleClosePreview = () => {
    setPreviewImageUrl(null);
  };

  const handleUseAsInput = (imageUrl: string) => {
    onSelectImage(imageUrl);
    setPreviewImageUrl(null);
    onClose();
  };

  const handleDownload = (imageUrl: string) => {
    const fileExtension = imageUrl.split(";")[0].split("/")[1] || "png";
    downloadImage(imageUrl, `gallery-image-${Date.now()}.${fileExtension}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-6xl flex flex-col">
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="text-xl font-semibold">Gallery</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {history.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((imageUrl, index) => (
                  <div
                    key={index}
                    onClick={() => handleImageClick(imageUrl)}
                    className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-800 aspect-square"
                  >
                    <img
                      src={imageUrl}
                      alt={`Gallery item ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-white"
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p>No images in gallery yet</p>
              <p className="text-sm mt-2">Generated images will appear here</p>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewImageUrl}
        onOpenChange={() => setPreviewImageUrl(null)}
      >
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-6">
          <div className="flex flex-col items-center gap-4">
            {previewImageUrl && (
              <>
                <Image
                  width={500}
                  height={500}
                  src={previewImageUrl}
                  alt="Preview"
                  className="max-w-full max-h-[70vh] rounded-lg border object-contain"
                />

                {/* Action buttons */}
                <div className="flex gap-3 w-full max-w-sm">
                  <Button
                    onClick={() => handleDownload(previewImageUrl)}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Download className="size-4" />
                    Download
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default Gallery;
