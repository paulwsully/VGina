import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindowMinimize, faWindowMaximize, faTimes, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import packageJson from "../../../package.json";
import "./TitleBar.scss";

const TitleBar = ({ fileName }) => {
  const handleMinimize = () => {
    window.electron.sendMessage("minimize-app");
  };

  const handleMaximize = () => {
    window.electron.sendMessage("maximize-app");
  };

  const handleClose = () => {
    window.electron.sendMessage("close-app");
  };

  const handleOpenFile = async () => {
    const { filePaths } = await window.electron.invoke("open-file-dialog");
    if (filePaths.length > 0) {
      window.electron.storeSet("logFile", filePaths[0]);
      const fileName = filePaths[0]
        .split("\\")
        .pop()
        .split("/")
        .pop()
        .replace("eqlog_", "")
        .replace("_pq.proj.txt", "");
      window.electron.sendMessage("file-name", fileName);
    }
  };

  return (
    <div className="titlebar">
      <div className="title">
        VGina
        <span className="version">{packageJson.version}</span>
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
