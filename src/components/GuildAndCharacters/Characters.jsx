import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { ref, get, push, set, remove } from "firebase/database";
import { toast, ToastContainer } from "react-toastify";
import database from "../../../firebaseConfig";

function Characters({ user }) {
  const nameInputRef = useRef(null);
  const [characters, setCharacters] = useState([]);
  const [addingCharacter, setAddingCharacter] = useState(false);
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    level: "",
  });

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

  const handleAddCharacter = () => {
    const characterExists = characters.some((character) => character.name === newCharacter.name);
    if (characterExists) {
      toast.error("Character already exists", {
        position: "bottom-right",
      });
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
        setNewCharacter({ name: "", level: "" });
        toast.success("Character created", {
          position: "bottom-right",
        });
      })
      .catch((error) => {
        console.error(error);
        toast.error("Could not add character", {
          position: "bottom-right",
        });
      });
  };

  const handleDeleteCharacter = (characterId) => {
    const characterRef = ref(database, `users/${user.uid}/characters/${characterId}`);
    remove(characterRef)
      .then(() => {
        toast.success("Character deleted", {
          position: "bottom-right",
        });
        setCharacters((prevCharacters) => prevCharacters.filter((character) => character.id !== characterId));
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to delete character", {
          position: "bottom-right",
        });
      });
  };

  return (
    <div className="characters-container">
      <ToastContainer />
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
