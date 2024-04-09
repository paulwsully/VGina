import React, { useState, useRef } from "react";
import NewTrigger from "./NewTrigger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

function Trigger({ trigger, refreshTriggers }) {
  const [isSelected, setIsSelected] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [toggle, setToggle] = useState(trigger.active);
  const confirmTimer = useRef(null);

  const toggleSelection = () => {
    console.log("toggleSelection");
    setIsSelected(!isSelected);
  };

  const handleNewTriggerClick = (event) => {
    event.stopPropagation();
  };

  const handleDeleteClick = async (event) => {
    event.stopPropagation();
    if (showTooltip) {
      clearTimeout(confirmTimer.current);
      setShowTooltip(false);
      const existingTriggers = (await window.electron.ipcRenderer.invoke("storeGet", "triggers")) || [];
      const updatedTriggers = existingTriggers.filter((t) => t.id !== trigger.id);
      await window.electron.ipcRenderer.send("storeSet", "triggers", updatedTriggers);
      refreshTriggers();
    } else {
      setShowTooltip(true);
      confirmTimer.current = setTimeout(() => {
        setShowTooltip(false);
      }, 2500);
    }
  };

  const toggleActive = async () => {
    const existingTriggers = await window.electron.ipcRenderer.invoke("storeGet", "triggers");
    for (let i = 0; i < existingTriggers.length; i++){
      if (existingTriggers[i].id === trigger.id){
        existingTriggers[i].active = !toggle;
      }
    }
    await window.electron.ipcRenderer.send("storeSet", "triggers", existingTriggers);
    setToggle(!toggle);
  };

  return (
    <div className={`trigger panel`} onClick={toggleSelection}>
      <label className="trigger-toggle">
        <input type="checkbox" checked={toggle} onChange={toggleActive} />
        <span className="trigger-toggle-slider"></span>
      </label>
      <div className="trigger-description">
        <div className="text-primary bold">
        {trigger.triggerName}
        </div>  
        <div>{trigger.searchText}</div>
        <div className="trigger-tags">
          {trigger.tags &&
            trigger.tags.map((tag, index) => (
              <div className="tag pill" key={index}>
                {tag}
              </div>
            ))}
        </div>
      </div>
      {isSelected && (
        <div onClick={handleNewTriggerClick}>
          <NewTrigger key={trigger.id} selectedTrigger={trigger} refreshTriggers={refreshTriggers} triggerUpdateCancelled={toggleSelection} />
        </div>
      )}
      <div className="pill error delete" onClick={handleDeleteClick}>
        <FontAwesomeIcon icon={faTrash} />
        {showTooltip && <>Click again to confirm deletion.</>}
      </div>
    </div>
  );
}

export default Trigger;
