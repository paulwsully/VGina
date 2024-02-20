import React, { useState } from "react";
import NewTrigger from "./NewTrigger";

function Trigger({ trigger, refreshTriggers }) {
  const [isSelected, setIsSelected] = useState(false);

  const toggleSelection = () => {
    setIsSelected(!isSelected);
  };

  const handleNewTriggerClick = (event) => {
    event.stopPropagation();
  };

  return (
    <div className={`trigger ${isSelected ? "selected" : ""}`} onClick={toggleSelection}>
      <div className="text-primary bold">{trigger.triggerName}</div>
      <span>{trigger.searchText}</span>
      <div className="tags">
        {trigger.tags.map((tag, index) => (
          <div className="tag pill" key={index}>
            {tag}
          </div>
        ))}
      </div>
      {isSelected && (
        <div onClick={handleNewTriggerClick}>
          <NewTrigger key={trigger.id} selectedTrigger={trigger} refreshTriggers={refreshTriggers} triggerUpdateCancelled={() => setIsSelected(false)} />
        </div>
      )}
    </div>
  );
}

export default Trigger;
