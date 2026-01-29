"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  selector?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to AI Document Formatter",
    description: "Transform your rough notes into professional documents in seconds with AI-powered formatting.",
    position: "bottom"
  },
  {
    id: "input",
    title: "Paste Your Content",
    description: "Start by pasting or typing your content here. You can use meeting notes, research findings, blog drafts, or any text.",
    selector: "textarea",
    position: "bottom"
  },
  {
    id: "templates",
    title: "Explore Templates",
    description: "Need inspiration? Browse our professional templates for reports, proposals, articles, and more.",
    selector: "[data-tab='templates']",
    position: "bottom"
  },
  {
    id: "generate",
    title: "Generate Document",
    description: "Click here to analyze your content and generate a beautifully formatted document structure.",
    selector: "[data-action='generate']",
    position: "bottom"
  },
  {
    id: "editor",
    title: "Edit & Customize",
    description: "Use the editor to refine your document. Change styles, add metadata, and preview the final result.",
    position: "bottom"
  },
  {
    id: "export",
    title: "Export Your Document",
    description: "Export as DOCX or PDF with professional styling. Your document is ready for sharing or printing.",
    selector: "[data-action='export']",
    position: "left"
  },
  {
    id: "theme",
    title: "Switch Themes",
    description: "Toggle between light and dark mode for comfortable editing in any environment.",
    selector: "[data-action='theme-toggle']",
    position: "left"
  }
];

interface TutorialOverlayProps {
  onComplete?: () => void;
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Check if user has completed tutorial before
    const tutorialCompleted = localStorage.getItem("tutorial-completed");
    if (!tutorialCompleted) {
      setIsVisible(true);
    } else {
      setHasCompleted(true);
    }
  }, []);

  const currentStepData = TUTORIAL_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem("tutorial-completed", "true");
    setHasCompleted(true);
    onComplete?.();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem("tutorial-skipped", "true");
    setHasCompleted(true);
  };

  if (!isVisible || hasCompleted) {
    return null;
  }

  // Calculate position for highlight
  let highlightElement: HTMLElement | null = null;
  if (currentStepData.selector) {
    highlightElement = document.querySelector(currentStepData.selector) as HTMLElement;
  }

  const highlightRect = highlightElement?.getBoundingClientRect();

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />

      {/* Highlight Box */}
      {highlightRect && (
        <div
          className="fixed z-[101] border-2 border-blue-500 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: "0 0 -20px 20px rgba(59, 130, 246, 0.3)"
          }}
        />
      )}

      {/* Tutorial Card */}
      <div className="fixed z-[102] w-96 max-w-[90vw]">
        {/* Position based on step */}
        <div
          className={cn(
            "absolute transition-all duration-300",
            highlightRect ? {
              "top": currentStepData.position === "bottom" ? highlightRect.bottom + -20 : undefined,
              "bottom": currentStepData.position === "top" ? window.innerHeight - highlightRect.top + 20 : undefined,
              "left": currentStepData.position === "right" ? highlightRect.right + 20 : highlightRect?.left,
              "right": currentStepData.position === "left" ? window.innerWidth - highlightRect.left + 20 : undefined,
            } : "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          )}
        >
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-white/10 shadow-2xl p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{currentStepData.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {TUTORIAL_STEPS.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          index === currentStep
                            ? "w-6 bg-gradient-to-r from-blue-500 to-purple-500"
                            : "w-2 bg-white/20"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Description */}
            <p className="text-white/70 mb-6 leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/40">
                Step {currentStep + 1} of {TUTORIAL_STEPS.length}
              </div>
              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                  size="sm"
                >
                  {currentStep < TUTORIAL_STEPS.length - 1 ? (
                    <>
                      Next
                      <ChevronRight size={16} className="ml-1" />
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Helper Tip */}
      <div className="fixed bottom-6 right-6 z-[102]">
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl border border-white/10 p-4 shadow-xl">
          <p className="text-sm text-white/60">
            <span className="font-medium text-white/80">Tip:</span> You can restart this tutorial anytime from settings
          </p>
        </div>
      </div>
    </>
  );
}

// Helper function to restart tutorial
export function restartTutorial() {
  localStorage.removeItem("tutorial-completed");
  localStorage.removeItem("tutorial-skipped");
  window.location.reload();
}