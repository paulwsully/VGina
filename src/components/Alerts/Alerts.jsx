import React, { useEffect, useState } from "react";
import Checkbox from "../Utilities/Checkbox";

function Alerts() {
  const checkboxes = [
    { id: "feignDeath", label: "Failed Feign Death" },
    { id: "rootBroke", label: "Mob Unrooted" },
    { id: "resisted", label: "Cast Resisted" },
    { id: "invisFading", label: "Invis Starting to Fade" },
    { id: "tell", label: "Tell Recieved" },
    { id: "groupInvite", label: "Recieved Group Invite" },
    { id: "raidInvite", label: "Recieved Raid Invite" },
    { id: "mobEnrage", label: "Mob Enraged" },
  ];

  const [checkboxStates, setCheckboxStates] = useState({});
  const [trackerOverlayLock, settrackerOverlayLock] = useState({});

  const handleTrackerCheckboxChange = async (checked) => {
    window.electron.ipcRenderer.send("storeSet", "tracker", checked);
    const tracker = await window.electron.ipcRenderer.invoke("storeGet", "tracker");
    setCheckboxStates({ ...checkboxStates, ["tracker"]: checked });
    settrackerOverlayLock(tracker);
    if (checked) {
      window.electron.ipcRenderer.send("open-tracker-overlay-window");
    } else {
      window.electron.ipcRenderer.send("close-tracker-overlay-window");
    }
  };

  useEffect(() => {
    const fetchStoredValues = async () => {
      let newState = {};
      for (const checkbox of checkboxes) {
        const value = await window.electron.ipcRenderer.invoke("storeGet", checkbox.id);
        newState[checkbox.id] = value || false;
      }
      const trackerValue = await window.electron.ipcRenderer.invoke("storeGet", "tracker");
      const trackerLockValue = await window.electron.ipcRenderer.invoke("storeGet", "trackerOverlayLock");
      newState["tracker"] = trackerValue || false;
      newState["trackerOverlayLock"] = trackerLockValue || false;
      setCheckboxStates(newState);
    };

    fetchStoredValues();
  }, []);

  const handleCheckboxChange = (id, checked) => {
    setCheckboxStates({ ...checkboxStates, [id]: checked });
    window.electron.ipcRenderer.send("storeSet", id, checked);

    if (id === "trackerOverlayLock") {
      if (checked) {
        window.electron.ipcRenderer.send("lock-overlay-tracker");
      } else {
        window.electron.ipcRenderer.send("unlock-overlay-tracker");
      }
    }
  };

  return (
    <div className="alerts">
      <h3>Alerts</h3>
      {checkboxes.map(({ id, label }) => (
        <Checkbox key={id} id={id} label={label} checked={checkboxStates[id] || false} onCheckChange={(checked) => handleCheckboxChange(id, checked)} />
      ))}
      <hr />
      <h3>Options</h3>
      <div className="actions">
        <Checkbox key={"tracker"} id={"tracker"} label={"Visual Tracker"} checked={checkboxStates["tracker"] || false} onCheckChange={(checked) => handleTrackerCheckboxChange(checked)} />
        {trackerOverlayLock && (
          <Checkbox
            key={"trackerOverlayLock"}
            id={"trackerOverlayLock"}
            label={"Lock Tracker Overlay"}
            checked={checkboxStates["trackerOverlayLock"] || false}
            onCheckChange={(checked) => handleCheckboxChange("trackerOverlayLock", checked)}
          />
        )}
      </div>
    </div>
  );
}

export default Alerts;
