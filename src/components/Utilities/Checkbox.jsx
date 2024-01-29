import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import "./Checkbox.scss";

const Checkbox = ({ id, label, checked, onCheckChange }) => (
  <label htmlFor={id} className="checkbox">
    <input id={id} type="checkbox" name={id} checked={checked} onChange={(e) => onCheckChange(e.target.checked)} />
    <span>
      <FontAwesomeIcon icon={faCheck} />
    </span>{" "}
    {label}
  </label>
);

export default Checkbox;
