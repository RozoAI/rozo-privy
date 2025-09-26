"use client";

import React, { useCallback, useState } from "react";

interface MultiImageUploaderProps {
  onPrimarySelect: (file: File, dataUrl: string) => void;
  onSecondarySelect: (file: File, dataUrl: string) => void;
  primaryImageUrl: string | null;
  secondaryImageUrl: string | null;
  onClearPrimary: () => void;
  onClearSecondary: () => void;
  primaryTitle?: string;
  primaryDescription?: string;
  secondaryTitle?: string;
  secondaryDescription?: string;
}

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  onPrimarySelect,
  onSecondarySelect,
  primaryImageUrl,
  secondaryImageUrl,
  onClearPrimary,
  onClearSecondary,
  primaryTitle = "Primary Image",
  primaryDescription = "Upload the main image",
  secondaryTitle = "Secondary Image",
  secondaryDescription = "Upload the second image",
}) => {
  const [primaryDragging, setPrimaryDragging] = useState(false);
  const [secondaryDragging, setSecondaryDragging] = useState(false);

  const handleFile = useCallback(
    (file: File, callback: (file: File, dataUrl: string) => void) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        callback(file, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0], onPrimarySelect);
  };

  const handleSecondaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0], onSecondarySelect);
  };

  const handlePrimaryDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setPrimaryDragging(false);
      if (e.dataTransfer.files?.[0])
        handleFile(e.dataTransfer.files[0], onPrimarySelect);
    },
    [handleFile, onPrimarySelect]
  );

  const handleSecondaryDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setSecondaryDragging(false);
      if (e.dataTransfer.files?.[0])
        handleFile(e.dataTransfer.files[0], onSecondarySelect);
    },
    [handleFile, onSecondarySelect]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-primary">{primaryTitle}</div>
        <p className="text-xs text-gray-500">{primaryDescription}</p>
        <div
          onDrop={handlePrimaryDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setPrimaryDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setPrimaryDragging(false);
          }}
          className={`relative aspect-square bg-background rounded-lg flex items-center justify-center transition-colors duration-200 ${
            primaryDragging
              ? "outline-dashed outline-2 outline-orange-500 bg-orange-500/10"
              : ""
          } ${
            primaryImageUrl
              ? "p-0"
              : "p-4 border-2 border-dashed border-white/20"
          }`}
        >
          {!primaryImageUrl ? (
            <label
              htmlFor="primary-upload"
              className="flex flex-col items-center justify-center text-gray-500 cursor-pointer w-full h-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs">Click or drag to upload</p>
              <input
                id="primary-upload"
                type="file"
                className="hidden"
                onChange={handlePrimaryChange}
                accept="image/*"
              />
            </label>
          ) : (
            <>
              <img
                src={primaryImageUrl}
                alt="Primary"
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={onClearPrimary}
                className="absolute top-2 right-2 p-1 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-red-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-primary">
          {secondaryTitle}
        </div>
        <p className="text-xs text-gray-500">{secondaryDescription}</p>
        <div
          onDrop={handleSecondaryDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setSecondaryDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setSecondaryDragging(false);
          }}
          className={`relative aspect-square bg-background rounded-lg flex items-center justify-center transition-colors duration-200 ${
            secondaryDragging
              ? "outline-dashed outline-2 outline-orange-500 bg-orange-500/10"
              : ""
          } ${
            secondaryImageUrl
              ? "p-0"
              : "p-4 border-2 border-dashed border-white/20"
          }`}
        >
          {!secondaryImageUrl ? (
            <label
              htmlFor="secondary-upload"
              className="flex flex-col items-center justify-center text-gray-500 cursor-pointer w-full h-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs">Click or drag to upload</p>
              <input
                id="secondary-upload"
                type="file"
                className="hidden"
                onChange={handleSecondaryChange}
                accept="image/*"
              />
            </label>
          ) : (
            <>
              <img
                src={secondaryImageUrl}
                alt="Secondary"
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={onClearSecondary}
                className="absolute top-2 right-2 p-1 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-red-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiImageUploader;
