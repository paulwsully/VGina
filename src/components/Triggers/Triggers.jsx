import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import "./Triggers.scss";

function Triggers() {
  return (
    <div className="triggers">
      <h3>General</h3>
      <label htmlFor="" className="input">
        <input type="text" placeholder="" />
        <span>Trigger Name</span>
      </label>
      <label htmlFor="" className="input">
        <input type="text" placeholder="" />
        <span>Text to search for</span>
      </label>
      <label htmlFor="triggerName" className="checkbox">
        <input id="triggerName" type="checkbox" name="triggerName" />
        <span>
          <FontAwesomeIcon icon={faCheck} />
        </span>{" "}
        Use Regex
      </label>
    </div>
  );
}

export default Triggers;
