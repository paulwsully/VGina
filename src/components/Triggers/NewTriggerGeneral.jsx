import React from "react";
import Input from "../Utilities/Input";
import Checkbox from "../Utilities/Checkbox";

function NewTriggerGeneral({ newTrigger, handleInputChange, handleCheckboxChange }) {
  return (
    <section>
      <Input large id="triggerName" value={newTrigger.triggerName || ""} placeholder="" label="Trigger Name" onTextChange={(value) => handleInputChange("triggerName", value)} />
      <Input id="searchText" value={newTrigger.searchText || ""} placeholder="" label="Search Text" onTextChange={(value) => handleInputChange("searchText", value)} />
      <Checkbox id="searchRegex" label="Use Regex" checked={newTrigger.searchRegex} onCheckChange={(value) => handleCheckboxChange("searchRegex", value)} />
    </section>
  );
}

export default NewTriggerGeneral;
