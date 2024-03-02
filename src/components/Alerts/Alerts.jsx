import React, { useEffect, useState } from "react";
import Checkbox from "../Utilities/Checkbox";

function Alerts() {
  const alertCheckboxes = [
    { id: "feignDeath", label: "Failed Feign Death" },
    { id: "rootBroke", label: "Mob Unrooted" },
    { id: "resisted", label: "Cast Resisted" },
    { id: "invisFading", label: "Invis Starting to Fade" },
    { id: "tell", label: "Tell Recieved" },
    { id: "groupInvite", label: "Recieved Group Invite" },
    { id: "raidInvite", label: "Recieved Raid Invite" },
    { id: "mobEnrage", label: "Mob Enraged" },
  ];

  const overlayOptions = [
    { id: "showOverlayTracker", label: "Tracker", lockId: "lockOverlayTracker", lockLabel: "Locked" },
    { id: "showOverlayTimers", label: "Timers", lockId: "lockOverlayTimers", lockLabel: "Locked" },
    { id: "showOverlayBids", label: "Bid Taking", lockId: "lockOverlayBids", lockLabel: "Locked" },
    { id: "showOverlayCurrentBids", label: "Live Bids", lockId: "lockOverlayCurrentBids", lockLabel: "Locked" },
  ];

  const [checkboxStates, setCheckboxStates] = useState({});

  useEffect(() => {
    (async () => {
      const newState = {};
      const allCheckboxes = [...alertCheckboxes, ...overlayOptions.flatMap(({ id, lockId }) => [{ id }, { id: lockId }])];
      for (const { id } of allCheckboxes) {
        const value = await window.electron.ipcRenderer.invoke("storeGet", id);
        newState[id] = value ?? false;
      }
      setCheckboxStates(newState);
    })();
  }, []);

  const handleCheckboxChange = async (id, checked) => {
    setCheckboxStates((prev) => ({ ...prev, [id]: checked }));
    window.electron.ipcRenderer.send("storeSet", id, checked);

    if (id.includes("showOverlay")) {
      window.electron.ipcRenderer.send(checked ? `open-${id}-window` : `close-${id}-window`);
    } else if (id.includes("lockOverlay")) {
      window.electron.ipcRenderer.send(checked ? `lock-${id}-window` : `unlock-${id}-window`);
    }
  };

  return (
    <div className="alerts">
      <h3>Alerts</h3>
      {alertCheckboxes.map(({ id, label }) => (
        <Checkbox key={id} id={id} label={label} checked={checkboxStates[id] || false} onCheckChange={(checked) => handleCheckboxChange(id, checked)} />
      ))}
      <hr />
      <h3>Options</h3>
      <h4 className="label">Overlays</h4>
      {overlayOptions.map(({ id, label, lockId, lockLabel }) => (
        <div className="actions" key={id}>
          <Checkbox id={id} label={label} checked={checkboxStates[id] || false} onCheckChange={(checked) => handleCheckboxChange(id, checked)} />
          {checkboxStates[id] && <Checkbox id={lockId} label={lockLabel} checked={checkboxStates[lockId] || false} onCheckChange={(checked) => handleCheckboxChange(lockId, checked)} />}
        </div>
      ))}
    </div>
  );
}

export default Alerts;
