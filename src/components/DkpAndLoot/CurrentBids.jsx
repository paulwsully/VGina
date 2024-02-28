import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import database from "/firebaseConfig.js";
import Bid from "./Bid";

function Bids({ dkp }) {
  const [activeBids, setActiveBids] = useState([]);

  useEffect(() => {
    const bidsRef = ref(database, "/currentBids");
    onValue(bidsRef, (snapshot) => {
      if (snapshot.exists()) {
        const bidsArray = Object.values(snapshot.val());
        setActiveBids(bidsArray);
      } else {
        console.error("No data available");
      }
    });
  }, []);

  return (
    <div className="active-bids">
      {activeBids.length === 0 ? (
        <div className="null-message">No active bids</div>
      ) : (
        <div className="active-bids-list">
          {activeBids.map((bid, index) => (
            <Bid key={`active-${index}-${bid.item}`} itemName={bid.item} bidders={bid.bidders} findCurrentDKP={dkp} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Bids;
