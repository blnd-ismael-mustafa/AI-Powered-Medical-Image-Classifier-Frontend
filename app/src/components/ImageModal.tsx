"use client";
import React from "react";
import { X } from "lucide-react";

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2 text-white transition-all duration-200 hover:scale-110 border border-white/20"
          aria-label="Close image"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={imageUrl}
          alt="Expanded image view"
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border-2 border-white/20"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

