import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from "react-joyride";

interface TutorialWalkthroughProps {
  run: boolean;
  onComplete: () => void;
}

export const TutorialWalkthrough = ({ run, onComplete }: TutorialWalkthroughProps) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
    {
      target: '[data-tour="today-prayer"]',
      content: "This is your Today's Prayer Focus! Start here each day for your guided prayer session.",
      disableBeacon: true,
      placement: "bottom",
    },
    {
      target: '[data-tour="prayer-streak"]',
      content: "Track your prayer streak here! Pray daily to build your streak and unlock milestones.",
      placement: "top",
    },
    {
      target: '[data-tour="quick-actions"]',
      content: "Quick access to all your prayer tools - Guidelines, Journal, and more!",
      placement: "top",
    },
    {
      target: '[data-tour="prayer-journey"]',
      content: "See your weekly prayer calendar and track your spiritual journey over time.",
      placement: "top",
    },
    {
      target: '[data-encouragement-card]',
      content: "Stay connected with the community through announcements and updates from your spiritual leaders.",
      placement: "top",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      onComplete();
    } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      setStepIndex(index + 1);
    } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
      setStepIndex(index - 1);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(230 50% 35%)",
          textColor: "hsl(230 50% 20%)",
          backgroundColor: "white",
          arrowColor: "white",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "1rem",
          padding: "1.5rem",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: "1.125rem",
          fontWeight: "600",
          marginBottom: "0.5rem",
        },
        tooltipContent: {
          fontSize: "1rem",
          padding: "0.5rem 0",
        },
        buttonNext: {
          background: "linear-gradient(135deg, hsl(230 50% 35%), hsl(230 50% 50%))",
          borderRadius: "0.5rem",
          padding: "0.5rem 1.5rem",
          fontSize: "0.875rem",
          fontWeight: "500",
        },
        buttonBack: {
          color: "hsl(230 50% 35%)",
          marginRight: "0.5rem",
          fontSize: "0.875rem",
        },
        buttonSkip: {
          color: "hsl(230 20% 50%)",
          fontSize: "0.875rem",
        },
        spotlight: {
          borderRadius: "1rem",
        },
      }}
      locale={{
        back: "Previous",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: {
            filter: "drop-shadow(0 10px 25px rgba(0, 0, 0, 0.15))",
          },
        },
      }}
    />
  );
};
