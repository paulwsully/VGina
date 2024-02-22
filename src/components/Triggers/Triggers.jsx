import React, { useState, useEffect } from "react";
import NewTrigger from "./NewTrigger";
import Trigger from "./Trigger";
import Checkbox from "../Utilities/Checkbox";
import Input from "../Utilities/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import "./Triggers.scss";
import Pagination from "./Pagination";

function Triggers() {
  const [triggers, setTriggers] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSelected, setIsSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [triggersPerPage] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [lastPageBeforeSearch, setLastPageBeforeSearch] = useState(0);

  useEffect(() => {
    const fetchSettingsAndTriggers = async () => {
      const storedTriggers = await window.electron.ipcRenderer.invoke("storeGet", "triggers");
      const tags = await window.electron.ipcRenderer.invoke("storeGet", "tags");

      setTriggers(storedTriggers || []);
      setTags(tags || []);
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

  const currentTriggers = filteredTriggers.slice(currentPage * triggersPerPage, (currentPage + 1) * triggersPerPage);

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
      <div className="triggers">
        <div className="trigger-content">
          <div className="tags">
            <NewTrigger refreshTriggers={refreshTriggers} triggerUpdateCancelled={() => setIsSelected(false)} />
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
              {triggers.length > triggersPerPage && <Pagination total={filteredTriggers.length} perPage={triggersPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
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
