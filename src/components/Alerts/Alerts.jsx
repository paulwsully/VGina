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
  ];

  const [checkboxStates, setCheckboxStates] = useState({});

  useEffect(() => {
    const fetchStoredValues = async () => {
      let newState = {};
      for (const checkbox of checkboxes) {
        const value = await window.electron.ipcRenderer.invoke("storeGet", checkbox.id);
        newState[checkbox.id] = value || false;
      }
      setCheckboxStates(newState);
    };

    fetchStoredValues();
  }, []);

  const handleCheckboxChange = (id, checked) => {
    setCheckboxStates({ ...checkboxStates, [id]: checked });
    window.electron.ipcRenderer.send("storeSet", id, checked);
  };

  return (
    <div className="alerts">
      <h3>Alerts</h3>
      {checkboxes.map(({ id, label }) => (
        <Checkbox key={id} id={id} label={label} checked={checkboxStates[id] || false} onCheckChange={(checked) => handleCheckboxChange(id, checked)} />
      ))}
    </div>
  );
}

export default Alerts;
