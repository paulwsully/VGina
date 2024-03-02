import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import database from "/firebaseConfig.js";
import Bid from "./Bid";

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
      const logFilePath = await window.electron.ipcRenderer.invoke("storeGet", "logFile");
      const nameMatch = logFilePath.match(/eqlog_(.+?)_pq.proj.txt/);
      setname(nameMatch ? nameMatch[1] : "Unknown");
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
    <div className="active-bids">
      {activeBids.length === 0 ? (
        <div className="null-message">No active bids</div>
      ) : (
        <div className="active-bids-list">
          {activeBids.map((bid, index) => (
            <>{name === bid.bidTaker && <Bid key={`active-${index}-${bid.id}`} itemName={bid.item} bidders={bid.bidders} findCurrentDKP={findCurrentDKP} isAlt={bid.isAlt} bidId={bid.id} />}</>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bids;
