import React from "react";
import "./Input.scss";

const Input = ({ id, placeholder, value, label, onTextChange, large, onEnter }) => {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onEnter(e.target.value);
    }
  };

  return (
    <label htmlFor={id} className={`input ${large ? "input-large" : ""}`}>
      <input
        type="text"
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyUp={handleKeyPress} // Add the onKeyPress event here
      />
      <span>{label}</span>
    </label>
  );
};

export default Input;
