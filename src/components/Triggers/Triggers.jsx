import React, { useState, useEffect } from "react";
import NewTrigger from "./NewTrigger";
import Trigger from "./Trigger";
import Checkbox from "../Utilities/Checkbox";
import Input from "../Utilities/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesLeft, faAngleLeft, faAnglesRight, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import "./Triggers.scss";

function Triggers() {
  const [triggers, setTriggers] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTimersOverlay, setShowTimersOverlay] = useState(false);
  const [overlayTimersLocked, setOverlayTimersLocked] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [triggersPerPage] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [lastPageBeforeSearch, setLastPageBeforeSearch] = useState(0);

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

  const filteredTriggers = triggers.filter((trigger) => {
    const name = trigger.triggerName || "";
    const searchTextInTrigger = trigger.searchText || "";
    const searchLowercased = searchText.toLowerCase();
    return (name.toLowerCase().includes(searchLowercased) || searchTextInTrigger.toLowerCase().includes(searchLowercased)) && selectedTags.every((tag) => trigger.tags?.includes(tag));
  });

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

  const handleInputChange = (field, value) => {
    if (field === "searchText") {
      if (value) {
        if (!searchText) {
          setLastPageBeforeSearch(currentPage);
        }
        setCurrentPage(0);
      } else if (searchText && !value) {
        setCurrentPage(lastPageBeforeSearch);
      }
      setSearchText(value);
    }
  };

  return (
    <div className="triggers-wrapper">
      <div className="actions">
        <Checkbox id="showTimersOverlay" label="Show Timers Overlay" checked={showTimersOverlay} onCheckChange={handleShowTimersOverlayChange} />
        <Checkbox id="lockOverlayTimers" label="Lock Timers Overlay" checked={overlayTimersLocked} onCheckChange={handleLockOverlayChange} />
      </div>
      <NewTrigger refreshTriggers={refreshTriggers} triggerUpdateCancelled={() => setIsSelected(false)} />

      <div className="triggers">
        <hr />
        <div className="trigger-content">
          <div className="tags">
            {triggers.length} {`trigger${triggers.length === 1 ? "" : "s"}`}
            {triggers.length > triggersPerPage && <Input id="searchText" value={searchText} placeholder="" label="Search..." onTextChange={(value) => handleInputChange("searchText", value)} />}
            {tags.map((tag) => (
              <div key={tag} className={`tag pill ${selectedTags.includes(tag) ? "active" : ""}`} onClick={() => toggleTagSelection(tag)}>
                {tag}
              </div>
            ))}
          </div>
          {currentTriggers.length === 0 ? (
            <div className="null-message">No Results</div>
          ) : (
            <div className="triggers-page-and-list">
              {triggers.length > triggersPerPage && (
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
              )}
              <div className="trigger-list">
                {currentTriggers.map((trigger) => (
                  <Trigger key={trigger.id} trigger={trigger} isSelected={selectedTags.includes(trigger.id)} refreshTriggers={refreshTriggers} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Triggers;
