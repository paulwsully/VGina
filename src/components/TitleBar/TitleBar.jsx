import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindowMinimize, faWindowMaximize, faTimes, faFolderOpen, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import packageJson from "../../../package.json";
import "./TitleBar.scss";

const TitleBar = ({ fileName }) => {
  const handleMinimize = () => {
    window.electron.ipcRenderer.send("minimize-app");
  };

  const handleMaximize = () => {
    window.electron.ipcRenderer.send("maximize-app");
  };

  const handleClose = () => {
    window.electron.ipcRenderer.send("close-app");
  };

  const handleOpenFile = async () => {
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
        <div className="window-control" onClick={handleOpenFile}>
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
