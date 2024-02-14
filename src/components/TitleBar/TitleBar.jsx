import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindowMinimize, faWindowMaximize, faTimes, faFolderOpen, faArrowUp, faFileImport } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";
import { XMLParser } from "fast-xml-parser";
import packageJson from "../../../package.json";
import "./TitleBar.scss";

const TitleBar = ({ fileName }) => {
  const handleMinimize = () => window.electron.ipcRenderer.send("minimize-app");
  const handleMaximize = () => window.electron.ipcRenderer.send("maximize-app");
  const handleClose = () => window.electron.ipcRenderer.send("close-app");
  const handleOpenLogFile = async () => {
    try {
      const { filePaths } = await window.electron.ipcRenderer.invoke("open-file-dialog");
      if (filePaths && filePaths.length > 0) {
        window.electron.ipcRenderer.send("storeSet", "logFile", filePaths[0]);
        const fileName = filePaths[0].split("\\").pop().split("/").pop().replace("eqlog_", "").replace("_pq.proj.txt", "");
        window.electron.ipcRenderer.send("file-name", fileName);
      }
    } catch (error) {
      console.error("Error opening file:", error);
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
                tags: [...path, trigger.Name, "Gina Trigger"],
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

        console.log("Triggers updated in store successfully.");
      }
    } catch (error) {
      console.error("Error importing file:", error);
    }
  };

  const camelCase = (str) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase()).replace(/^([A-Z])/, (g) => g.toLowerCase());

  const deepCamelCaseKeys = (obj) => {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(deepCamelCaseKeys);
    }
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = camelCase(key);
      acc[camelKey] = deepCamelCaseKeys(obj[key]);
      return acc;
    }, {});
  };

  const mapTriggerKeys = (triggers) => {
    return triggers.map((trigger) => {
      let mappedTrigger = {
        saySomething: trigger.UseTextToVoice,
        playSound: trigger.PlayMediaFile,
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

      if (mappedTrigger.playSound) {
        mappedTrigger.sound = true;
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

  return (
    <div className="titlebar">
      <div className="title">
        VGina
        <span className="version">Pre-Alpha | {packageJson.version}</span>
      </div>
      {fileName && (
        <div className="watching">
          <div className="label">Watching: </div>
          {fileName}
        </div>
      )}
      <div className="window-controls">
        <div className="window-control" onClick={handleFileImport}>
          <FontAwesomeIcon icon={faFileImport} />
        </div>
        <div className="window-control" onClick={handleOpenLogFile}>
          <FontAwesomeIcon icon={faFolderOpen} />
          {!fileName && (
            <div className="click-here">
              <FontAwesomeIcon icon={faArrowUp} />
            </div>
          )}
        </div>
        <div className="window-control" onClick={handleMinimize}>
          <FontAwesomeIcon icon={faWindowMinimize} />
        </div>
        <div className="window-control" onClick={handleMaximize}>
          <FontAwesomeIcon icon={faWindowMaximize} />
        </div>
        <div className="window-control" onClick={handleClose}>
          <FontAwesomeIcon icon={faTimes} />
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
