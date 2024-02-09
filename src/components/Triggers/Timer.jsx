import React, { useState, useEffect, useRef, memo } from "react";

const Timer = memo(({ timer }) => {
  const totalSeconds = timer.timerHours * 3600 + timer.timerMinutes * 60 + timer.timerSeconds;
  const endTime = useRef(Date.now() + totalSeconds * 1000);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const remainingTimeInSeconds = Math.round((endTime.current - now) / 1000);
      setTimeLeft(remainingTimeInSeconds);

      if (remainingTimeInSeconds <= -1) {
        clearInterval(intervalId);
        setIsVisible(false);
        window.electron.ipcRenderer.send("remove-activeTimer", timer.id);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timer.id]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const progressWidth = `${(timeLeft / totalSeconds) * 100}%`;

  return isVisible ? (
    <div className="timer">
      <div className="timer-header">
        <div className="timer-name">{timer.triggerName}</div>
        <div className="timer-time">{`${hours}h ${minutes}m ${seconds}s`}</div>
      </div>
      <div className="timer-progress">
        <div className="progress-bar" style={{ width: progressWidth }}></div>
      </div>
    </div>
  ) : null;
});

export default Timer;
