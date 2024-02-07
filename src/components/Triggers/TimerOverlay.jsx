import React, { useState, useEffect, useRef } from "react";

function TimerOverlay({ progress = 50 }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (overlayRef.current) {
      const { width, height } = overlayRef.current.getBoundingClientRect();
      window.electron.ipcRenderer.send("timersOverlay-resize", { width, height });
    }
  }, []);

  const progressBarStyle = {
    width: `${progress}%`,
  };

  return (
    <div className="trigger-overlay" ref={overlayRef}>
      <div className="triggers">
        <div className="trigger">
          <div className="trigger-name">Ice Giants</div>
          <div className="trigger-progress">
            <div className="progress-bar" style={progressBarStyle}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimerOverlay;
