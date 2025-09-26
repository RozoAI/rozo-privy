'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { TRANSFORMATIONS } from './constants';
import { editImage } from './services/geminiService';
import { getStellarToken, isUsingStellar } from './services/stellarService';
import { dataUrlToFile, embedWatermark, loadImage, resizeImageToMatch } from './utils/fileUtils';
import type { GeneratedContent, Transformation, ActiveTool } from './types';

import TransformationSelector from './components/TransformationSelector';
import ResultDisplay from './components/ResultDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import PaymentErrorMessage from './components/PaymentErrorMessage';
import ImageEditorCanvas from './components/ImageEditorCanvas';
import ImagePreviewModal from './components/ImagePreviewModal';
import MultiImageUploader from './components/MultiImageUploader';
import Gallery from './components/Gallery';

export default function BananaPage() {
  // Check for stellar parameter in URL
  const [stellarToken, setStellarToken] = useState<string | null>(getStellarToken());
  const isStellarMode = isUsingStellar();

  useEffect(() => {
    // Update stellar token if URL changes
    const token = getStellarToken();
    setStellarToken(token);
  }, []);

  const [transformations, setTransformations] = useState<Transformation[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedOrder = localStorage.getItem('transformationOrder');
        if (savedOrder) {
          const orderedIds = JSON.parse(savedOrder) as string[];
          const transformationMap = new Map(TRANSFORMATIONS.map(t => [t.id, t]));

          const orderedTransformations = orderedIds
            .map(id => transformationMap.get(id))
            .filter((t): t is Transformation => !!t);

          const savedIdsSet = new Set(orderedIds);
          const newTransformations = TRANSFORMATIONS.filter(t => !savedIdsSet.has(t.id));

          return [...orderedTransformations, ...newTransformations];
        }
      } catch (e) {
        console.error("Failed to load transformation order:", e);
      }
    }
    return TRANSFORMATIONS;
  });

  const [selectedTransformation, setSelectedTransformation] = useState<Transformation | null>(null);
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [secondaryImageUrl, setSecondaryImageUrl] = useState<string | null>(null);
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const orderToSave = transformations.map(t => t.id);
        localStorage.setItem('transformationOrder', JSON.stringify(orderToSave));
      } catch (e) {
        console.error("Failed to save transformation order:", e);
      }
    }
  }, [transformations]);

  // Save generated images to history
  useEffect(() => {
    if (typeof window !== 'undefined' && generatedContent?.imageUrl) {
      try {
        const history = JSON.parse(localStorage.getItem('bananaHistory') || '[]');
        history.unshift(generatedContent.imageUrl);
        // Keep only last 20 images
        const trimmedHistory = history.slice(0, 20);
        localStorage.setItem('bananaHistory', JSON.stringify(trimmedHistory));
      } catch (e) {
        console.error('Failed to save to history:', e);
      }
    }
  }, [generatedContent]);

  const handleSelectTransformation = (transformation: Transformation) => {
    setSelectedTransformation(transformation);
    setGeneratedContent(null);
    setError(null);
    if (transformation.prompt !== 'CUSTOM') {
      setCustomPrompt('');
    }
  };

  const handlePrimaryImageSelect = useCallback((file: File, dataUrl: string) => {
    setPrimaryFile(file);
    setPrimaryImageUrl(dataUrl);
    setGeneratedContent(null);
    setError(null);
    setMaskDataUrl(null);
    setActiveTool('none');
  }, []);

  const handleSecondaryImageSelect = useCallback((file: File, dataUrl: string) => {
    setSecondaryFile(file);
    setSecondaryImageUrl(dataUrl);
    setGeneratedContent(null);
    setError(null);
  }, []);

  const handleClearPrimaryImage = () => {
    setPrimaryImageUrl(null);
    setPrimaryFile(null);
    setGeneratedContent(null);
    setError(null);
    setMaskDataUrl(null);
    setActiveTool('none');
  };

  const handleClearSecondaryImage = () => {
    setSecondaryImageUrl(null);
    setSecondaryFile(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!primaryImageUrl || !selectedTransformation) {
        setError("Please upload an image and select an effect.");
        return;
    }
    if (selectedTransformation.isMultiImage && !secondaryImageUrl) {
        setError("Please upload both required images.");
        return;
    }

    const promptToUse = selectedTransformation.prompt === 'CUSTOM' ? customPrompt : selectedTransformation.prompt;
    if (!promptToUse.trim()) {
        setError("Please enter a prompt describing the change you want to see.");
        return;
    }

    // Check for stellar token
    if (!isStellarMode) {
      setError("Please provide a stellar token in the URL (?stellar=your-token).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setLoadingMessage('');

    try {
        const primaryMimeType = primaryImageUrl!.split(';')[0].split(':')[1] ?? 'image/png';
        const primaryBase64 = primaryImageUrl!.split(',')[1];
        const maskBase64 = maskDataUrl ? maskDataUrl.split(',')[1] : null;

        if (selectedTransformation.isTwoStep) {
            // Step 1: Generate line art (using only the primary image)
            setLoadingMessage('Step 1: Creating line art...');
            const stepOneResult = await editImage(
                primaryBase64,
                primaryMimeType,
                promptToUse,
                null,
                null
            );

            if (!stepOneResult.imageUrl) {
                throw new Error("Step 1 (line art) failed to generate an image.");
            }

            // Step 2: Color the line art using the palette
            setLoadingMessage('Step 2: Applying color palette...');
            const stepOneImageBase64 = stepOneResult.imageUrl.split(',')[1];
            const stepOneImageMimeType = stepOneResult.imageUrl.split(';')[0].split(':')[1] ?? 'image/png';

            let secondaryImagePayload = null;
            if (selectedTransformation.isMultiImage && secondaryImageUrl && primaryImageUrl) {
                const primaryImage = await loadImage(primaryImageUrl);
                const resizedSecondaryImageUrl = await resizeImageToMatch(secondaryImageUrl, primaryImage);

                const secondaryMimeType = resizedSecondaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png';
                const secondaryBase64 = resizedSecondaryImageUrl.split(',')[1];
                secondaryImagePayload = { base64: secondaryBase64, mimeType: secondaryMimeType };
            }

            const stepTwoResult = await editImage(
                stepOneImageBase64,
                stepOneImageMimeType,
                selectedTransformation.stepTwoPrompt!,
                null,
                secondaryImagePayload
            );

            if (stepTwoResult.imageUrl) {
                stepTwoResult.imageUrl = await embedWatermark(stepTwoResult.imageUrl, "ROZO Bananary");
            }

            const finalResult = {
                imageUrl: stepTwoResult.imageUrl,
                text: stepTwoResult.text,
                secondaryImageUrl: stepOneResult.imageUrl,
            };
            setGeneratedContent(finalResult);

        } else {
             let secondaryImagePayload = null;
            if (selectedTransformation.isMultiImage && secondaryImageUrl) {
                const secondaryMimeType = secondaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png';
                const secondaryBase64 = secondaryImageUrl.split(',')[1];
                secondaryImagePayload = { base64: secondaryBase64, mimeType: secondaryMimeType };
            }
            setLoadingMessage('Generating your masterpiece...');
            const result = await editImage(
                primaryBase64,
                primaryMimeType,
                promptToUse,
                maskBase64,
                secondaryImagePayload
            );

            if (result.imageUrl) {
                result.imageUrl = await embedWatermark(result.imageUrl, "ROZO Bananary");
            }

            setGeneratedContent(result);
        }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [primaryImageUrl, secondaryImageUrl, selectedTransformation, maskDataUrl, customPrompt, isStellarMode]);

  const handleUseImageAsInput = useCallback(async (imageUrl: string) => {
    if (!imageUrl) return;

    try {
      const newFile = await dataUrlToFile(imageUrl, `edited-${Date.now()}.png`);
      setPrimaryFile(newFile);
      setPrimaryImageUrl(imageUrl);
      setGeneratedContent(null);
      setError(null);
      setMaskDataUrl(null);
      setActiveTool('none');
      setSecondaryFile(null);
      setSecondaryImageUrl(null);
      setSelectedTransformation(null);
    } catch (err) {
      console.error("Failed to use image as input:", err);
      setError("Could not use the generated image as a new input.");
    }
  }, []);

  const toggleGallery = () => setIsGalleryOpen(prev => !prev);

  const handleSelectGalleryImage = (imageUrl: string) => {
      handleUseImageAsInput(imageUrl);
      setIsGalleryOpen(false);
  };

  const handleBackToSelection = () => {
    setSelectedTransformation(null);
  };

  const handleResetApp = () => {
    setSelectedTransformation(null);
    setPrimaryImageUrl(null);
    setPrimaryFile(null);
    setSecondaryImageUrl(null);
    setSecondaryFile(null);
    setGeneratedContent(null);
    setError(null);
    setIsLoading(false);
    setMaskDataUrl(null);
    setCustomPrompt('');
    setActiveTool('none');
  };

  const handleOpenPreview = (url: string) => setPreviewImageUrl(url);
  const handleClosePreview = () => setPreviewImageUrl(null);

  const toggleMaskTool = () => {
    setActiveTool(current => (current === 'mask' ? 'none' : 'mask'));
  };

  const isCustomPromptEmpty = selectedTransformation?.prompt === 'CUSTOM' && !customPrompt.trim();
  const isSingleImageReady = !selectedTransformation?.isMultiImage && primaryImageUrl;
  const isMultiImageReady = selectedTransformation?.isMultiImage && primaryImageUrl && secondaryImageUrl;
  const isGenerateDisabled = isLoading || isCustomPromptEmpty || (!isSingleImageReady && !isMultiImageReady) || !isStellarMode;

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans">
      <header className="bg-black/60 backdrop-blur-lg sticky top-0 z-20 p-3 md:p-4 border-b border-white/10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400 cursor-pointer" onClick={handleResetApp}>
            🍌 <span className="hidden sm:inline">ROZO</span> Bananary
          </h1>
          <button
            onClick={toggleGallery}
            className="flex items-center gap-2 py-2 px-3 text-sm font-semibold text-gray-200 bg-gray-800/50 rounded-md hover:bg-gray-700/50 transition-colors duration-200"
            aria-label="Open gallery"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span>Gallery</span>
          </button>
        </div>
      </header>

      <main>
        {!selectedTransformation ? (
          <TransformationSelector
            transformations={transformations}
            onSelect={handleSelectTransformation}
            hasPreviousResult={!!primaryImageUrl}
            onOrderChange={setTransformations}
          />
        ) : (
          <div className="container mx-auto p-4 md:p-8 animate-fade-in">
            <div className="mb-8">
              <button
                onClick={handleBackToSelection}
                className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-gray-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Choose Another Effect
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
              {/* Input Column */}
              <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 bg-gray-950/60 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl shadow-black/20">
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold mb-1 text-orange-500 flex items-center gap-3">
                      <span className="text-3xl">{selectedTransformation.emoji}</span>
                      {selectedTransformation.title}
                    </h2>
                    {selectedTransformation.prompt === 'CUSTOM' ? (
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g., 'make the sky a vibrant sunset' or 'add a small red boat on the water'"
                            rows={3}
                            className="w-full mt-2 p-3 bg-gray-900 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors placeholder-gray-500"
                        />
                    ) : (
                       <p className="text-gray-400">{selectedTransformation.description}</p>
                    )}
                  </div>

                  {selectedTransformation.isMultiImage ? (
                    <MultiImageUploader
                      onPrimarySelect={handlePrimaryImageSelect}
                      onSecondarySelect={handleSecondaryImageSelect}
                      primaryImageUrl={primaryImageUrl}
                      secondaryImageUrl={secondaryImageUrl}
                      onClearPrimary={handleClearPrimaryImage}
                      onClearSecondary={handleClearSecondaryImage}
                      primaryTitle={selectedTransformation.primaryUploaderTitle}
                      primaryDescription={selectedTransformation.primaryUploaderDescription}
                      secondaryTitle={selectedTransformation.secondaryUploaderTitle}
                      secondaryDescription={selectedTransformation.secondaryUploaderDescription}
                    />
                  ) : (
                    <ImageEditorCanvas
                      onImageSelect={handlePrimaryImageSelect}
                      initialImageUrl={primaryImageUrl}
                      onMaskChange={setMaskDataUrl}
                      onClearImage={handleClearPrimaryImage}
                      isMaskToolActive={activeTool === 'mask'}
                    />
                  )}

                  {primaryImageUrl && !selectedTransformation.isMultiImage && (
                    <div className="mt-4">
                        <button
                            onClick={toggleMaskTool}
                            className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                activeTool === 'mask' ? 'bg-gradient-to-r from-orange-500 to-yellow-400 text-black' : 'bg-gray-800 hover:bg-gray-700'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                            <span>Draw Mask</span>
                        </button>
                    </div>
                  )}

                  {/* Stellar Token Status */}
                  {!isStellarMode && (
                    <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-300 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">Stellar Token Required</span>
                      </div>
                      <p className="text-yellow-200 text-sm">
                        Add ?stellar=your-token to the URL to use this service.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerateDisabled}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-yellow-400 text-black font-semibold rounded-lg shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-yellow-500 disabled:bg-gray-800 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>Generate Image</span>
                      </>
                    )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Output Column */}
              <div className="flex flex-col p-4 md:p-6 bg-gray-950/60 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl shadow-black/20">
                <h2 className="text-xl font-semibold mb-4 text-orange-500 self-start">Result</h2>
                {isLoading && <div className="flex-grow flex items-center justify-center"><LoadingSpinner message={loadingMessage} /></div>}
                {error && (
                  <div className="flex-grow flex items-center justify-center w-full">
                    {error.includes('stellar token') ? (
                      <PaymentErrorMessage
                        message={error}
                        isUsingStellar={isStellarMode}
                        onRetry={() => {
                          setError(null);
                          handleGenerate();
                        }}
                      />
                    ) : (
                      <ErrorMessage message={error} />
                    )}
                  </div>
                )}
                {!isLoading && !error && generatedContent && (
                    <ResultDisplay
                        content={generatedContent}
                        onUseImageAsInput={handleUseImageAsInput}
                        onImageClick={handleOpenPreview}
                        originalImageUrl={primaryImageUrl}
                    />
                )}
                {!isLoading && !error && !generatedContent && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2">Your generated image will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <ImagePreviewModal imageUrl={previewImageUrl} onClose={handleClosePreview} />
      <Gallery
        isOpen={isGalleryOpen}
        onClose={toggleGallery}
        onSelectImage={handleSelectGalleryImage}
      />

      {/* Add fade-in animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeInFast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-fast {
          animation: fadeInFast 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
