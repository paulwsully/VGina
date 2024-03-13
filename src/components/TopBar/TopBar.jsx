import React, { useState, useEffect, useRef } from "react";
import { signInWithGoogle, signOutUser } from "./../Utilities/googleAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderOpen, faArrowUpFromBracket, faArrowRightFromBracket, faCaretDown, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { ref, push, set, get } from "firebase/database";
import database from "../../../firebaseConfig";
import Overlay from "../Utilities/Overlay";
import Input from "../Utilities/Input";
import "./TopBar.scss";

const TopBar = ({ user }) => {
  const [isActive, setIsActive] = useState(false);
  const [addingNewChar, setaddingNewChar] = useState(false);
  const [userCharacters, setUserCharacters] = useState([]);
  const [watchedCharacter, setwatchedCharacter] = useState(null);
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    level: "",
    class: "",
  });
  const charactersRef = useRef(null);

  const handleCharacterChange = (field, value) => {
    setNewCharacter((prev) => ({ ...prev, [field]: value }));
  };

  const updateWatchedCharacter = (character) => {
    setwatchedCharacter(character);
    window.electron.ipcRenderer.send("storeSet", "watchedCharacter", character);
    window.electron.ipcRenderer.send("start-file-watch");
  };

  useEffect(() => {
    if (user) {
      const userCharactersRef = ref(database, `users/${user.uid}/characters`);
      get(userCharactersRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const fetchedCharacters = [];
            snapshot.forEach((childSnapshot) => {
              const characterData = childSnapshot.val();
              fetchedCharacters.push(characterData);
            });
            setUserCharacters(fetchedCharacters);
            if (fetchedCharacters) {
              updateWatchedCharacter(fetchedCharacters[0]);
            }
          } else {
            console.log("No characters found for this user.");
            setUserCharacters([]);
            updateWatchedCharacter(null);
          }
        })
        .catch((error) => {
          console.error("Error fetching user characters:", error);
        });
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (charactersRef.current && !charactersRef.current.contains(event.target)) {
        setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleCharacters = () => {
    setIsActive(!isActive);
  };

  const handleOpenLogFile = async () => {
    try {
      const { filePaths } = await window.electron.ipcRenderer.invoke("open-directory-dialog");
      if (filePaths && filePaths.length > 0) {
        window.electron.ipcRenderer.send("storeSet", "logDirectory", filePaths[0]);
      }
    } catch (error) {
      console.error("Error opening directory:", error);
    }
  };

  const handleFileImport = async () => {
    try {
      const content = await window.electron.ipcRenderer.invoke("gina-open-file-dialog");
      if (content) {
        const parser = new XMLParser();
        const jsonObj = parser.parse(content);

        const convertBooleans = (obj) => {
          for (const key in obj) {
            if (typeof obj[key] === "object") {
              convertBooleans(obj[key]);
            } else if (obj[key] === "True") {
              obj[key] = true;
            } else if (obj[key] === "False") {
              obj[key] = false;
            }
          }
        };

        const collectTriggers = (triggerGroup, path = []) => {
          let triggers = [];

          if (triggerGroup.TriggerGroups && triggerGroup.TriggerGroups.TriggerGroup) {
            let nestedGroups = triggerGroup.TriggerGroups.TriggerGroup;
            if (!Array.isArray(nestedGroups)) {
              nestedGroups = [nestedGroups];
            }
            nestedGroups.forEach((nestedGroup) => {
              triggers = triggers.concat(collectTriggers(nestedGroup, [...path, nestedGroup.Name]));
            });
          }

          if (triggerGroup.Triggers && triggerGroup.Triggers.Trigger) {
            let groupTriggers = triggerGroup.Triggers.Trigger;
            if (!Array.isArray(groupTriggers)) {
              groupTriggers = [groupTriggers];
            }
            groupTriggers = groupTriggers.map((trigger) => {
              convertBooleans(trigger);
              return {
                ...trigger,
                tags: [...path, "Gina Trigger"],
                id: uuidv4(),
              };
            });
            triggers = triggers.concat(groupTriggers);
          }

          return triggers;
        };

        const { Configuration } = jsonObj;
        convertBooleans(Configuration);
        const allTriggers = Configuration.TriggerGroups.TriggerGroup.flatMap((triggerGroup) => collectTriggers(triggerGroup, [triggerGroup.Name]));
        const remappedTriggers = mapTriggerKeys(allTriggers);
        const existingTriggers = (await window.electron.ipcRenderer.invoke("storeGet", "triggers")) || [];
        const updatedTriggers = existingTriggers.concat(remappedTriggers);
        window.electron.ipcRenderer.send("storeSet", "triggers", updatedTriggers);
        const tagsCollection = updatedTriggers.reduce((acc, trigger) => {
          if (trigger.tags && trigger.tags.length) {
            const filteredTags = trigger.tags.filter((tag) => tag !== trigger.triggerName);
            acc.push(...filteredTags);
          }
          return acc;
        }, []);

        const uniqueTags = [...new Set(tagsCollection)];

        window.electron.ipcRenderer.send("storeSet", "tags", uniqueTags);
      }
    } catch (error) {
      console.error("Error importing file:", error);
    }
  };

  const mapTriggerKeys = (triggers) => {
    return triggers.map((trigger) => {
      let mappedTrigger = {
        saySomething: trigger.UseTextToVoice,
        playSound: trigger.PlayMediaFile ? true : false,
        triggerName: trigger.Name,
        searchText: trigger.TriggerText,
        searchRegex: trigger.EnableRegex === "True" || trigger.EnableRegex === true,
        speechText: trigger.TextToVoiceText,
        timerEndedTrigger: deepCamelCaseKeys(trigger.TimerEndedTrigger),
        timerEndingTrigger: deepCamelCaseKeys(trigger.TimerEndingTrigger),
      };

      if (trigger.TimerDuration && parseInt(trigger.TimerDuration, 10) > 0) {
        const duration = parseInt(trigger.TimerDuration, 10);
        mappedTrigger.timerHours = Math.floor(duration / 3600);
        mappedTrigger.timerMinutes = Math.floor((duration % 3600) / 60);
        mappedTrigger.timerSeconds = duration % 60;
        mappedTrigger.setTimer = true;
      }

      if (mappedTrigger.timerEndedTrigger?.playMediaFile || mappedTrigger.timerEndingTrigger?.playMediaFile) {
        mappedTrigger.doTimerExpirationSound = true;
      }

      Object.keys(trigger).forEach((key) => {
        if (!["UseTextToVoice", "PlayMediaFile", "Name", "TriggerText", "EnableRegex", "TextToVoiceText", "TimerDuration", "TimerEndedTrigger", "TimerEndingTrigger"].includes(key)) {
          const camelKey = camelCase(key);
          mappedTrigger[camelKey] = deepCamelCaseKeys(trigger[key]);
        }
      });

      return mappedTrigger;
    });
  };

  const handleSignOut = () => {
    signOutUser(() => {
      // setMenuActive(false);
    });
  };

  const toggleOpenClose = () => {
    setaddingNewChar(!addingNewChar);
  };

  const saveCharacter = async () => {
    if (!user || !newCharacter.name || !newCharacter.level || !newCharacter.class) {
      console.error("Invalid data or user not logged in");
      return;
    }

    if (!classOptions.includes(newCharacter.class)) {
      console.error("Invalid class for the character");
      return;
    }

    const duplicate = userCharacters.some((character) => character.name.toLowerCase() === newCharacter.name.toLowerCase());
    if (duplicate) {
      console.error("A character with the same name already exists.");
      return;
    }

    const userCharactersRef = ref(database, `users/${user.uid}/characters`);
    const newCharacterRef = push(userCharactersRef);
    const newCharacterWithId = { ...newCharacter, id: newCharacterRef.key };

    set(newCharacterRef, newCharacterWithId)
      .then(() => {
        setUserCharacters((prevCharacters) => [...prevCharacters, newCharacterWithId]);
        setNewCharacter({ name: "", level: "", class: "" });
        setaddingNewChar(false);
        updateWatchedCharacter(newCharacterWithId);
      })
      .catch((error) => {
        console.error("Error adding new character:", error);
      });
  };

  const classOptions = ["Bard", "Beastlord", "Berserker", "Cleric", "Druid", "Enchanter", "Magician", "Monk", "Necromancer", "Paladin", "Ranger", "Rogue", "Shadowknight", "Shaman", "Warrior", "Wizard"];

  const classList = (
    <datalist id="class-list">
      {classOptions.map((className, index) => (
        <option key={index} value={className} />
      ))}
    </datalist>
  );

  return (
    <div className="topbar">
      {addingNewChar && (
        <Overlay toggleOpenClose={toggleOpenClose}>
          <div className="panel new-character-panel">
            <h3>New Character</h3>
            <hr />
            <Input label="Character Name" placeholder="" value={newCharacter.name} onTextChange={(value) => handleCharacterChange("name", value)} />
            <div className="input-row">
              <Input type="number" label="Level" placeholder="" value={newCharacter.level} onTextChange={(value) => handleCharacterChange("level", value)} />
              <Input type="text" label="Class" placeholder="" list="class-list" value={newCharacter.class} onTextChange={(value) => handleCharacterChange("class", value)} />
              {classList}
            </div>
            <div className="input-row">
              <div className="pill button" onClick={saveCharacter}>
                Save
              </div>
              <div className="pill button error" onClick={toggleOpenClose}>
                Cancel
              </div>
            </div>
          </div>
        </Overlay>
      )}
      <div className="user-or-signin">
        {user ? (
          <div className="watching-container">
            <div className="label">{userCharacters.length > 0 ? `Watching:` : `Add a character to watch: `} </div>
            <div className={`characters ${isActive ? "active" : ""}`} onClick={toggleCharacters} ref={charactersRef}>
              {watchedCharacter && (
                <div className="char">
                  {watchedCharacter.name} <FontAwesomeIcon icon={faCaretDown} />
                </div>
              )}
              <div className="char new-char" onClick={() => setaddingNewChar(true)}>
                <FontAwesomeIcon icon={faPlusCircle} /> New Character
              </div>
              {userCharacters &&
                userCharacters.length > 1 &&
                userCharacters.map((char, index) => (
                  <div className="char" key={index} onClick={() => updateWatchedCharacter(char)}>
                    {char.name}
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="pill" onClick={signInWithGoogle}>
            Sign in
          </div>
        )}
      </div>
      <div className="user-options">
        <div className="user-options-menu-item" onClick={handleOpenLogFile}>
          <FontAwesomeIcon icon={faFolderOpen} />
          Select Log Directory
        </div>
        <div className="user-options-menu-item" onClick={handleFileImport}>
          <FontAwesomeIcon icon={faArrowUpFromBracket} />
          Import from GINA
        </div>
        {user && (
          <div className="user-options-menu-item" onClick={handleSignOut}>
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
            Sign out
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
