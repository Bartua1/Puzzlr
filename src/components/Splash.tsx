import React, { useEffect, useState, useRef } from 'react';

interface SplashProps {
  /**
   * Optional callback triggered when the loading bar reaches 100%
   */
  onFinishedLoading?: () => void;
  /**
   * The total duration of the loading simulation in milliseconds. Defaults to 3000ms.
   */
  loadingDuration?: number;
  /**
   * Represents the actual backend loading state.
   */
  isLoading: boolean;
}

export const Splash: React.FC<SplashProps> = ({
  onFinishedLoading,
  loadingDuration = 3000,
  isLoading,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const isLoadingRef = useRef<boolean>(isLoading);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    const intervalTime = 30; // Update frequency in milliseconds
    const increment = 100 / (loadingDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        // If loading has finished, increase the increment so the bar fills up rapidly
        const currentIncrement = isLoadingRef.current ? increment : 15;
        const next = prev + currentIncrement;

        if (isLoadingRef.current && next >= 95) {
          // Hold at 95% until backend loading is complete
          return 95;
        }

        if (next >= 100) {
          clearInterval(timer);
          if (onFinishedLoading) {
            // Slight delay before calling complete to let the user see 100%
            setTimeout(onFinishedLoading, 200);
          }
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [loadingDuration, onFinishedLoading]);

  return (
    <div className="puzzlr-splash-wrapper">
      {/* Scope-isolated component styles */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="puzzlr-splash-content">
        <div className="puzzlr-logo-container">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="puzzlr-svg"
          >
            {/* Mascot Group (Transforms are isolated here) */}
            <g className="puzzlr-mascot">
              {/* Mascot Body */}
              <rect
                className="puzzlr-body"
                x="22"
                y="40"
                width="56"
                height="50"
                rx="14"
                fill="#a78bfa"
              />
              <path
                className="puzzlr-shadow"
                d="M22 50 L50 40 L78 50"
                fill="#c084fc"
                opacity="0.5"
              />

              {/* Eye 1 (Blinking) */}
              <circle
                className="puzzlr-eye-left"
                cx="40"
                cy="62"
                r="4"
                fill="#ffffff"
              />
              
              {/* Eye 2 (Fixed Wink) */}
              <path
                className="puzzlr-eye-right"
                d="M56 62 Q60 58 64 62"
                stroke="#ffffff"
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />

              {/* Rosy cheeks */}
              <circle
                className="puzzlr-cheek"
                cx="34"
                cy="70"
                r="3.5"
                fill="#f43f5e"
                opacity="0.6"
              />
              <circle
                className="puzzlr-cheek"
                cx="66"
                cy="70"
                r="3.5"
                fill="#f43f5e"
                opacity="0.6"
              />

              {/* Smile */}
              <path
                className="puzzlr-smile"
                d="M46 70 Q50 74 54 70"
                stroke="#ffffff"
                strokeWidth={3.5}
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* Gold Crown (Separated for independent floating & bounce) */}
            <path
              className="puzzlr-crown"
              d="M40 40 L44 30 L50 35 L56 30 L60 40 Z"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="puzzlr-app-name">Puzzlr</h1>
      </div>

      {/* Progress Bar Container */}
      <div className="puzzlr-loader-wrapper">
        <div className="puzzlr-progress-track">
          <div
            className="puzzlr-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// CSS Keyframes and styling packaged within the component
const styles = `
  .puzzlr-splash-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #e0f2fe; /* Light blue matching the logo */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: calc(80px + env(safe-area-inset-top, 0px)) 24px calc(80px + env(safe-area-inset-bottom, 0px)) 24px;
    z-index: 9999;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .puzzlr-splash-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
  }

  .puzzlr-logo-container {
    width: 130px;
    height: 130px;
    margin-bottom: 16px;
  }

  .puzzlr-svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }

  .puzzlr-mascot {
    transform-origin: 50px 65px;
    transform-box: view-box;
    animation: puzzle-wobble-body 2.6s ease-in-out infinite;
  }

  .puzzlr-crown {
    transform-origin: 50px 35px;
    transform-box: view-box;
    animation: puzzle-wobble-crown 2.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
  }

  .puzzlr-eye-left {
    transform-origin: 40px 62px;
    transform-box: view-box;
    animation: puzzle-double-blink 2.6s infinite;
  }

  .puzzlr-app-name {
    font-size: 2.2rem;
    font-weight: 800;
    color: #4c1d95; /* Deep rich purple matching the theme */
    letter-spacing: -0.03em;
    margin: 12px 0 0 0;
    text-transform: capitalize;
  }

  /* Progress/Loader Styles */
  .puzzlr-loader-wrapper {
    width: 100%;
    max-width: 180px;
  }

  .puzzlr-progress-track {
    width: 100%;
    height: 6px;
    background-color: #bae6fd;
    border-radius: 3px;
    overflow: hidden;
  }

  .puzzlr-progress-bar {
    height: 100%;
    background-color: #a78bfa;
    border-radius: 3px;
    transition: width 0.05s linear;
  }

  /* Animation Keyframes: Style 3 (Crown Bob & Wobble) */
  @keyframes puzzle-wobble-body {
    0%, 80%, 100% { transform: rotate(0deg) scale(1); }
    10% { transform: rotate(-5deg) scale(0.95); }
    20% { transform: rotate(5deg) scale(1.05); }
    30% { transform: rotate(-3deg) scale(0.98); }
    40% { transform: rotate(0deg) scale(1); }
  }

  @keyframes puzzle-wobble-crown {
    0%, 80%, 100% { transform: translateY(0) rotate(0deg); }
    10% { transform: translateY(2px) rotate(-8deg); }
    22% { transform: translateY(-12px) rotate(15deg); }
    40% { transform: translateY(0) rotate(0deg); }
  }

  @keyframes puzzle-double-blink {
    0%, 45%, 55%, 65%, 100% { transform: scaleY(1); }
    50%, 60% { transform: scaleY(0.1); }
  }
`;
