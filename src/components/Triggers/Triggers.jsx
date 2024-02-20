import React, { useState, useEffect } from "react";
import NewTrigger from "./NewTrigger";
import Trigger from "./Trigger";
import Checkbox from "../Utilities/Checkbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesLeft, faAngleLeft, faAnglesRight, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import "./Triggers.scss";

function Triggers() {
  const [triggers, setTriggers] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTimersOverlay, setShowTimersOverlay] = useState(false);
  const [overlayTimersLocked, setOverlayTimersLocked] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [isSelected, setIsSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [triggersPerPage] = useState(20); // Number of triggers to display per page

  useEffect(() => {
    const fetchSettingsAndTriggers = async () => {
      const storedShowTimersOverlay = await window.electron.ipcRenderer.invoke("storeGet", "showTimersOverlay");
      const storedOverlayTimersLocked = await window.electron.ipcRenderer.invoke("storeGet", "overlayTimersLocked");
      const storedTriggers = await window.electron.ipcRenderer.invoke("storeGet", "triggers");
      const tags = await window.electron.ipcRenderer.invoke("storeGet", "tags");

      setShowTimersOverlay(storedShowTimersOverlay || false);
      setOverlayTimersLocked(storedOverlayTimersLocked || false);
      setTriggers(storedTriggers || []);
      setTags(tags || []);
      if (storedShowTimersOverlay) window.electron.ipcRenderer.send("open-overlay-timers");
    };
    fetchSettingsAndTriggers();
  }, []);

  const toggleTagSelection = (tag) => {
    setSelectedTags((prevSelectedTags) => (prevSelectedTags.includes(tag) ? prevSelectedTags.filter((t) => t !== tag) : [...prevSelectedTags, tag]));
  };

  const filteredTriggers = triggers.filter((trigger) => selectedTags.every((tag) => trigger.tags?.includes(tag)));

  const pageCount = Math.ceil(filteredTriggers.length / triggersPerPage);
  const currentTriggers = filteredTriggers.slice(currentPage * triggersPerPage, (currentPage + 1) * triggersPerPage);

  const firstPage = () => setCurrentPage(0);
  const lastPage = () => setCurrentPage(pageCount - 1);
  const nextPage = () => setCurrentPage((current) => Math.min(current + 1, pageCount - 1));
  const prevPage = () => setCurrentPage((current) => Math.max(current - 1, 0));

  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(currentPage - 2, 0);
    const endPage = Math.min(startPage + 4, pageCount - 1);

    for (let page = startPage; page <= endPage; page++) {
      pages.push(page);
    }

    return pages;
  };

  const handleShowTimersOverlayChange = (checked) => {
    setShowTimersOverlay(checked);
    window.electron.ipcRenderer.send("storeSet", "showTimersOverlay", checked);
    if (checked) {
      window.electron.ipcRenderer.send("open-overlay-timers");
    } else {
      window.electron.ipcRenderer.send("close-overlay-timers");
    }
  };

  const handleLockOverlayChange = (checked) => {
    setOverlayTimersLocked(checked);
    window.electron.ipcRenderer.send("storeSet", "overlayTimersLocked", checked);
    if (checked) {
      window.electron.ipcRenderer.send("lock-overlay-timers");
    } else {
      window.electron.ipcRenderer.send("unlock-overlay-timers");
    }
  };

  const refreshTriggers = async () => {
    const updatedTriggers = await window.electron.ipcRenderer.invoke("storeGet", "triggers");
    const updatedTags = await window.electron.ipcRenderer.invoke("storeGet", "tags");
    setTriggers(updatedTriggers || []);
    setTags(updatedTags || []);
  };

  return (
    <div className="triggers-wrapper">
      <div className="actions">
        <Checkbox id="showTimersOverlay" label="Show Timers Overlay" checked={showTimersOverlay} onCheckChange={handleShowTimersOverlayChange} />
        <Checkbox id="lockOverlayTimers" label="Lock Timers Overlay" checked={overlayTimersLocked} onCheckChange={handleLockOverlayChange} />
      </div>
      <NewTrigger refreshTriggers={refreshTriggers} triggerUpdateCancelled={() => setIsSelected(false)} />
      <div className="triggers">
        <h3>Triggers</h3>
        <div className="trigger-content">
          <div className="tags">
            {tags.map((tag) => (
              <div key={tag} className={`tag pill ${selectedTags.includes(tag) ? "active" : ""}`} onClick={() => toggleTagSelection(tag)}>
                {tag}
              </div>
            ))}
          </div>

          <div className="triggers-page-and-list">
            <div className="pagination">
              <span>
                <button onClick={firstPage} disabled={currentPage === 0}>
                  <FontAwesomeIcon icon={faAnglesLeft} />
                </button>
                <button onClick={prevPage} disabled={currentPage === 0}>
                  <FontAwesomeIcon icon={faAngleLeft} />
                </button>
              </span>

              {getPageNumbers().map((number) => (
                <button className="num-btn" key={number} onClick={() => setCurrentPage(number)} disabled={number === currentPage}>
                  {number + 1}
                </button>
              ))}

              <span>
                <button onClick={nextPage} disabled={currentPage >= pageCount - 1}>
                  <FontAwesomeIcon icon={faAngleRight} />
                </button>
                <button onClick={lastPage} disabled={currentPage >= pageCount - 1}>
                  <FontAwesomeIcon icon={faAnglesRight} />
                </button>
              </span>
            </div>
            <div className="trigger-list">
              {currentTriggers.length === 0 ? (
                <div className="null-message">No Triggers. Click "New Trigger" to create one.</div>
              ) : (
                currentTriggers.map((trigger) => <Trigger key={trigger.id} trigger={trigger} isSelected={selectedTags.includes(trigger.id)} refreshTriggers={() => {}} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Triggers;
