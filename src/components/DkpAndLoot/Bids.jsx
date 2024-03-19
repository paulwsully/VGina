import React, { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import database from "/firebaseConfig.js";
import Bid from "./Bid";
// import cursorImagePath from "./../../assets/cursor.png";

function Bids({ dkp }) {
  const [activeBids, setActiveBids] = useState([]);
  const [name, setname] = useState("white");

  useEffect(() => {
    const bidsRef = ref(database, "currentBids");
    const onBidsChange = (snapshot) => {
      if (snapshot.exists()) {
        const bidsData = snapshot.val();
        const bidsArray = Object.entries(bidsData).map(([key, value]) => ({
          ...value,
          id: key,
          bidders: Array.isArray(value.bidders) ? value.bidders.slice().sort((a, b) => b.amt - a.amt) : [],
        }));
        setActiveBids(bidsArray);
      } else {
        setActiveBids([]);
      }
    };

    onValue(bidsRef, onBidsChange);

    return () => off(bidsRef, "value", onBidsChange);
  }, []);

  useEffect(() => {
    const fetchname = async () => {
      const resultName = await window.electron.ipcRenderer.invoke("storeGet", "watchedCharacter");
      setname(resultName);
    };

    fetchname();
  }, []);

  const findCurrentDKP = (characterName) => {
    for (const className in dkp) {
      if (Object.hasOwnProperty.call(dkp, className)) {
        const characterArray = dkp[className];
        const character = characterArray.find((char) => char.CharacterName === characterName);
        if (character) {
          return character.CurrentDKP;
        }
      }
    }
    return null;
  };

  return (
    // <div className="active-bids" style={{ cursor: `url(${cursorImagePath}), auto` }}>
    <div className="active-bids">
      {activeBids.length === 0 ? (
        <div className="null-message">No active bids</div>
      ) : (
        <div className="active-bids-list">
          {activeBids.map((bid) => {
            console.log(name); // Logging the values

            return <React.Fragment key={`active-bid-${bid.id}`}>{name === bid.bidTaker && <Bid itemName={bid.item} bidders={bid.bidders} findCurrentDKP={findCurrentDKP} isAlt={bid.isAlt} bidId={bid.id} />}</React.Fragment>;
          })}
        </div>
      )}
    </div>
  );
}

export default Bids;
