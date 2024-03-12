import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

const Overlay = ({ children, toggleOpenClose }) => {
  return (
    <div className="new-trigger-overlay">
      <div className="new-trigger-close" onClick={toggleOpenClose}>
        <FontAwesomeIcon icon={faTimes} />
      </div>
      {children}
    </div>
  );
};

export default Overlay;
