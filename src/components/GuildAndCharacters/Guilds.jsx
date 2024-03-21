import React, { useState, useEffect } from "react";
import { ref, push, set, get, child } from "firebase/database";
import database from "../../../firebaseConfig";
import Input from "../Utilities/Input";

function Guilds({ user }) {
  const [creatingGuild, setcreatingGuild] = useState(false); // Corrected function name casing
  const [joiningGuild, setJoiningGuild] = useState(false);
  const [guildName, setGuildName] = useState("");
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [currentGuild, setCurrentGuild] = useState(null); // Added state for current guild
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
      {currentGuild ? (
        <div className="guild-wrapper">
          <h2>{currentGuild.name}</h2>
          <div className="guild-details">
            <div className="members">
              <div className="guild-invite">
                <div className="pill">Invite Members</div>
              </div>
              {console.log(currentGuild)}
              <div className="guild-leaders">
                <h4>Guild Leaders ({currentGuild.leaders?.length})</h4>
                {currentGuild.leaders?.length > 0 &&
                  currentGuild.leaders.map((leader) => {
                    return <div key={leader.id}>{leader.name}</div>;
                  })}
              </div>
              <div className="guild-officers">
                <h4>Guild Officers ({currentGuild.officers?.length})</h4>
                {currentGuild.officers?.length > 0 &&
                  currentGuild.officers.map((officer) => {
                    return <div key={officer.id}>{officer.name}</div>;
                  })}
              </div>
              <div className="guild-members">
                <h4>All Members ({currentGuild.members?.length})</h4>
                {currentGuild.members?.length > 0 &&
                  currentGuild.members.map((member) => {
                    return <div key={member.id}>{member.name}</div>;
                  })}
              </div>
            </div>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}

export default Guilds;
