import React, { useState, useEffect, memo } from "react";

const Timer = memo(({ timer }) => {
  const totalSeconds = timer.timerHours * 3600 + timer.timerMinutes * 60 + timer.timerSeconds;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds + 1);
  const [progressWidth, setProgressWidth] = useState("100%");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const updateProgress = () => {
      const percentage = Math.max(0, ((remainingSeconds - 1) / totalSeconds) * 100).toFixed(2);
      setProgressWidth(`${percentage}%`);
    };

    updateProgress();

    const timerId = setInterval(() => {
      setRemainingSeconds((prevSeconds) => {
        const nextSeconds = prevSeconds - 1;
        if (nextSeconds < 1) {
          clearInterval(timerId);
          setIsVisible(false);
          window.electron.ipcRenderer.send("remove-activeTimer", timer.id);
          return nextSeconds;
        }
        return nextSeconds;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [remainingSeconds, timer.id, totalSeconds]);

  const hours = Math.floor((remainingSeconds - 1) / 3600);
  const minutes = Math.floor(((remainingSeconds - 1) % 3600) / 60);
  const seconds = (remainingSeconds - 1) % 60;

  const displayHours = hours >= 0 ? hours : 0;
  const displayMinutes = minutes >= 0 ? minutes : 0;
  const displaySeconds = seconds >= 0 ? seconds : 0;

  return isVisible ? (
    <div className="timer">
      <div className="timer-header">
        <div className="timer-name">{timer.triggerName}</div>
        <div className="timer-time">{`${displayHours}h ${displayMinutes}m ${displaySeconds}s`}</div>
      </div>
      <div className="timer-progress">
        <div className="progress-bar" style={{ width: progressWidth }}></div>
      </div>
    </div>
  ) : null;
});

export default Timer;
