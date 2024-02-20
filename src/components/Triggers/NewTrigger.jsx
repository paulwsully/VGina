import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle, faFloppyDisk, faPlusCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";
import Checkbox from "../Utilities/Checkbox";
import Input from "../Utilities/Input";
import SoundItem from "./SoundItem";
import "./Triggers.scss";

const triggerReset = {
  saySomething: false,
  playSound: false,
  triggerName: "",
  searchText: "",
  searchRegex: false,
  speechText: "",
  sound: "",
  setTimer: false,
  timerHours: 0,
  timerMinutes: 0,
  timerSeconds: 0,
  doTimerExpirationSound: false,
  timerExpirationSound: "",
  doTimerExpirationVocalCountdown: false,
  timerExpirationVocalCountdownStart: 0,
};

function NewTrigger({ selectedTrigger, refreshTriggers, triggerUpdateCancelled }) {
  const [showNewTrigger, setShowNewTrigger] = useState(false);
  const [isCancelConfirm, setIsCancelConfirm] = useState(false);
  const [selectedSound, setSelectedSound] = useState("");
  const [selectedTimerExpirationSound, setselectedTimerExpirationSound] = useState("");
  const [soundFiles, setSoundFiles] = useState([]);
  const [newTrigger, setNewTrigger] = useState(triggerReset);
  const [InvalidData, setInvalidData] = useState(false);

  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send("get-sound-files");
      window.electron.ipcRenderer.on("sound-files", (files) => {
        setSoundFiles(files);
      });
    }

    return () => {
      window.electron.ipcRenderer.removeAllListeners("sound-files");
    };
  }, []);

  useEffect(() => {
    if (selectedTrigger) {
      setNewTrigger(selectedTrigger);
      setSelectedSound(selectedTrigger.sound);
      setselectedTimerExpirationSound(selectedTrigger.timerExpirationSound);
      setShowNewTrigger(true); // Automatically expand the NewTrigger form
    } else {
      resetTrigger(); // Resets to default if no trigger is selected
    }
  }, [selectedTrigger]);

  const handleCheckboxChange = (id, checked) => {
    setNewTrigger({ ...newTrigger, [id]: checked });
    setInvalidData(false);
  };

  const handleInputChange = (id, value) => {
    setInvalidData(false);
    if (id === "timerSeconds" || id === "timerMinutes" || id === "timerHours") {
      let newValue = value === "" ? 0 : parseInt(value, 10);
      if (isNaN(newValue)) newValue = 0;

      switch (id) {
        case "timerSeconds":
          if (newValue >= 60) {
            const minutesFromSeconds = Math.floor(newValue / 60);
            newValue %= 60;
            setNewTrigger((prevState) => ({
              ...prevState,
              timerSeconds: newValue,
              timerMinutes: prevState.timerMinutes + minutesFromSeconds,
            }));
          } else {
            setNewTrigger((prevState) => ({ ...prevState, [id]: newValue }));
          }
          break;
        case "timerMinutes":
          if (newValue >= 60) {
            const hoursFromMinutes = Math.floor(newValue / 60);
            newValue %= 60;
            setNewTrigger((prevState) => ({
              ...prevState,
              timerMinutes: newValue,
              timerHours: prevState.timerHours + hoursFromMinutes,
            }));
          } else {
            setNewTrigger((prevState) => ({ ...prevState, [id]: newValue }));
          }
          break;
        case "timerHours":
          setNewTrigger((prevState) => ({ ...prevState, [id]: newValue }));
          break;
      }
    } else {
      setNewTrigger((prevState) => ({ ...prevState, [id]: value }));
    }
  };

  const handleSoundItemClick = (soundName) => {
    setSelectedSound(soundName);
    setNewTrigger({ ...newTrigger, sound: soundName });
  };

  const handleTimerExpirationSoundItemClick = (soundName) => {
    setselectedTimerExpirationSound(soundName);
    setNewTrigger({ ...newTrigger, timerExpirationSound: soundName });
  };

  const handleNewTriggerClick = () => {
    if (!showNewTrigger) {
      setNewTrigger(triggerReset);
    }
    setShowNewTrigger(!showNewTrigger);
  };

  const isActionValid = () => {
    if (newTrigger.saySomething && !newTrigger.speechText) return false;
    if (newTrigger.playSound && !newTrigger.sound) return false;
    if (newTrigger.setTimer && newTrigger.timerHours === 0 && newTrigger.timerMinutes === 0 && newTrigger.timerSeconds === 0) return false;
    return newTrigger.saySomething || newTrigger.playSound || newTrigger.setTimer;
  };

  const handleSaveNewTrigger = async () => {
    if (!newTrigger.triggerName || !newTrigger.searchText || !isActionValid()) {
      setInvalidData(true);
      return;
    }

    const existingTriggers = (await window.electron.ipcRenderer.invoke("storeGet", "triggers")) || [];
    let triggerToUpdateIndex = existingTriggers.findIndex((trig) => trig.id === newTrigger.id);

    if (triggerToUpdateIndex !== -1) {
      existingTriggers[triggerToUpdateIndex] = newTrigger;
    } else {
      const newId = newTrigger.id || uuidv4();
      existingTriggers.push({ ...newTrigger, id: newId });
    }

    window.electron.ipcRenderer.send("storeSet", "triggers", existingTriggers);
    await refreshTriggers();
    resetTrigger();
    setShowNewTrigger(false);
  };

  const handleCancelClick = () => {
    if (isCancelConfirm || Object.values(newTrigger).every((value) => !value)) {
      resetTrigger();
      setShowNewTrigger(false);
      setIsCancelConfirm(false);
      triggerUpdateCancelled();
    } else {
      setIsCancelConfirm(true);
    }
  };

  const resetTrigger = () => {
    setNewTrigger(triggerReset);
    setSelectedSound("");
  };

  const playSound = (filePath) => {
    const audio = new Audio(`./sounds/${filePath}`);
    audio.play();
  };
  return (
    <div className={`new-trigger-container ${showNewTrigger ? "show" : ""}`}>
      <div className="trigger-actions">
        {!showNewTrigger && !selectedTrigger && (
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
            {isCancelConfirm ? "This will erase any changes. Continue?" : " Cancel"}
          </div>
        )}
      </div>
      {InvalidData && <div className="error">Please fill in all required fields and select at least one action.</div>}
      <div className={`new-trigger`}>
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
            {newTrigger.saySomething && <Input id="speechText" value={newTrigger.speechText} placeholder="" label="Say..." onTextChange={(value) => handleInputChange("speechText", value)} />}
          </div>
          <div className={`panel ${newTrigger.playSound ? "" : "inactive"}`}>
            <div className="sounds-header">
              <Checkbox id="playSound" label="Play a sound" checked={newTrigger.playSound} onCheckChange={(checked) => handleCheckboxChange("playSound", checked)} />
              {newTrigger.playSound && newTrigger.sound && (
                <span className="pill">
                  <div className="play" onClick={() => playSound(newTrigger.sound)}>
                    <FontAwesomeIcon icon={faPlayCircle} />
                  </div>
                  {selectedSound.replace(".mp3", "").replace(/-/g, " ")}
                </span>
              )}
            </div>
            {newTrigger.playSound && (
              <div className="sound-list">
                {soundFiles.map((file, index) => (
                  <SoundItem key={file} soundName={file} onClick={handleSoundItemClick} />
                ))}
              </div>
            )}
          </div>
          <div className={`panel ${newTrigger.setTimer ? "" : "inactive"}`}>
            <Checkbox id="setTimer" label="Set Timer" checked={newTrigger.setTimer} onCheckChange={(checked) => handleCheckboxChange("setTimer", checked)} />
            {newTrigger.setTimer && (
              <>
                <div className="input-row timer-fields">
                  <Input
                    id="timerHours"
                    type="number"
                    value={newTrigger.timerHours === 0 ? "" : newTrigger.timerHours}
                    placeholder=" "
                    label="HH"
                    onTextChange={(value) => handleInputChange("timerHours", value)}
                  />
                  <Input
                    id="timerMinutes"
                    type="number"
                    value={newTrigger.timerMinutes === 0 ? "" : newTrigger.timerMinutes}
                    placeholder=" "
                    label="MM"
                    onTextChange={(value) => handleInputChange("timerMinutes", value)}
                  />
                  <Input
                    id="timerSeconds"
                    type="number"
                    value={newTrigger.timerSeconds === 0 ? "" : newTrigger.timerSeconds}
                    placeholder=" "
                    label="SS"
                    onTextChange={(value) => handleInputChange("timerSeconds", value)}
                  />
                </div>
                <h4>Expiration Action</h4>
                <div className="sounds-header">
                  <Checkbox
                    id="doTimerExpirationSound"
                    label="Play a sound"
                    checked={newTrigger.doTimerExpirationSound}
                    onCheckChange={(checked) => handleCheckboxChange("doTimerExpirationSound", checked)}
                  />
                  {newTrigger.doTimerExpirationSound && newTrigger.timerExpirationSound && (
                    <span className="pill">
                      <div className="play" onClick={() => playSound(newTrigger.timerExpirationSound)}>
                        <FontAwesomeIcon icon={faPlayCircle} />
                      </div>
                      {selectedTimerExpirationSound.replace(".mp3", "").replace(/-/g, " ")}
                    </span>
                  )}
                </div>
                {newTrigger.doTimerExpirationSound && (
                  <div className="sound-list">
                    {soundFiles.map((file, index) => (
                      <SoundItem key={file} soundName={file} onClick={handleTimerExpirationSoundItemClick} />
                    ))}
                  </div>
                )}

                <Checkbox
                  id="doTimerExpirationVocalCountdown"
                  label="Vocal countdown"
                  checked={newTrigger.doTimerExpirationVocalCountdown}
                  onCheckChange={(checked) => handleCheckboxChange("doTimerExpirationVocalCountdown", checked)}
                />
                {newTrigger.doTimerExpirationVocalCountdown && (
                  <div className="input-row timer-fields">
                    Start counting down at:
                    <Input
                      id="timerExpirationVocalCountdownStart"
                      type="number"
                      value={newTrigger.timerExpirationVocalCountdownStart === 0 ? "" : newTrigger.timerExpirationVocalCountdownStart}
                      placeholder=" "
                      label="sec"
                      onTextChange={(value) => handleInputChange("timerExpirationVocalCountdownStart", value)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default NewTrigger;
