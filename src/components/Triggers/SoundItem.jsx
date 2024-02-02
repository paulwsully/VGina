import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import "./SoundItem.scss";

function SoundItem({ soundName, onClick }) {
  const playSound = async (filePath) => {
    try {
      const audioPath = await window.electron.getSoundPath(filePath);
      window.electron.playSound(audioPath);
      console.log(audioPath);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  return (
    <div className="sound-item">
      <div className="play" onClick={() => playSound(soundName)}>
        <FontAwesomeIcon icon={faPlayCircle} />
      </div>
      <div className="sound-name" onClick={() => onClick(soundName)}>
        {soundName.replace(".mp3", "").replace(/-/g, " ")}
      </div>
    </div>
  );
}

export default SoundItem;
