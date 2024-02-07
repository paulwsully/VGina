import React, { useState, useEffect } from "react";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import LayoutWithCommonComponents from "./LayoutWithCommonComponents";
import Triggers from "./components/Triggers/Triggers";
import DkpAndLoot from "./components/DkpAndLoot/DkpAndLoot";
import Alerts from "./components/Alerts/Alerts";
import Bids from "./components/DkpAndLoot/Bids";
import "./App.scss";
import ItemDetailsWindow from "./components/DkpAndLoot/ItemDetailsWindow";
import TimerOverlay from "./components/Triggers/TimerOverlay";

function App() {
  const isDev = process.env.NODE_ENV === "development";
  const Router = isDev ? BrowserRouter : HashRouter;
  const [fileName, setFileName] = useState("");
  const [tabs] = useState([
    { label: "Triggers", path: "/triggers" },
    { label: "DKP & Loot", path: "/dkp-and-loot" },
    { label: "Alerts", path: "/alerts" },
  ]);
  const [sortedData, setSortedData] = useState(null);

  useEffect(() => {
    const sortByClass = (data) => {
      const sorted = {};
      if (data && data.Models) {
        data.Models.forEach((character) => {
          const characterClass = character.CharacterClass;
          if (!sorted[characterClass]) {
            sorted[characterClass] = [];
          }
          sorted[characterClass].push(character);
        });
      }
      return sorted;
    };

    const fetchData = async () => {
      try {
        const response = await fetch("https://7gnjtigho4.execute-api.us-east-2.amazonaws.com/prod/dkp", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json, fsdftext/plain",
            clientid: "8c6625795510c",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const jsonData = await response.json();
        const sorted = sortByClass(jsonData);
        setSortedData(sorted); // Set sorted data locally
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

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
    window.electron.ipcRenderer.on("play-sound", (soundFile) => {
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
      <Routes>
        <Route path="/" element={<LayoutWithCommonComponents fileName={fileName} tabs={tabs} />}>
          <Route index element={<div>Select a file to watch</div>} />
          <Route path="triggers" element={<Triggers />} />
          <Route path="dkp-and-loot" element={<DkpAndLoot sortedData={sortedData} fileName={fileName} />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>
        <Route
          path="/dkp-and-loot/overlay/bids"
          element={
            <div className="bid-overlay">
              <Bids dkp={sortedData} />
            </div>
          }
        />
        <Route path="/dkp-and-loot/overlay/item-details" element={<ItemDetailsWindow />} />
        <Route path="/dkp-and-loot/overlay/timers" element={<TimerOverlay />} />
      </Routes>
    </Router>
  );
}

export default App;
