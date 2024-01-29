import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import "./SoundItem.scss"; // Assuming the styles are here

const SoundItem = ({ soundName, onClick }) => (
  <div className="sound-item">
    <div className="play">
      <FontAwesomeIcon icon={faPlayCircle} />
    </div>
    <div className="sound-name" onClick={() => onClick(soundName)}>
      {soundName}
    </div>
  </div>
);

export default SoundItem;
