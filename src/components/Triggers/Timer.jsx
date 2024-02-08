import React, { useState, useEffect } from "react";

function Timer({ timer }) {
  const totalSeconds = timer.timerHours * 3600 + timer.timerMinutes * 60 + timer.timerSeconds;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [progressWidth, setProgressWidth] = useState("100%");

  useEffect(() => {
    const updateProgress = () => {
      const percentage = (remainingSeconds / totalSeconds) * 100;
      setProgressWidth(`${percentage}%`);
    };

    updateProgress();

    const timerId = setInterval(() => {
      setRemainingSeconds((prevSeconds) => {
        if (prevSeconds <= 0) {
          clearInterval(timerId);
          return 0;
        }
        return prevSeconds - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [remainingSeconds, totalSeconds]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="timer">
      <div className="timer-header">
        <div className="timer-name">{timer.triggerName}</div>
        <div className="timer-time">{`${hours}h ${minutes}m ${seconds}s`}</div>
      </div>
      <div className="timer-progress">
        <div className="progress-bar" style={{ width: progressWidth }}></div>
      </div>
    </div>
  );
}

export default Timer;
