import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import "./SoundItem.scss";

function SoundItem({ soundName, onClick }) {
  const playSound = (filePath) => {
    const audio = new Audio(`./sounds/${filePath}`);
    audio.play();
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
