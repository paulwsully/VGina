import React, { useState, useEffect, useRef } from "react";
import Timer from "./Timer";

function TimerOverlay({}) {
  const [activeTimers, setActiveTimers] = useState([]);
  const overlayRef = useRef(null);

  useEffect(() => {
    const updateTimers = async () => {
      let timers = await window.electron.getActiveTimers();
      if (!Array.isArray(timers)) {
        timers = [];
      }
      setActiveTimers(timers);
    };

    window.electron.ipcRenderer.on("updateActiveTimers", updateTimers);
    updateTimers();

    const fetchSettings = async () => {
      const storedlockOverlayTimers = await window.electron.ipcRenderer.invoke("storeGet", "lockOverlayTimers");
      window.electron.ipcRenderer.send(`${storedlockOverlayTimers ? "lock" : "unlock"}-overlay-timers`);
    };

    fetchSettings();

    return () => {
      window.electron.ipcRenderer.removeAllListeners("updateActiveTimers");
    };
  }, []);

  return (
    <div className="trigger-overlay" ref={overlayRef}>
      <div className="timers">{activeTimers && activeTimers.map((timer, index) => <Timer key={timer.id + index} timer={timer} />)}</div>
    </div>
  );
}

export default TimerOverlay;
