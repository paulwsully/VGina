import React, { useState, useEffect } from "react";
import { ref, push, set, get, child } from "firebase/database";
import database from "../../../firebaseConfig";
import Input from "../Utilities/Input";

function Guilds({ user }) {
  const [creatingGuild, setcreatingGuild] = useState(false);
  const [joiningGuild, setjoiningGuild] = useState(false);
  const [guildName, setGuildName] = useState("");
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (creatingGuild) {
      setLoadingCharacters(true);
      get(child(ref(database), `users/${user.uid}/characters`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            setCharacters(Object.values(snapshot.val()));
          } else {
            setCharacters([]);
          }
        })
        .catch((error) => {
          console.error("Error fetching characters: ", error);
          setError("Error fetching characters");
        })
        .finally(() => {
          setLoadingCharacters(false);
        });
    }
  }, [creatingGuild, user.uid]);

  const handleSaveNewGuild = () => {
    if (creatingGuild && selectedCharacter) {
      const newGuildRef = push(ref(database, "guilds"));
      const timestamp = Date.now();
      const guildData = {
        name: guildName,
        id: newGuildRef.key,
        server: "",
        leaders: [
          {
            name: selectedCharacter.name,
            id: selectedCharacter.id,
          },
        ],
        officers: [],
        members: [
          {
            name: selectedCharacter.name,
            id: selectedCharacter.id,
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
      };

      set(newGuildRef, guildData)
        .then(() => {
          console.log("Guild saved successfully!");
          const characterRef = ref(database, `users/${user.uid}/characters/${selectedCharacter.id}`);
          return set(characterRef, { ...selectedCharacter, guild: { id: newGuildRef.key, name: guildName } });
        })
        .then(() => {
          console.log("Character updated successfully with new guild info.");
        })
        .catch((error) => {
          console.error("Error saving guild or updating character: ", error);
        });
    }
  };

  const handleCancel = () => {
    setcreatingGuild(false);
    setjoiningGuild(false);
  };

  const handleInputChange = (name, value) => {
    if (name === "name") {
      setGuildName(value);
    }
  };

  const handleCreateGuild = () => {
    setcreatingGuild(true);
  };

  const handleJoinGuild = () => {
    setjoiningGuild(true);
  };

  return (
    <div className="guild-container">
      <div className="no-guild">
        {(joiningGuild || creatingGuild) && <Input id="guildName" placeholder="" label={creatingGuild ? "New Guild Name" : "Search guild names..."} onTextChange={(value) => handleInputChange("name", value)} />}
        {creatingGuild && (
          <>
            <select id="character-select" value={selectedCharacter.id} onChange={(e) => setSelectedCharacter(characters.find((character) => character.id === e.target.value))} disabled={loadingCharacters}>
              <option value="">Guild leader...</option>
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </>
        )}
        {!joiningGuild && !creatingGuild && <div className="null-message">It looks like you're not in a guild</div>}
        {!joiningGuild && !creatingGuild && (
          <div className="guild-actions">
            <div className="pill" onClick={handleJoinGuild}>
              Join a Guild
            </div>
            <div className="pill" onClick={handleCreateGuild}>
              Create a Guild
            </div>
          </div>
        )}
        {(creatingGuild || joiningGuild) && (
          <div className="guild-actions">
            {creatingGuild && (
              <div className="pill" onClick={handleSaveNewGuild}>
                Save
              </div>
            )}
            {joiningGuild && (
              <div className="pill" onClick={handleJoinGuild}>
                Join
              </div>
            )}
            <div className="pill error" onClick={handleCancel}>
              Cancel
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Guilds;
