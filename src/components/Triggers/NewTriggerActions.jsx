import React from "react";
import Checkbox from "../Utilities/Checkbox";
import Input from "../Utilities/Input";
import SoundItem from "./SoundItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";

const NewTriggerActions = ({
  newTrigger,
  soundFiles,
  selectedSound,
  selectedTimerExpirationSound,
  handleCheckboxChange,
  handleInputChange,
  handleSoundItemClick,
  handleTimerExpirationSoundItemClick,
  playSound,
}) => (
  <section>
    <h3>Actions</h3>
    <div className={`panel ${newTrigger.saySomething ? "" : "inactive"}`}>
      <Checkbox id="saySomething" label="Say something" checked={newTrigger.saySomething} onCheckChange={(checked) => handleCheckboxChange("saySomething", checked)} />
      {newTrigger.saySomething && <Input id="speechText" value={newTrigger.speechText} placeholder="" label="Say..." onTextChange={(value) => handleInputChange("speechText", value)} />}
    </div>
    <div className={`panel ${newTrigger.playSound ? "" : "inactive"}`}>
      <div className="sounds-header">
        <Checkbox id="playSound" label="Play a sound" checked={newTrigger.playSound} onCheckChange={(checked) => handleCheckboxChange("playSound", checked)} />

        {selectedSound && (
          <span className="pill sound-pill">
            <div className="play" onClick={() => playSound(newTrigger.sound)}>
              <FontAwesomeIcon icon={faPlayCircle} />
            </div>
            {selectedSound.replace(".mp3", "").replace(/-/g, " ")}
          </span>
        )}
      </div>
      {newTrigger.playSound && (
        <div className="sound-list">
          {soundFiles.map((file) => (
            <SoundItem key={file} soundName={file} onClick={() => handleSoundItemClick(file)} selected={file === selectedSound} />
          ))}
        </div>
      )}
    </div>
    <div className={`panel ${newTrigger.setTimer ? "" : "inactive"}`}>
      <Checkbox id="setTimer" label="Set Timer" checked={newTrigger.setTimer} onCheckChange={(checked) => handleCheckboxChange("setTimer", checked)} />
      {newTrigger.setTimer && (
        <div>
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
              <span className="pill sound-pill">
                <div className="play" onClick={() => playSound(newTrigger.timerExpirationSound)}>
                  <FontAwesomeIcon icon={faPlayCircle} />
                </div>
                {selectedTimerExpirationSound.replace(".mp3", "").replace(/-/g, " ")}
              </span>
            )}
          </div>
          {newTrigger.doTimerExpirationSound && (
            <div className="sound-list">
              {soundFiles.map((file) => (
                <SoundItem key={file} soundName={file} onClick={() => handleTimerExpirationSoundItemClick(file)} selected={file === selectedTimerExpirationSound} />
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
            <Input
              id="timerExpirationVocalCountdownStart"
              type="number"
              value={newTrigger.timerExpirationVocalCountdownStart === 0 ? "" : newTrigger.timerExpirationVocalCountdownStart}
              placeholder=" "
              label="Start at (seconds)"
              onTextChange={(value) => handleInputChange("timerExpirationVocalCountdownStart", value)}
            />
          )}
        </div>
      )}
    </div>
  </section>
);

export default NewTriggerActions;
