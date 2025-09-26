import { Sparkles } from "lucide-react";
import React from "react";

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Generating...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div> */}
        <Sparkles className="size-12 animate-pulse" />
      </div>
      {message && <p className="mt-4 text-gray-400 animate-pulse">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
