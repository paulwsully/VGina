import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindowMinimize, faWindowMaximize, faTimes, faFolderOpen, faArrowUp, faFileImport } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";
import { XMLParser } from "fast-xml-parser";
import packageJson from "../../../package.json";
import "./TitleBar.scss";

const TitleBar = ({ fileName }) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    window.electron.ipcRenderer.on("update-available", () => setUpdateAvailable(true));
    window.electron.ipcRenderer.on("update-not-available", () => setUpdateAvailable(false));
    return () => {
      window.electron.ipcRenderer.removeAllListeners("update-available");
      window.electron.ipcRenderer.removeAllListeners("update-not-available");
    };
  }, []);

  const handleMinimize = () => window.electron.ipcRenderer.send("minimize-app");
  const handleMaximize = () => window.electron.ipcRenderer.send("maximize-app");
  const handleClose = () => window.electron.ipcRenderer.send("close-app");

  const handleUpdateClick = () => {
    window.electron.ipcRenderer.send("install-update");
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

  return (
    <div className="titlebar">
      <div className="title">
        EQPal
        <span className="version">Pre-Alpha | {packageJson.version}</span>
      </div>
      {updateAvailable && (
        <div className="update-button" onClick={handleUpdateClick}>
          Update Available
        </div>
      )}
      <div className="window-controls">
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
