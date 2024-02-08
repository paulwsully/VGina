import React, { useState, useEffect, useRef } from "react";
import Timer from "./Timer";

function TimerOverlay({}) {
  const [activeTimers, setActiveTimers] = useState([]);
  const overlayRef = useRef(null);

  useEffect(() => {
    const updateTimers = async () => {
      const timers = await window.electron.getActiveTimers();
      console.log(timers);
      setActiveTimers(timers);
    };

    window.electron.ipcRenderer.on("updateActiveTimers", updateTimers);
    updateTimers();

    return () => {
      window.electron.ipcRenderer.removeAllListeners("updateActiveTimers");
    };
  }, []);

  useEffect(() => {
    if (overlayRef.current) {
      const { width, height } = overlayRef.current.getBoundingClientRect();
      window.electron.ipcRenderer.send("timersOverlay-resize", { width, height });
    }
  }, []);

  return (
    <div className="trigger-overlay" ref={overlayRef}>
      <div className="timers">
        {activeTimers.map((timer) => (
          <Timer key={timer.id} timer={timer} />
        ))}
      </div>
    </div>
  );
}

export default TimerOverlay;
