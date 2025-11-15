import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hand, NotebookPen, TrendingUp, ChevronRight, ChevronLeft, Check } from "lucide-react";
import logoOnly from "@/assets/logo-only.png";
import { Progress } from "@/components/ui/progress";

interface WelcomeWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

const wizardSteps = [
  {
    title: "Welcome to SpiritConnect!",
    description: "Your personal companion for guided prayer and spiritual growth. Let us show you around in just a few steps.",
    icon: null,
    useLogo: true,
    color: "text-primary",
    bgGradient: "from-primary/20 to-primary-light/20",
  },
  {
    title: "Daily Prayer Focus",
    description: "Each day features a guided prayer session to help you maintain a consistent prayer routine and deepen your faith.",
    icon: Hand,
    color: "text-rose-500",
    bgGradient: "from-rose-500/20 to-pink-500/30",
  },
  {
    title: "Track Your Journey",
    description: "Build prayer streaks, unlock milestones, and see your spiritual growth visualized through your prayer calendar.",
    icon: TrendingUp,
    color: "text-emerald-500",
    bgGradient: "from-emerald-500/20 to-green-500/20",
  },
  {
    title: "Journal & Share",
    description: "Record your spiritual insights in your private journal and share inspiring testimonies with the community.",
    icon: NotebookPen,
    color: "text-primary-light",
    bgGradient: "from-primary-light/20 to-primary/20",
  },
];

export const WelcomeWizard = ({ isOpen, onComplete }: WelcomeWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / wizardSteps.length) * 100;

  const currentStepData = wizardSteps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === wizardSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl border-white/20 p-0 overflow-hidden bg-gradient-to-br from-background to-background/95">
        <div className="relative">
          {/* Animated Background Orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${currentStepData.bgGradient} rounded-full blur-3xl`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 p-8">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {wizardSteps.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip
                </Button>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Content with Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center py-8"
              >
                {/* Icon */}
                {currentStepData.useLogo ? (
                  <motion.div
                    className="mx-auto mb-6 w-40 h-40 bg-gradient-to-br from-primary to-primary-light rounded-3xl flex items-center justify-center shadow-glow p-3"
                    animate={{
                      scale: [1, 1.08, 1],
                      rotate: [0, 2, -2, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <motion.img 
                      src={logoOnly} 
                      alt="SpiritConnect Logo"
                      className="w-full h-full object-contain drop-shadow-2xl"
                      style={{ filter: 'brightness(1.1) contrast(1.2)' }}
                      animate={{
                        filter: [
                          "drop-shadow(0 0 12px rgba(255,255,255,0.6))",
                          "drop-shadow(0 0 20px rgba(255,255,255,0.9))",
                          "drop-shadow(0 0 12px rgba(255,255,255,0.6))",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    className="mx-auto mb-6 w-24 h-24 bg-gradient-to-br from-primary to-primary-light rounded-3xl flex items-center justify-center shadow-glow"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Icon className="h-12 w-12 text-white" />
                  </motion.div>
                )}

                {/* Title */}
                <h2 className="text-3xl font-heading font-bold mb-4">
                  {currentStepData.title}
                </h2>

                {/* Description */}
                <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {currentStepData.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-gradient-primary text-gray-900 dark:text-white"
              >
                {isLastStep ? (
                  <>
                    Get Started
                    <Check className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {wizardSteps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted-foreground/30"
                  }`}
                  animate={index === currentStep ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5 }}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
