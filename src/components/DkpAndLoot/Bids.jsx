import React, { useState, useEffect } from "react";
import Bid from "./Bid";

function Bids({ dkp }) {
  const [activeBids, setActiveBids] = useState([]);

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
    const bidsUpdatedListener = () => {
      getActiveBids();
    };
    window.electron.ipcRenderer.on("activeBids-updated", bidsUpdatedListener);
    return () => {
      window.electron.ipcRenderer.removeAllListeners("bids-updated");
    };
  }, []);

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
