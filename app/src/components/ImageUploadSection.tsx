"use client";
import React, { ChangeEvent } from "react";
import { Upload, Image, Activity, AlertCircle, Loader2, Maximize2 } from "lucide-react";

interface ImageUploadSectionProps {
  preview: string | null;
  selectedFile: File | null;
  loading: boolean;
  error: string | null;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onClassify: () => void;
  onReset: () => void;
  onExpandImage: (url: string) => void;
  hasResult: boolean;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  preview,
  selectedFile,
  loading,
  error,
  onFileSelect,
  onClassify,
  onReset,
  onExpandImage,
  hasResult,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow border border-white/20 p-8 hover:bg-white/15 transition-all duration-300">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
          <Upload className="w-5 h-5 text-white" />
        </div>
        Upload Image
      </h2>

      <div className="border-2 border-dashed border-green-400/30 rounded-2xl p-8 text-center hover:border-green-400/60 hover:bg-green-500/5 transition-all duration-300 backdrop-blur-sm">
        <input
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          {preview ? (
            <div className="space-y-4">
              <div
                className="relative group cursor-pointer"
                onClick={() => onExpandImage(preview)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="absolute top-2 right-2 z-20 bg-green-500/80 backdrop-blur-sm rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4 text-white" />
                </div>
                <img
                  src={preview}
                  alt={`Preview of ${selectedFile?.name || "uploaded image"}`}
                  className="max-h-64 mx-auto rounded-xl shadow relative z-10 border-2 border-white/20 transition-transform group-hover:scale-105"
                />
              </div>
              <p className="text-sm text-green-200 font-medium">
                {selectedFile?.name}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-md opacity-25"></div>
                <div className="relative bg-white/10 backdrop-blur-md rounded-full p-5 border border-white/20">
                  <Image
                    className="w-10 h-10 mx-auto text-green-300"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-white mb-1">
                  Click to upload image
                </p>
                <p className="text-sm text-green-200/70">
                  PNG, JPG, JPEG up to 10MB
                </p>
              </div>
            </div>
          )}
        </label>
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={onClassify}
          disabled={!selectedFile || loading}
          className="group relative w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-400 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow shadow-green-500/30 hover:shadow-md hover:shadow-green-500/40 hover:scale-[1.02] disabled:hover:scale-100 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin relative z-10" />
              <span className="relative z-10">Analyzing...</span>
            </>
          ) : (
            <>
              <Activity className="w-5 h-5 mr-2 relative z-10 group-hover:animate-pulse" />
              <span className="relative z-10">Classify Image</span>
            </>
          )}
        </button>

        {(preview || hasResult) && (
          <button
            onClick={onReset}
            className="w-full bg-white/10 backdrop-blur-md text-white py-3 rounded-xl font-medium hover:bg-white/20 border border-white/20 transition-all duration-300 hover:scale-[1.02]"
          >
            Upload New Image
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/20 backdrop-blur-md border border-red-400/50 rounded-xl flex items-start">
          <AlertCircle className="w-5 h-5 text-red-300 mr-2 shrink-0 mt-0.5" />
          <p className="text-red-100 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

