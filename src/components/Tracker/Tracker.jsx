import React, { useEffect, useState } from "react";
import arrow from "../../assets/arrow-background-removed.png";
import "./Tracker.scss";

function Tracker() {
  const [direction, setDirection] = useState("no-direction");

  useEffect(() => {
    const updateDirection = (dir) => {
      setDirection(dir);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setDirection("no-direction");
      }, 6000);
    };

    window.electron.ipcRenderer.on("send-tracker-direction", updateDirection);

    let timer = setTimeout(() => {
      setDirection("no-direction");
    }, 8000);

    return () => {
      window.electron.ipcRenderer.removeAllListeners("send-tracker-direction");
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="tracker-overlay">
      <div className={`arrow ${direction}`}>
        <img src={arrow} alt="Arrow" />
      </div>
    </div>
  );
}

export default Tracker;
