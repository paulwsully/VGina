import React, { useState, useEffect } from "react";
import NewTrigger from "./NewTrigger";
import Checkbox from "../Utilities/Checkbox";
import "./Triggers.scss";

function Triggers() {
  const [triggers, setTriggers] = useState([]);
  const [showTimersOverlay, setShowTimersOverlay] = useState(false);
  const [overlayTimersLocked, setOverlayTimersLocked] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState(null);

  useEffect(() => {
    const fetchSettingsAndTriggers = async () => {
      const storedShowTimersOverlay = await window.electron.ipcRenderer.invoke("storeGet", "showTimersOverlay");
      const storedOverlayTimersLocked = await window.electron.ipcRenderer.invoke("storeGet", "overlayTimersLocked");
      const storedTriggers = await window.electron.ipcRenderer.invoke("storeGet", "triggers");

      setShowTimersOverlay(storedShowTimersOverlay || false);
      setOverlayTimersLocked(storedOverlayTimersLocked || false);
      setTriggers(storedTriggers || []);
      if (storedShowTimersOverlay) window.electron.ipcRenderer.send("open-overlay-timers");
    };
    fetchSettingsAndTriggers();
  }, []);

  const selectTrigger = (trigger) => {
    setSelectedTrigger(trigger);
  };

  const refreshTriggers = async () => {
    const updatedTriggers = await window.electron.ipcRenderer.invoke("storeGet", "triggers");
    setTriggers(updatedTriggers || []);
  };

  const handleShowTimersOverlayChange = (checked) => {
    setShowTimersOverlay(checked);
    window.electron.ipcRenderer.send("storeSet", "showTimersOverlay", checked);
    if (checked) {
      window.electron.ipcRenderer.send("open-overlay-timers");
    } else {
      window.electron.ipcRenderer.send("close-overlay-timers");
    }
  };

  const handleLockOverlayChange = (checked) => {
    setOverlayTimersLocked(checked);
    window.electron.ipcRenderer.send("storeSet", "overlayTimersLocked", checked);
    if (checked) {
      window.electron.ipcRenderer.send("lock-overlay-timers");
    } else {
      window.electron.ipcRenderer.send("unlock-overlay-timers");
    }
  };

  const triggerUpdateCancelled = () => {
    console.log("cancelled");
    setSelectedTrigger(null);
  };

  return (
    <div className="triggers-wrapper">
      <div className="actions">
        <Checkbox id="showTimersOverlay" label="Show Timers Overlay" checked={showTimersOverlay} onCheckChange={handleShowTimersOverlayChange} />
        <Checkbox id="lockOverlayTimers" label="Lock Timers Overlay" checked={overlayTimersLocked} onCheckChange={handleLockOverlayChange} />
      </div>
      <NewTrigger refreshTriggers={refreshTriggers} />
      <div className="triggers">
        <h3>Triggers</h3>
        {triggers.length === 0 && <div className="null-message">No Triggers. Click "New Trigger" to create one.</div>}
        {triggers.map((trigger) => (
          <div key={trigger.id} className="trigger" onClick={() => selectTrigger(trigger)}>
            <div className="text-primary bold">{trigger.triggerName}</div>
            <span>{trigger.searchText}</span>
            {selectedTrigger && selectedTrigger.id === trigger.id && (
              <NewTrigger key={selectedTrigger.id} selectedTrigger={selectedTrigger} refreshTriggers={refreshTriggers} triggerUpdateCancelled={triggerUpdateCancelled} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Triggers;
