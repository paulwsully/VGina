import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faPlusCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import NewTrigger from "./NewTrigger";
import "./Triggers.scss";

function Triggers() {
  const [triggers, setTriggers] = useState([]);

  useEffect(() => {
    const fetchTriggers = async () => {
      const storedTriggers = await window.electron.ipcRenderer.invoke("storeGet", "triggers");
      if (Array.isArray(storedTriggers)) {
        setTriggers(storedTriggers);
      }
    };

    fetchTriggers();
  }, []);

  const addTrigger = (newTrigger) => {
    setTriggers([...triggers, newTrigger]);
  };
  return (
    <div className="triggers-wrapper">
      <NewTrigger onAddTrigger={addTrigger} />
      <div className="triggers">
        <h3>Triggers</h3>
        {triggers.length === 0 && <div className="null-message">No Triggers. Click "New Trigger" to create one.</div>}
        {triggers.map((trigger) => (
          <div key={trigger.id} className="trigger">
            <div className="text-primary bold">{trigger.triggerName}</div>
            <span>{trigger.searchText}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Triggers;
