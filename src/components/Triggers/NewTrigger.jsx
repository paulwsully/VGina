import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faPlusCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";
import Checkbox from "../Utilities/Checkbox";
import Input from "../Utilities/Input";
import SoundItem from "./SoundItem";
import "./Triggers.scss";

function NewTrigger({ onAddTrigger }) {
  const [showNewTrigger, setShowNewTrigger] = useState(false);
  const [isCancelConfirm, setIsCancelConfirm] = useState(false);
  const [newTrigger, setNewTrigger] = useState({
    saySomething: false,
    playSound: false,
    triggerName: "",
    searchText: "",
    searchRegex: false,
    speechText: "",
  });

  const handleCheckboxChange = (id, checked) => {
    setNewTrigger({ ...newTrigger, [id]: checked });
  };

  const handleInputChange = (id, value) => {
    setNewTrigger({ ...newTrigger, [id]: value });
  };

  const handleSoundItemClick = (soundName) => {
    console.log("Sound item clicked:", soundName);
  };

  const handleNewTriggerClick = () => {
    setShowNewTrigger(!showNewTrigger);
  };

  const handleSaveNewTrigger = async () => {
    const existingTriggers = await window.electron.ipcRenderer.invoke("storeGet", "triggers");
    const triggers = Array.isArray(existingTriggers) ? existingTriggers : [];
    const triggerId = newTrigger.id || uuidv4();
    const updatedTriggers = triggers.filter((trig) => trig.id !== triggerId);
    const triggerToSave = { ...newTrigger, id: triggerId };
    const triggerWithId = { ...newTrigger, id: uuidv4() };
    onAddTrigger(triggerWithId);
    updatedTriggers.push(triggerToSave);

    window.electron.ipcRenderer.send("storeSet", "triggers", updatedTriggers);
    resetTrigger();
    setShowNewTrigger(false);
  };

  const handleCancelClick = () => {
    if (isCancelConfirm || Object.values(newTrigger).every((value) => !value)) {
      resetTrigger();
      setShowNewTrigger(false);
      setIsCancelConfirm(false);
    } else {
      setIsCancelConfirm(true);
    }
  };

  const resetTrigger = () => {
    setNewTrigger({
      saySomething: false,
      playSound: false,
      triggerName: "",
      searchText: "",
      searchRegex: false,
      speechText: "",
    });
  };
  return (
    <div className="new-trigger-container">
      <div className="trigger-actions">
        {!showNewTrigger && (
          <div className="pill button" onClick={handleNewTriggerClick}>
            <FontAwesomeIcon icon={faPlusCircle} /> New Trigger
          </div>
        )}
        {showNewTrigger && (
          <div className="pill button" onClick={handleSaveNewTrigger}>
            <FontAwesomeIcon icon={faFloppyDisk} /> Save
          </div>
        )}
        {showNewTrigger && (
          <div className="pill button error" onClick={handleCancelClick}>
            <FontAwesomeIcon icon={faTimes} />
            {isCancelConfirm ? " This will erase this new Trigger. Continue?" : " Cancel"}
          </div>
        )}
      </div>
      <div className={`new-trigger ${showNewTrigger ? "show" : ""}`}>
        <section>
          <h3>General</h3>
          <Input id="triggerName" value={newTrigger.triggerName} placeholder="" label="Trigger Name" onTextChange={(value) => handleInputChange("triggerName", value)} />
          <Input id="searchText" value={newTrigger.searchText} placeholder="" label="Search Text" onTextChange={(value) => handleInputChange("searchText", value)} />
          <Checkbox id="searchRegex" label="Use Regex" checked={newTrigger.searchRegex} onCheckChange={(checked) => handleCheckboxChange("searchRegex", checked)} />
        </section>
        <hr />
        <section>
          <h3>Actions</h3>
          <div className={`panel ${newTrigger.saySomething ? "" : "inactive"}`}>
            <Checkbox id="saySomething" label="Say something" checked={newTrigger.saySomething} onCheckChange={(checked) => handleCheckboxChange("saySomething", checked)} />
            {newTrigger.saySomething && <Input id="speechText" placeholder="" label="Say..." onTextChange={(value) => handleInputChange("speechText", value)} />}
          </div>
          <div className={`panel ${newTrigger.playSound ? "" : "inactive"}`}>
            <Checkbox id="playSound" label="Play a sound" checked={newTrigger.playSound} onCheckChange={(checked) => handleCheckboxChange("playSound", checked)} />
            {newTrigger.playSound && (
              <div className="sound-list">
                <SoundItem soundName="50 dkp minus" onClick={handleSoundItemClick} />
              </div>
            )}
          </div>
        </section>
        <hr />
      </div>
    </div>
  );
}

export default NewTrigger;
