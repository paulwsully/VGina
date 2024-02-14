import React, { useState, useEffect, useRef } from "react";
import Timer from "./Timer";

function TimerOverlay({}) {
  const [activeTimers, setActiveTimers] = useState([]);
  const overlayRef = useRef(null);

  useEffect(() => {
    const updateTimers = async () => {
      const timers = await window.electron.getActiveTimers();
      setActiveTimers(timers);
    };

    window.electron.ipcRenderer.on("updateActiveTimers", updateTimers);
    updateTimers();

    const fetchSettings = async () => {
      const storedOverlayTimersLocked = await window.electron.ipcRenderer.invoke("storeGet", "overlayTimersLocked");
      window.electron.ipcRenderer.send(`${storedOverlayTimersLocked ? "lock" : "unlock"}-overlay-timers`);
    };

    fetchSettings();

    return () => {
      window.electron.ipcRenderer.removeAllListeners("updateActiveTimers");
    };
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
