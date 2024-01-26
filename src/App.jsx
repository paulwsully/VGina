import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import RedirectToHome from "./RedirectToHome";
import TitleBar from "./components/TitleBar/TitleBar";
import TabBar from "./components/TabBar/TabBar";
import "./App.scss";

function App() {
  const [fileName, setFileName] = useState("");
  const [tabs] = useState([
    { label: "Bids", path: "/bids" },
    { label: "Alerts", path: "/alerts" },
    { label: "Triggers", path: "/triggers" },
  ]);

  const extractFileName = (path) => {
    return path.split(/[/\\]/).pop().replace("eqlog_", "").replace("_pq.proj.txt", "");
  };

  useEffect(() => {
    const fetchInitialFileName = async () => {
      const initialFilePath = await window.electron.storeGet("logFile");
      if (initialFilePath) {
        setFileName(extractFileName(initialFilePath));
      }
    };

    fetchInitialFileName();

    const handleFileNameChange = (path) => {
      setFileName(extractFileName(path));
    };

    window.electron.receiveMessage("file-name", handleFileNameChange);

    return () => {
      window.electron.removeMessage("file-name", handleFileNameChange);
    };
  }, []);

  return (
    <Router>
      <RedirectToHome fileName={fileName} />
      <TitleBar fileName={fileName} />
      {fileName && <TabBar tabs={tabs} />}
      <div className="content">
        <Routes>
          <Route path="/" element={<div>Select a file to watch</div>} />
          <Route path="/bids" element={<div>bids</div>} />
          <Route path="/alerts" element={<div>alerts</div>} />
          <Route path="/triggers" element={<div>triggers</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
