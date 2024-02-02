import React, { useState, useEffect } from "react";
import Bid from "./Bid";
import Checkbox from "../Utilities/Checkbox";

function Bids({ dkp }) {
  const [activeBids, setActiveBids] = useState([]);
  const [showBidsOverlay, setShowBidsOverlay] = useState(false);
  const [overlayBidLocked, setOverlayBidLocked] = useState(false);

  useEffect(() => {
    const getActiveBids = async () => {
      const currentActiveBids = await window.electron.ipcRenderer.invoke("get-bids");
      if (Array.isArray(currentActiveBids)) {
        const sortedActiveBids = currentActiveBids.map((bid) => ({
          ...bid,
          bidders: bid.bidders.slice().sort((a, b) => b.dkp - a.dkp),
        }));

        setActiveBids(sortedActiveBids);
      } else {
        console.error("Received data is not an array:", currentActiveBids);
      }
    };

    getActiveBids();

    const bidsUpdatedListener = async () => {
      await getActiveBids();
    };

    window.electron.ipcRenderer.on("bids-updated", bidsUpdatedListener);

    const fetchSettings = async () => {
      const storedShowBidsOverlay = await window.electron.ipcRenderer.invoke("storeGet", "showBidsOverlay");
      const storedOverlayBidLocked = await window.electron.ipcRenderer.invoke("storeGet", "overlayBidLocked");
      setShowBidsOverlay(storedShowBidsOverlay || false);
      setOverlayBidLocked(storedOverlayBidLocked || false);
    };

    fetchSettings();

    window.electron.getOverlayBidLocked().then(setOverlayBidLocked);

    return () => {
      window.electron.ipcRenderer.removeAllListeners("bids-updated");
    };
  }, []);

  const handleOverlayCheckboxChange = (checked) => {
    setShowBidsOverlay(checked);
    window.electron.ipcRenderer.send("storeSet", "showBidsOverlay", checked);
    if (checked) {
      window.electron.ipcRenderer.send("open-overlay-window");
    } else {
      window.electron.ipcRenderer.send("close-overlay-window");
    }
  };

  const handleLockOverlayChange = (checked) => {
    setOverlayBidLocked(checked);
    window.electron.ipcRenderer.send("storeSet", "overlayBidLocked", checked);
    if (checked) {
      window.electron.ipcRenderer.send("enable-click-through");
    } else {
      window.electron.ipcRenderer.send("disable-click-through");
    }
  };

  const findCurrentDKP = (characterName) => {
    for (const className in dkp) {
      const characterArray = dkp[className];
      const character = characterArray.find((char) => char.CharacterName === characterName);
      if (character) {
        return character.CurrentDKP;
      }
    }
    return null;
  };

  return (
    <div className="active-bids">
      <div className="actions">
        <Checkbox id="showBidsOverlay" label="Show Bids Overlay" checked={showBidsOverlay} onCheckChange={handleOverlayCheckboxChange} />
        <Checkbox id="lockOverlay" label="Lock Overlay" checked={overlayBidLocked} onCheckChange={handleLockOverlayChange} />
      </div>
      {activeBids.length === 0 ? (
        <div className="null-message">No active bids</div>
      ) : (
        <div className="active-bids-list">
          {activeBids.map((bid, index) => (
            <Bid key={`active-${index}-${bid.item}`} itemName={bid.item} bidders={bid.bidders} findCurrentDKP={findCurrentDKP} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Bids;
