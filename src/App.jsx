import React, { useState, useEffect } from "react";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import RedirectToHome from "./RedirectToHome";
import TitleBar from "./components/TitleBar/TitleBar";
import TabBar from "./components/TabBar/TabBar";
import Triggers from "./components/Triggers/Triggers";
import Dkp from "./components/Dkp/Dkp";
import Alerts from "./components/Alerts/Alerts";
import "./App.scss";

function App() {
  const isDev = process.env.NODE_ENV === "development";
  const Router = isDev ? BrowserRouter : HashRouter;
  const [fileName, setFileName] = useState("");
  const [tabs] = useState([
    { label: "Triggers", path: "/triggers" },
    { label: "DKP & Loot", path: "/dkp" },
    { label: "Alerts", path: "/alerts" },
  ]);

  const extractFileName = (path) => {
    return path.split(/[/\\]/).pop().replace("eqlog_", "").replace("_pq.proj.txt", "");
  };

  useEffect(() => {
    const fetchInitialFileName = async () => {
      try {
        const initialFilePath = await window.electron.ipcRenderer.invoke("storeGet", "logFile");
        if (initialFilePath) {
          setFileName(extractFileName(initialFilePath));
          window.electron.ipcRenderer.send("start-file-watch");
        }
      } catch (error) {
        console.error("Error fetching initial file name:", error);
      }
    };

    fetchInitialFileName();

    const handleFileNameChange = (path) => {
      setFileName(extractFileName(path));
      window.electron.startFileWatch();
    };

    const handleNewLine = (event, line) => {
      console.log("Received new line:", line);
    };

    window.electron.ipcRenderer.on("file-name", handleFileNameChange);
    window.electron.ipcRenderer.on(handleNewLine);
    window.electron.ipcRenderer.receive("play-sound", (soundFile) => {
      console.log(soundFile);
      window.electron.playSound(soundFile);
    });

    return () => {
      window.electron.ipcRenderer.removeAllListeners("file-name");
      window.electron.ipcRenderer.removeAllListeners("new-line");
      window.electron.ipcRenderer.removeAllListeners("play-sound");
      window.electron.ipcRenderer.send("stop-file-watch");
    };
  }, []);

  return (
    <Router>
      {fileName && <RedirectToHome fileName={fileName} />}
      <TitleBar fileName={fileName} />
      {fileName && <TabBar tabs={tabs} />}
      <div className="content">
        <Routes>
          <Route path="/" element={<div>Select a file to watch</div>} />
          <Route path="/triggers" element={<Triggers />} />
          <Route path="/dkp" element={<Dkp />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
