"use client";

import React, { useState } from "react";
import type { Transformation } from "../types";

interface TransformationSelectorProps {
  transformations: Transformation[];
  onSelect: (transformation: Transformation) => void;
  hasPreviousResult: boolean;
  onOrderChange: (transformations: Transformation[]) => void;
}

const TransformationSelector: React.FC<TransformationSelectorProps> = ({
  transformations,
  onSelect,
  hasPreviousResult,
  onOrderChange,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedOverIndex(index);
  };

  const handleDragEnd = () => {
    if (
      draggedIndex !== null &&
      draggedOverIndex !== null &&
      draggedIndex !== draggedOverIndex
    ) {
      const newTransformations = [...transformations];
      const [removed] = newTransformations.splice(draggedIndex, 1);
      newTransformations.splice(draggedOverIndex, 0, removed);
      onOrderChange(newTransformations);
    }
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 ">
          {hasPreviousResult
            ? "Transform Your Image Further"
            : "Choose Your Transformation"}
        </h2>
        <p className="text-gray-400">Select an effect to apply to your image</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 max-w-7xl mx-auto">
        {transformations.map((transformation, index) => (
          <div
            key={transformation.id}
            onClick={() => onSelect(transformation)}
            className="group relative backdrop-blur-lg rounded-xl hover:shadow-lg hover:shadow-orange-500/10 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
          >
            {/* Image preview */}
            {transformation.image ? (
              <div className="relative w-full aspect-[3/4] bg-gray-900">
                <img
                  src={transformation.image}
                  alt={transformation.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-2xl mb-2">{transformation.emoji}</div>
                  <h3 className="font-semibold text-white text-base md:text-lg">
                    {transformation.title}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 md:p-8 aspect-[3/4] bg-foreground">
                <div className="text-5xl md:text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {transformation.emoji}
                </div>
                <h3 className="font-semibold text-gray-200 transition-colors text-lg md:text-xl text-center">
                  {transformation.title}
                </h3>
                <p className="text-xs text-muted mt-3 text-center px-2">
                  {transformation.description.split(".")[0]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 md:mt-8 text-center text-xs text-gray-600 px-4">
        💡 Tip: Select an effect to start transforming your images
      </div>
    </div>
  );
};

export default TransformationSelector;
