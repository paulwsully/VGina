import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Characters from "./Characters";
import Guilds from "./Guilds";
import "./GuildAndCharacters.scss";

function GuildAndCharacters({ user }) {
  if (!user) return <Navigate to="/" replace />;
  const [currentCharacter, setcurrentCharacter] = useState("");

  useEffect(() => {
    const fetchname = async () => {
      const resultName = await window.electron.ipcRenderer.invoke("storeGet", "watchedCharacter");
      setcurrentCharacter(resultName);
    };

    fetchname();
    return () => {};
  }, []);

  return (
    <div className="guild-and-characters-wrapper">
      <Characters user={user} currentCharacter={currentCharacter} />
      <Guilds user={user} currentCharacter={currentCharacter} />
    </div>
  );
}

export default GuildAndCharacters;
