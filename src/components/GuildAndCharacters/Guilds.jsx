import React, { useState, useEffect } from "react";
import { ref, push, set, get, child } from "firebase/database";
import { CurrentGuild } from "./CurrentGuild";
import { guildData } from "./guildData";
import { toast, ToastContainer } from "react-toastify";
import CharacterSelect from "./CharacterSelect";
import database from "../../../firebaseConfig";
import Input from "../Utilities/Input";

function Guilds({ user }) {
  const [creatingGuild, setcreatingGuild] = useState(false);
  const [joiningGuild, setjoiningGuild] = useState(false);
  const [guildName, setGuildName] = useState("");
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [currentGuild, setCurrentGuild] = useState(null);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingCharacters(true);
    get(child(ref(database), `users/${user.uid}/characters`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setCharacters(Object.values(data));

          const guildedCharacter = Object.values(data).find((char) => char.guild);
          if (guildedCharacter) {
            setSelectedCharacter(guildedCharacter);
            return get(ref(database, `guilds/${guildedCharacter.guild.id}`));
          }
        } else {
          setCharacters([]);
        }
      })
      .then((guildSnapshot) => {
        if (guildSnapshot && guildSnapshot.exists()) {
          setCurrentGuild(guildSnapshot.val());
        }
      })
      .catch((error) => {
        console.error("Error fetching characters or guild: ", error);
        setError("Error fetching characters or guild");
      })
      .finally(() => {
        setLoadingCharacters(false);
      });
  }, [user.uid]);

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
      const updatedGuildData = {
        ...guildData,
        name: guildName,
        id: newGuildRef.key,
        createdAt: timestamp,
        leaders: [
          {
            name: selectedCharacter.name,
            id: selectedCharacter.id,
          },
        ],
        members: [
          {
            name: selectedCharacter.name,
            id: selectedCharacter.id,
            joined: timestamp,
            rank: "Leader",
          },
        ],
      };

      set(newGuildRef, updatedGuildData)
        .then(() => {
          console.log("Guild saved successfully!");
          toast.success("Guild Created !", {
            position: "bottom-right",
          });
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
      <ToastContainer />
      {currentGuild ? (
        <CurrentGuild currentGuild={currentGuild} />
      ) : (
        <div className="no-guild">
          {(joiningGuild || creatingGuild) && <Input id="guildName" placeholder="" label={creatingGuild ? "New Guild Name" : "Search guild names..."} onTextChange={(value) => handleInputChange("name", value)} />}
          {creatingGuild && <CharacterSelect id="character-select" value={selectedCharacter.id} onChange={setSelectedCharacter} characters={characters} loadingCharacters={loadingCharacters} />}
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
      )}
    </div>
  );
}

export default Guilds;
