import React from "react";
import "./Input.scss";

const Input = ({ id, placeholder, value, label, onTextChange }) => (
  <label htmlFor={id} className="input">
    <input type="text" id={id} value={value} placeholder={placeholder} onChange={(e) => onTextChange(e.target.value)} />
    <span>{label}</span>
  </label>
);

export default Input;
