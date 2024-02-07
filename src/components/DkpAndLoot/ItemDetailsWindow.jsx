import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

function ItemDetailsWindow() {
  const [itemData, setItemData] = useState(null);
  const overlayRef = useRef(null);
  useEffect(() => {
    document.documentElement.classList.add("item-details-window");
    return () => {
      document.documentElement.classList.remove("item-details-window");
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const storedItemData = await window.electron.ipcRenderer.invoke("get-foundItem");
      setItemData(storedItemData);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (overlayRef.current) {
      const { width, height } = overlayRef.current.getBoundingClientRect();
      window.electron.ipcRenderer.send("itemDetailsWindow-resize", { width, height });
    }
  }, [itemData]);

  const handleClose = () => {
    window.electron.ipcRenderer.invoke("close-itemDetailsWindow");
  };

  if (!itemData) return <div>Loading...</div>;

  return (
    <div className="item-details-overlay" ref={overlayRef}>
      <button onClick={handleClose} style={{ position: "absolute", top: "0", right: "0" }}>
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <h3 className="details-overlay-item-name">
        <img src={itemData.ItemImage} alt={itemData.ItemName} /> {itemData.ItemName}
      </h3>
      <pre>{itemData.ItemData}</pre>
      {itemData.QuestData.length > 0 && (
        <div className="details-overlay-item-quests">
          <h3>Related Quests</h3>
          {itemData.QuestData.map((quest, index) => (
            <div key={quest.QuestName} className="details-overlay-item-quest">
              - {quest.QuestName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ItemDetailsWindow;
