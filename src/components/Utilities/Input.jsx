import React, { useState, useEffect } from "react";
import "./Input.scss";

const Input = ({ id, placeholder, value, label, onTextChange, large, onEnter, list, type }) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyUp = (e) => {
    if (e.key === "Enter") {
      onTextChange(inputValue);
      onEnter?.(inputValue);
      setInputValue("");
    }
  };

  const handleBlur = () => {
    onTextChange(inputValue);
    setInputValue("");
  };

  return (
    <label htmlFor={id} className={`input ${large ? "input-large" : ""}`}>
      <input type={type} id={id} value={inputValue || ""} placeholder={placeholder} onChange={handleChange} onKeyUp={handleKeyUp} onBlur={handleBlur} list={list} />
      <span>{label}</span>
    </label>
  );
};

export default Input;
