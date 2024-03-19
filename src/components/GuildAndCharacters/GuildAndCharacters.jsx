import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { ref, push, set, get } from "firebase/database";
import database from "../../../firebaseConfig";
import Input from "../Utilities/Input";
import "./GuildAndCharacters.scss";

function GuildAndCharacters({ user }) {
  const [guild, setGuild] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [showPills, setShowPills] = useState(true);
  const [guildName, setGuildName] = useState("");
  const [joinGuild, setJoinGuild] = useState(false);
  const [createGuild, setCreateGuild] = useState(false);
  const [characterName, setcharacterName] = useState("");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const fetchname = async () => {
      const resultName = await window.electron.ipcRenderer.invoke("storeGet", "watchedCharacter");
      setcharacterName(resultName);
    };

    fetchname();
    return () => {};
  }, []);

  const handleCreateGuildClick = () => {
    setShowInput(true);
    setShowPills(false);
    setCreateGuild(true);
    setJoinGuild(false);
  };

  const handleJoinGuildClick = () => {
    setShowInput(true);
    setShowPills(false);
    setJoinGuild(true);
    setCreateGuild(false);
  };

  const handleInputChange = (name, value) => {
    if (name === "name") {
      setGuildName(value);
    }
  };

  const handleCancelClick = () => {
    setShowInput(false);
    setShowPills(true);
    setJoinGuild(false);
    setCreateGuild(false);
  };

  const handleSaveClick = () => {
    if (createGuild) {
      const newGuildRef = push(ref(database, "guilds"));
      const timestamp = Date.now();
      set(newGuildRef, {
        name: guildName,
        id: newGuildRef.key,
        server: "",
        leaders: [characterName],
        officers: [],
        members: [
          {
            name: characterName,
            id: user.uid, // This should be a characters ID. Not the users ID
            joined: timestamp,
            rank: "Leader",
          },
        ],
        createdAt: timestamp,
        lootRules: {
          dkp: true,
          lootCouncil: false,
          openBid: false,
          secondHighestPlusOne: false,
        },
      })
        .then(() => {
          console.log("Guild saved successfully!");
        })
        .catch((error) => {
          console.error("Error saving guild: ", error);
        });
    }
  };

  return (
    <div className="guild-and-characters-wrapper">
      <div className="characters-container">Characters</div>
      <div className="guild-container">
        {guild ? (
          <div className="guild">
            <div className="guild-name">{guild.name}</div>
          </div>
        ) : (
          <div className="no-guild">
            {!showInput && <div className="null-message">It looks like you're not in a guild</div>}
            {showInput && <Input id="guildName" placeholder="Guild Name" label="" onTextChange={(value) => handleInputChange("name", value)} />}
            {showPills && (
              <div className="guild-actions">
                <div className="pill" onClick={handleJoinGuildClick}>
                  Join a Guild
                </div>
                <div className="pill" onClick={handleCreateGuildClick}>
                  Create a Guild
                </div>
              </div>
            )}
            {showInput && (
              <div className="guild-actions">
                <div className="pill" onClick={handleSaveClick}>
                  Save
                </div>
                <div className="pill" onClick={handleCancelClick}>
                  Cancel
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GuildAndCharacters;
