import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faPlusCircle, faTimes, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";
import "./Triggers.scss";
import NewTriggerGeneral from "./NewTriggerGeneral";
import NewTriggerTags from "./NewTriggerTags";
import NewTriggerActions from "./NewTriggerActions";
import Overlay from "../Utilities/Overlay";

const triggerReset = {
  active: false,
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
  tags: [],
};

function NewTrigger({ selectedTrigger, refreshTriggers, triggerUpdateCancelled }) {
  const [showNewTrigger, setShowNewTrigger] = useState(false);
  const [selectedSound, setSelectedSound] = useState("");
  const [selectedTimerExpirationSound, setselectedTimerExpirationSound] = useState("");
  const [soundFiles, setSoundFiles] = useState([]);
  const [newTrigger, setNewTrigger] = useState(triggerReset);
  const [InvalidData, setInvalidData] = useState(false);
  const [tags, setTags] = useState([]);

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
      setShowNewTrigger(true);
    } else {
      resetTrigger();
    }
  }, [selectedTrigger]);

  const handleCheckboxChange = (id, checked) => {
    setNewTrigger({ ...newTrigger, [id]: checked });
    setInvalidData(false);
  };

  const handleTagInputChange = (value) => {
    const newTags = value
      .split(",")
      .filter((tag) => tag.trim() !== "")
      .map((tag) => tag.trim());
    setTags(newTags);
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

  const toggleOpenClose = () => {
    if (!showNewTrigger) {
      setNewTrigger(triggerReset);
    }

    triggerUpdateCancelled();
    resetTrigger();
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

    const triggerData = { ...newTrigger, tags };
    const existingTriggers = (await window.electron.ipcRenderer.invoke("storeGet", "triggers")) || [];
    let triggerToUpdateIndex = existingTriggers.findIndex((trig) => trig.id === triggerData.id);
    if (triggerToUpdateIndex !== -1) {
      existingTriggers[triggerToUpdateIndex] = triggerData;
    } else {
      const newId = triggerData.id || uuidv4();
      existingTriggers.push({ ...triggerData, id: newId });
    }
    await window.electron.ipcRenderer.send("storeSet", "triggers", existingTriggers);
    const existingTags = (await window.electron.ipcRenderer.invoke("storeGet", "tags")) || [];
    const updatedTags = Array.from(new Set([...existingTags, ...tags]));
    await window.electron.ipcRenderer.send("storeSet", "tags", updatedTags);

    await refreshTriggers();
    resetTrigger();
    setShowNewTrigger(false);

    toggleOpenClose();
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
    <div className={`new-trigger-container`}>
      <div className="trigger-actions">
        {!showNewTrigger && !selectedTrigger && (
          <div className="new-trigger-icon" onClick={toggleOpenClose}>
            <FontAwesomeIcon icon={faPlusCircle} /> New Trigger
          </div>
        )}
      </div>
      {InvalidData && <div className="error">Please fill in all required fields and select at least one action.</div>}
      {showNewTrigger && (
        <Overlay toggleOpenClose={toggleOpenClose}>
          <div className={`new-trigger`}>
            <div className="actions">
              <div className="pill button" onClick={handleSaveNewTrigger}>
                <FontAwesomeIcon icon={faFloppyDisk} /> Save
              </div>

              <div className="pill button error" onClick={toggleOpenClose}>
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </div>
            </div>
            <NewTriggerGeneral newTrigger={newTrigger} handleInputChange={handleInputChange} handleCheckboxChange={handleCheckboxChange} />
            <NewTriggerTags tags={newTrigger.tags} handleTagInputChange={handleTagInputChange} />
            <hr />
            <NewTriggerActions
              newTrigger={newTrigger}
              soundFiles={soundFiles}
              selectedSound={selectedSound}
              selectedTimerExpirationSound={selectedTimerExpirationSound}
              handleCheckboxChange={(id, checked) => handleCheckboxChange(id, checked)}
              handleInputChange={(id, value) => handleInputChange(id, value)}
              handleSoundItemClick={handleSoundItemClick}
              handleTimerExpirationSoundItemClick={handleTimerExpirationSoundItemClick}
              playSound={playSound}
            />
          </div>
        </Overlay>
      )}
    </div>
  );
}

export default NewTrigger;
