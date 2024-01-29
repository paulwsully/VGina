import React, { useState, useEffect } from "react";
import Bid from "./Bid";

function Bids({ dkp }) {
  const [bids, setBids] = useState([]);

  useEffect(() => {
    const getBids = async () => {
      try {
        const currentBids = await window.electron.ipcRenderer.invoke("get-bids");
        if (Array.isArray(currentBids)) {
          const sortedBids = currentBids.map((bid) => {
            return {
              ...bid,
              bidders: bid.bidders.slice().sort((a, b) => b.dkp - a.dkp),
            };
          });

          setBids(sortedBids);
        } else {
          console.error("Received data is not an array:", currentBids);
        }
      } catch (err) {
        console.error("Error fetching bids:", err);
      }
    };

    const bidsUpdated = async () => {
      await getBids();
    };

    window.electron.ipcRenderer.on("bids-updated", bidsUpdated);
    getBids();

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
    <div className="bids">
      {bids.length === 0 && <div className="null-message">No active bids</div>}
      {bids.map((bid, index) => (
        <Bid key={`${index}-${bid.item}`} itemName={bid.item} bidders={bid.bidders} findCurrentDKP={findCurrentDKP} />
      ))}
    </div>
  );
}

export default Bids;
