"use client";

import { useCallback, useEffect, useState } from "react";
import { TRANSFORMATIONS } from "./constants";
import { editImage } from "./services/geminiService";
import {
  clearStellarToken,
  getStellarToken,
  isUsingStellar,
  setStellarToken as setStellarTokenService,
} from "./services/stellarService";
import type { ActiveTool, GeneratedContent, Transformation } from "./types";
import {
  dataUrlToFile,
  embedWatermark,
  loadImage,
  resizeImageToMatch,
} from "./utils/fileUtils";

import { PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStellarTransfer } from "@/hooks/use-stellar-transfer";
import { useStellarWallet } from "@/hooks/use-stellar-wallet";
import { ArrowLeft, Image, Pencil, Sparkles, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ErrorMessage from "./components/ErrorMessage";
import Gallery from "./components/Gallery";
import ImageEditorCanvas from "./components/ImageEditorCanvas";
import ImagePreviewModal from "./components/ImagePreviewModal";
import LoadingSpinner from "./components/LoadingSpinner";
import MultiImageUploader from "./components/MultiImageUploader";
import PaymentErrorMessage from "./components/PaymentErrorMessage";
import ResultDisplay from "./components/ResultDisplay";
import TransformationSelector from "./components/TransformationSelector";

export default function BananaPage() {
  // Check for stellar parameter in URL
  const [stellarToken, setStellarToken] = useState<string | null>(
    getStellarToken()
  );
  const [isStellarMode, setIsStellarMode] = useState<boolean>(isUsingStellar());

  useEffect(() => {
    if (stellarToken) {
      setStellarTokenService(stellarToken);
      setIsStellarMode(true);
    } else {
      // Update stellar token if URL changes
      const token = getStellarToken();
      setStellarToken(token);
      setIsStellarMode(isUsingStellar());
    }
  }, [stellarToken]);

  const [transformations, setTransformations] = useState<Transformation[]>(
    () => {
      if (typeof window !== "undefined") {
        try {
          const savedOrder = localStorage.getItem("transformationOrder");
          if (savedOrder) {
            const orderedIds = JSON.parse(savedOrder) as string[];
            const transformationMap = new Map(
              TRANSFORMATIONS.map((t) => [t.id, t])
            );

            const orderedTransformations = orderedIds
              .map((id) => transformationMap.get(id))
              .filter((t): t is Transformation => !!t);

            const savedIdsSet = new Set(orderedIds);
            const newTransformations = TRANSFORMATIONS.filter(
              (t) => !savedIdsSet.has(t.id)
            );

            return [...orderedTransformations, ...newTransformations];
          }
        } catch (e) {
          console.error("Failed to load transformation order:", e);
        }
      }
      return TRANSFORMATIONS;
    }
  );
  const router = useRouter();
  const [selectedTransformation, setSelectedTransformation] =
    useState<Transformation | null>(null);
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [secondaryImageUrl, setSecondaryImageUrl] = useState<string | null>(
    null
  );
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Payment state variables
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastId, setToastId] = useState<string | number | null>(null);
  const [paymentType, setPaymentType] = useState<"usdc" | "xlm">("usdc");
  const { transfer } = useStellarTransfer();

  // Initialize Stellar wallet to ensure publicKey is set
  const { isAuthenticated } = useStellarWallet();
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [activeTool, setActiveTool] = useState<ActiveTool>("none");
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const orderToSave = transformations.map((t) => t.id);
        localStorage.setItem(
          "transformationOrder",
          JSON.stringify(orderToSave)
        );
      } catch (e) {
        console.error("Failed to save transformation order:", e);
      }
    }
  }, [transformations]);

  // Save generated images to history
  useEffect(() => {
    if (typeof window !== "undefined" && generatedContent?.imageUrl) {
      try {
        const history = JSON.parse(
          localStorage.getItem("bananaHistory") || "[]"
        );
        history.unshift(generatedContent.imageUrl);
        // Keep only last 20 images
        const trimmedHistory = history.slice(0, 20);
        localStorage.setItem("bananaHistory", JSON.stringify(trimmedHistory));
      } catch (e) {
        console.error("Failed to save to history:", e);
      }
    }
  }, [generatedContent]);

  const handleSelectTransformation = (transformation: Transformation) => {
    setSelectedTransformation(transformation);
    setGeneratedContent(null);
    setError(null);
    if (transformation.prompt !== "CUSTOM") {
      setCustomPrompt("");
    }
  };

  const handlePrimaryImageSelect = useCallback(
    (file: File, dataUrl: string) => {
      setPrimaryFile(file);
      setPrimaryImageUrl(dataUrl);
      setGeneratedContent(null);
      setError(null);
      setMaskDataUrl(null);
      setActiveTool("none");
    },
    []
  );

  const handleSecondaryImageSelect = useCallback(
    (file: File, dataUrl: string) => {
      setSecondaryFile(file);
      setSecondaryImageUrl(dataUrl);
      setGeneratedContent(null);
      setError(null);
    },
    []
  );

  const handleClearPrimaryImage = () => {
    setPrimaryImageUrl(null);
    setPrimaryFile(null);
    setGeneratedContent(null);
    setError(null);
    setMaskDataUrl(null);
    setActiveTool("none");
  };

  const handleClearSecondaryImage = () => {
    setSecondaryImageUrl(null);
    setSecondaryFile(null);
  };

  // Payment handlers
  const handlePayment = (type: "usdc" | "xlm") => {
    setPaymentType(type);
    setShowConfirmDialog(true);
  };

  const handleConfirmPayment = async () => {
    const idToast = toast.loading("Processing payment...");
    setToastId(idToast);
    setIsProcessing(true);

    try {
      const amount = paymentType === "usdc" ? "0.1" : "0.25";

      const result = await transfer(
        {
          bridge: false,
          payload: {
            amount: amount,
            address: "GC56BXCNEWL6JSGKHD3RJ5HJRNKFEJQ53D3YY3SMD6XK7YPDI75BQ7FD",
          },
        },
        paymentType
      );
      toast.dismiss(idToast);
      if (result) {
        toast.success("Payment successful!");
        // Set stellar token to enable image generation
        setStellarToken("scdv2o3iejwdlfjw12o3ir");
        setStellarTokenService("scdv2o3iejwdlfjw12o3ir");
        setIsStellarMode(true);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process payment"
      );
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
      toast.dismiss(idToast);
    }
  };

  const handleCancelPayment = () => {
    setShowConfirmDialog(false);
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

    const promptToUse =
      selectedTransformation.prompt === "CUSTOM"
        ? customPrompt
        : selectedTransformation.prompt;
    if (!promptToUse.trim()) {
      setError("Please enter a prompt describing the change you want to see.");
      return;
    }

    // Check for stellar token
    if (!isStellarMode) {
      setError(
        "Please provide a stellar token in the URL (?stellar=your-token)."
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setLoadingMessage("");

    try {
      const primaryMimeType =
        primaryImageUrl!.split(";")[0].split(":")[1] ?? "image/png";
      const primaryBase64 = primaryImageUrl!.split(",")[1];
      const maskBase64 = maskDataUrl ? maskDataUrl.split(",")[1] : null;

      if (selectedTransformation.isTwoStep) {
        // Step 1: Generate line art (using only the primary image)
        setLoadingMessage("Step 1: Creating line art...");
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
        setLoadingMessage("Step 2: Applying color palette...");
        const stepOneImageBase64 = stepOneResult.imageUrl.split(",")[1];
        const stepOneImageMimeType =
          stepOneResult.imageUrl.split(";")[0].split(":")[1] ?? "image/png";

        let secondaryImagePayload = null;
        if (
          selectedTransformation.isMultiImage &&
          secondaryImageUrl &&
          primaryImageUrl
        ) {
          const primaryImage = await loadImage(primaryImageUrl);
          const resizedSecondaryImageUrl = await resizeImageToMatch(
            secondaryImageUrl,
            primaryImage
          );

          const secondaryMimeType =
            resizedSecondaryImageUrl.split(";")[0].split(":")[1] ?? "image/png";
          const secondaryBase64 = resizedSecondaryImageUrl.split(",")[1];
          secondaryImagePayload = {
            base64: secondaryBase64,
            mimeType: secondaryMimeType,
          };
        }

        const stepTwoResult = await editImage(
          stepOneImageBase64,
          stepOneImageMimeType,
          selectedTransformation.stepTwoPrompt!,
          null,
          secondaryImagePayload
        );

        if (stepTwoResult.imageUrl) {
          stepTwoResult.imageUrl = await embedWatermark(
            stepTwoResult.imageUrl,
            "ROZO Bananary"
          );
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
          const secondaryMimeType =
            secondaryImageUrl.split(";")[0].split(":")[1] ?? "image/png";
          const secondaryBase64 = secondaryImageUrl.split(",")[1];
          secondaryImagePayload = {
            base64: secondaryBase64,
            mimeType: secondaryMimeType,
          };
        }
        setLoadingMessage("Generating your masterpiece...");
        const result = await editImage(
          primaryBase64,
          primaryMimeType,
          promptToUse,
          maskBase64,
          secondaryImagePayload
        );

        if (result.imageUrl) {
          result.imageUrl = await embedWatermark(
            result.imageUrl,
            "ROZO Bananary"
          );
        }

        setGeneratedContent(result);
      }

      // Done generating, clear stellar token
      clearStellarToken();
      setIsStellarMode(false);
      setStellarToken(null);
      setStellarTokenService("");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, [
    primaryImageUrl,
    secondaryImageUrl,
    selectedTransformation,
    maskDataUrl,
    customPrompt,
    isStellarMode,
  ]);

  const handleUseImageAsInput = useCallback(async (imageUrl: string) => {
    if (!imageUrl) return;

    try {
      const newFile = await dataUrlToFile(imageUrl, `edited-${Date.now()}.png`);
      setPrimaryFile(newFile);
      setPrimaryImageUrl(imageUrl);
      setGeneratedContent(null);
      setError(null);
      setMaskDataUrl(null);
      setActiveTool("none");
      setSecondaryFile(null);
      setSecondaryImageUrl(null);
      setSelectedTransformation(null);
      setIsStellarMode(false);
      setStellarToken(null);
      setStellarTokenService("");
      clearStellarToken();
    } catch (err) {
      console.error("Failed to use image as input:", err);
      setError("Could not use the generated image as a new input.");
    }
  }, []);

  const toggleGallery = () => setIsGalleryOpen((prev) => !prev);

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
    setCustomPrompt("");
    setActiveTool("none");
  };

  const handleOpenPreview = (url: string) => setPreviewImageUrl(url);
  const handleClosePreview = () => setPreviewImageUrl(null);

  const toggleMaskTool = () => {
    setActiveTool((current) => (current === "mask" ? "none" : "mask"));
  };

  const isCustomPromptEmpty =
    selectedTransformation?.prompt === "CUSTOM" && !customPrompt.trim();
  const isSingleImageReady =
    !selectedTransformation?.isMultiImage && primaryImageUrl;
  const isMultiImageReady =
    selectedTransformation?.isMultiImage &&
    primaryImageUrl &&
    secondaryImageUrl;
  const isGenerateDisabled =
    isLoading ||
    isCustomPromptEmpty ||
    (!isSingleImageReady && !isMultiImageReady) ||
    !isStellarMode;

  return (
    <div className="w-full mb-14 flex flex-col gap-4 mt-4 relative">
      <PageHeader
        title="Rozo Bananary"
        icon="🍌"
        action={
          <Button onClick={toggleGallery}>
            <Image className="size-4" />
            Gallery
          </Button>
        }
      />

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
            <div className="mb-4">
              <Button onClick={handleBackToSelection} variant="secondary">
                <ArrowLeft className="size-4" />
                Choose Another Effect
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-8">
              {/* Input Column */}
              <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 bg-accent backdrop-blur-lg rounded-xl border border-white/10 shadow-lg shadow-black/20">
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-bold mb-1 text-primary flex items-center gap-3">
                      <span className="text-3xl">
                        {selectedTransformation.emoji}
                      </span>
                      {selectedTransformation.title}
                    </h2>
                    {selectedTransformation.prompt === "CUSTOM" ? (
                      <Textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="e.g., 'make the sky a vibrant sunset' or 'add a small red boat on the water'"
                        rows={3}
                        className="w-full mt-2 p-3 bg-background"
                      />
                    ) : (
                      <p className="text-primary/65">
                        {selectedTransformation.description}
                      </p>
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
                      primaryDescription={
                        selectedTransformation.primaryUploaderDescription
                      }
                      secondaryTitle={
                        selectedTransformation.secondaryUploaderTitle
                      }
                      secondaryDescription={
                        selectedTransformation.secondaryUploaderDescription
                      }
                    />
                  ) : (
                    <ImageEditorCanvas
                      onImageSelect={handlePrimaryImageSelect}
                      initialImageUrl={primaryImageUrl}
                      onMaskChange={setMaskDataUrl}
                      onClearImage={handleClearPrimaryImage}
                      isMaskToolActive={activeTool === "mask"}
                    />
                  )}

                  {primaryImageUrl && !selectedTransformation.isMultiImage && (
                    <div className="mt-4">
                      <Button
                        onClick={toggleMaskTool}
                        variant={activeTool === "mask" ? "default" : "outline"}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors duration-200"
                      >
                        <Pencil className="size-4" />
                        <span>Draw Mask</span>
                      </Button>
                    </div>
                  )}

                  {/* Stellar Token Status */}
                  {/* {!isStellarMode && (
                    <Alert variant="default" className="mt-4">
                      <AlertTitle>Stellar Token Required</AlertTitle>
                      <AlertDescription>
                        
                      </AlertDescription>
                    </Alert>
                  )} */}

                  <div className="flex gap-3 mt-6">
                    {!isAuthenticated && (
                      <div className="flex-1 flex items-center justify-center gap-4">
                        <Button
                          className="flex-1"
                          onClick={() => router.push("/login")}
                        >
                          Login to Generate Images
                        </Button>
                      </div>
                    )}

                    {isAuthenticated && !isStellarMode && (
                      <div className="flex-1 flex items-center justify-center gap-4">
                        <Button
                          className="flex-1"
                          onClick={() => handlePayment("usdc")}
                          disabled={
                            isCustomPromptEmpty ||
                            (!isSingleImageReady && !isMultiImageReady) ||
                            isProcessing
                          }
                        >
                          {isProcessing && paymentType === "usdc"
                            ? "Processing..."
                            : "Pay 0.1 USDC"}
                        </Button>
                        <span className="text-primary/65 text-sm">or</span>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handlePayment("xlm")}
                          disabled={
                            isCustomPromptEmpty ||
                            (!isSingleImageReady && !isMultiImageReady) ||
                            isProcessing
                          }
                        >
                          {isProcessing && paymentType === "xlm"
                            ? "Processing..."
                            : "Pay 0.25 XLM"}
                        </Button>
                      </div>
                    )}

                    {isAuthenticated && isStellarMode && (
                      <Button
                        variant="default"
                        onClick={handleGenerate}
                        disabled={isGenerateDisabled}
                        className="w-full h-12 text-lg"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Sparkles className="size-4 animate-pulse" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <WandSparkles className="size-4" />
                            <span>Generate Image</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Output Column */}
              <div className="flex flex-col p-4 md:p-6 bg-background rounded-xl border mt-8">
                <h2 className="text-xl font-semibold mb-4 text-primary self-start">
                  Result
                </h2>
                {isLoading && (
                  <div className="flex-grow flex items-center justify-center">
                    <LoadingSpinner message={loadingMessage} />
                  </div>
                )}
                {error && (
                  <div className="flex-grow flex items-center justify-center w-full">
                    {error.includes("stellar token") ? (
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-2">
                      Your generated image will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <ImagePreviewModal
        imageUrl={previewImageUrl}
        onClose={handleClosePreview}
      />
      <Gallery
        isOpen={isGalleryOpen}
        onClose={toggleGallery}
        onSelectImage={handleSelectGalleryImage}
      />

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to pay{" "}
              <span className="font-semibold">
                {paymentType === "usdc" ? "0.1 USDC" : "0.25 XLM"}
              </span>{" "}
              for AI Image Generation?
              <div className="mt-2 text-sm text-muted-foreground">
                This will unlock the ability to generate AI-transformed images.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelPayment}
              disabled={isProcessing}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add fade-in animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeInFast {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in-fast {
          animation: fadeInFast 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
