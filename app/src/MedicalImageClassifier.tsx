"use client";
import React, { useState, ChangeEvent } from "react";
import {
  Upload,
  Image,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface Prediction {
  class: string;
  confidence: number;
}

interface ClassificationResult {
  prediction: string;
  confidence: number;
  all_predictions: Prediction[];
}

const MedicalImageClassifier: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setError(null);
      setResult(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please select a valid image file");
    }
  };

  const classifyImage = async (): Promise<void> => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("http://localhost:5000/api/classify", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Classification failed");
      }

      const data: ClassificationResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        "Failed to classify image. Make sure the backend server is running."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = (): void => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Activity className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">
              AI Skin Cancer Classifier
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Upload dermoscopic images for AI-powered skin lesion classification.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supports: Skin Lesion Analysis melanoma, benign{" "}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                <Upload className="w-6 h-6 mr-2 text-blue-600" />
                Upload Image
              </h2>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {preview ? (
                    <div className="space-y-4">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <p className="text-sm text-gray-600">
                        {selectedFile?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Image className="w-16 h-16 mx-auto text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          Click to upload image
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, JPEG up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={classifyImage}
                  disabled={!selectedFile || loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5 mr-2" />
                      Classify Image
                    </>
                  )}
                </button>

                {(preview || result) && (
                  <button
                    onClick={reset}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Upload New Image
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                <Activity className="w-6 h-6 mr-2 text-purple-600" />
                Analysis Results
              </h2>

              {!result && !loading && (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Results will appear here after classification</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                    <p className="text-gray-600">
                      Analyzing image with AI model...
                    </p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        Primary Diagnosis
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {result.prediction}
                    </p>
                    <p className="text-sm text-gray-600">
                      Confidence: {(result.confidence * 100).toFixed(2)}%
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      All Predictions
                    </h3>
                    <div className="space-y-3">
                      {result.all_predictions.map((pred, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-800">
                              {pred.class}
                            </span>
                            <span className="text-sm font-semibold text-blue-600">
                              {(pred.confidence * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pred.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Disclaimer:</strong> This is an AI-assisted tool
                      for educational purposes only. Always consult healthcare
                      professionals for medical diagnosis and treatment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              How to Use
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">
                    Upload Image
                  </h3>
                  <p className="text-sm text-gray-600">Select a skin image</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Classify</h3>
                  <p className="text-sm text-gray-600">
                    Click the classify button to analyze with AI
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">
                    View Results
                  </h3>
                  <p className="text-sm text-gray-600">
                    Review AI-based skin cancer detection scores
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalImageClassifier;
