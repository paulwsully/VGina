import React, { useState, useRef } from "react";
import NewTrigger from "./NewTrigger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

function Trigger({ trigger, refreshTriggers }) {
  const [isSelected, setIsSelected] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const confirmTimer = useRef(null);

  const toggleSelection = () => {
    console.log("toggleSelection");
    setIsSelected(!isSelected);
  };

  const handleNewTriggerClick = (event) => {
    event.stopPropagation();
  };

  const handleDeleteClick = async () => {
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

  return (
    <div className={`trigger panel`}>
      <div className="text-primary bold" onClick={toggleSelection}>
        {trigger.triggerName}
      </div>
      <span onClick={toggleSelection}>{trigger.searchText}</span>
      <div className="tags" onClick={toggleSelection}>
        {trigger.tags &&
          trigger.tags.map((tag, index) => (
            <div className="tag pill" key={index}>
              {tag}
            </div>
          ))}
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
