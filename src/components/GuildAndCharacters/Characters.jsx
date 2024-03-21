import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { ref, get, push, set, remove } from "firebase/database";
import database from "../../../firebaseConfig";

function Characters({ user }) {
  const nameInputRef = useRef(null);
  const [characters, setCharacters] = useState([]);
  const [addingCharacter, setAddingCharacter] = useState(false);
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    level: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (addingCharacter) {
      nameInputRef.current.focus();
    }
  }, [addingCharacter]);

  useEffect(() => {
    const charactersRef = ref(database, `users/${user.uid}/characters`);
    get(charactersRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const charactersArray = Object.keys(data).map((key) => ({ ...data[key], id: key }));
          setCharacters(charactersArray);
        } else {
          console.log("No characters found");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [user.uid]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleAddCharacter = () => {
    setError("");
    setSuccess("");

    const characterExists = characters.some((character) => character.name === newCharacter.name);
    if (characterExists) {
      setError("Character already exists");
      return;
    }

    const newCharacterRef = push(ref(database, `users/${user.uid}/characters`));
    const timestamp = Date.now();
    const characterData = {
      ...newCharacter,
      id: newCharacterRef.key,
      createdAt: timestamp,
    };

    set(newCharacterRef, characterData)
      .then(() => {
        setAddingCharacter(false);
        setCharacters((prevCharacters) => [...prevCharacters, characterData]);
        setSuccess("Character created");
        setNewCharacter({ name: "", level: "" });
      })
      .catch((error) => {
        console.error(error);
        setError("Failed to add character");
      });
  };

  const handleDeleteCharacter = (characterId) => {
    const characterRef = ref(database, `users/${user.uid}/characters/${characterId}`);
    remove(characterRef)
      .then(() => {
        setSuccess("Character deleted");
        setCharacters((prevCharacters) => prevCharacters.filter((character) => character.id !== characterId));
      })
      .catch((error) => {
        console.error(error);
        setError("Failed to delete character");
      });
  };

  return (
    <div className="characters-container">
      <div className="input-row">
        <h3>Characters</h3>
        <div className="pointer actions">
          {!addingCharacter && <FontAwesomeIcon onClick={() => setAddingCharacter(true)} icon={faPlusCircle} className="text-primary" />}
          {addingCharacter && (
            <span>
              <FontAwesomeIcon onClick={newCharacter.name && newCharacter.level ? handleAddCharacter : undefined} icon={faCheckCircle} className={`pointer ${newCharacter.name && newCharacter.level ? "text-primary" : "text-primary icon-disabled"}`} />
              <FontAwesomeIcon onClick={() => setAddingCharacter(false)} icon={faTimesCircle} className="text-error pointer" />
            </span>
          )}
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {addingCharacter && (
        <>
          <input ref={nameInputRef} type="text" placeholder="Character Name" value={newCharacter.name} onChange={(e) => setNewCharacter((prev) => ({ ...prev, name: e.target.value }))} onKeyPress={(e) => e.key === "Enter" && newCharacter.name && newCharacter.level && handleAddCharacter()} />
          <input type="number" placeholder="Lvl" value={newCharacter.level} onChange={(e) => setNewCharacter((prev) => ({ ...prev, level: e.target.value }))} onKeyPress={(e) => e.key === "Enter" && newCharacter.name && newCharacter.level && handleAddCharacter()} />
        </>
      )}
      {!addingCharacter && characters.length > 0 && <hr />}
      {characters.map((character) => (
        <div key={character.id} className="character">
          <div className="character-info">
            <span className="character-name">
              {character.name} <span className="character-level">| {character.level}</span>
            </span>
            {character.guild && <span className="character-guild">{`<${character.guild.name}>`}</span>}
          </div>
          <FontAwesomeIcon icon={faTimesCircle} className="error-message pointer" onClick={() => handleDeleteCharacter(character.id)} />
        </div>
      ))}
    </div>
  );
}

export default Characters;
