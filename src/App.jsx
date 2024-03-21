import React, { useState, useEffect } from "react";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./../firebaseConfig";
import LayoutWithCommonComponents from "./LayoutWithCommonComponents";
import Triggers from "./components/Triggers/Triggers";
import DkpAndLoot from "./components/DkpAndLoot/DkpAndLoot";
import Alerts from "./components/Alerts/Alerts";
import Bids from "./components/DkpAndLoot/Bids";
import GuildAndCharacters from "./components/GuildAndCharacters/GuildAndCharacters";
import CurrentBids from "./components/DkpAndLoot/CurrentBids";
import ItemDetailsWindow from "./components/DkpAndLoot/ItemDetailsWindow";
import TimerOverlay from "./components/Triggers/TimerOverlay";
import Tracker from "./components/Tracker/Tracker";
import "./App.scss";

function App() {
  const isDev = process.env.NODE_ENV === "development";
  const Router = isDev ? BrowserRouter : HashRouter;
  const [user, setuser] = useState(null);
  const [tabs] = useState([
    { label: "Triggers", path: "/triggers" },
    { label: "Guild & Characters", path: "/guild-and-characters" },
    { label: "DKP & Loot", path: "/dkp-and-loot" },
    { label: "Options & Overlays", path: "/alerts" },
  ]);
  const [sortedData, setSortedData] = useState(null);

  const convertImage = async () => {
    const sourcePath = "C:/EQ/uifiles/QuarmUpscale/pot_cursors.tga";
    const outputPath = "C:/vgina/src/assets/cursor.png";

    try {
      const result = await window.electron.convertTGAtoPNG(sourcePath, outputPath);
      if (result.success) {
        console.log("Conversion successful");
      } else {
        console.error("Conversion failed:", result.error);
      }
    } catch (error) {
      console.error("IPC conversion failed:", error);
    }
  };

  useEffect(() => {
    window.electron.ipcRenderer.on("play-sound", (soundFile) => {
      window.electron.playSound(soundFile);
    });

    // convertImage();

    return () => {
      window.electron.ipcRenderer.removeAllListeners("file-name");
      window.electron.ipcRenderer.removeAllListeners("play-sound");
      window.electron.ipcRenderer.send("stop-file-watch");
    };
  }, []);

  useEffect(() => {
    const userSubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setuser(user);
      } else {
        setuser(null);
      }
    });
    return () => {
      userSubscribe();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LayoutWithCommonComponents tabs={tabs} user={user} />}>
          <Route index path="triggers" element={<Triggers />} />
          <Route path="guild-and-characters" element={<GuildAndCharacters user={user} />} />
          <Route path="dkp-and-loot" element={<DkpAndLoot sortedData={sortedData} user={user} />} />
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
        <Route
          path="/dkp-and-loot/overlay/current-bids"
          element={
            <div className="current-bids-overlay">
              <CurrentBids />
            </div>
          }
        />
        <Route path="/dkp-and-loot/overlay/item-details" element={<ItemDetailsWindow />} />
        <Route path="/dkp-and-loot/overlay/timers" element={<TimerOverlay />} />
        <Route path="/dkp-and-loot/overlay/tracker" element={<Tracker />} />
      </Routes>
    </Router>
  );
}

export default App;
