import React from "react";
import Input from "../Utilities/Input";
import Checkbox from "../Utilities/Checkbox";

const NewTriggerGeneral = ({ newTrigger, handleInputChange, handleCheckboxChange }) => (
  <section>
    <h3>General</h3>
    <Input id="triggerName" value={newTrigger.triggerName || ""} placeholder="" label="Trigger Name" onTextChange={handleInputChange} />
    <Input id="searchText" value={newTrigger.searchText || ""} placeholder="" label="Search Text" onTextChange={handleInputChange} />
    <Checkbox id="searchRegex" label="Use Regex" checked={newTrigger.searchRegex} onCheckChange={handleCheckboxChange} />
  </section>
);

export default NewTriggerGeneral;
