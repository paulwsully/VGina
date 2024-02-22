import React, { useState } from "react";
import NewTrigger from "./NewTrigger";

function Trigger({ trigger, refreshTriggers }) {
  const [isSelected, setIsSelected] = useState(false);

  const toggleSelection = () => {
    console.log("toggleSelection");
    setIsSelected(!isSelected);
  };

  const handleNewTriggerClick = (event) => {
    event.stopPropagation();
  };

  return (
    <div className={`trigger`} onClick={toggleSelection}>
      <div className="text-primary bold">{trigger.triggerName}</div>
      <span>{trigger.searchText}</span>
      <div className="tags">
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
    </div>
  );
}

export default Trigger;
