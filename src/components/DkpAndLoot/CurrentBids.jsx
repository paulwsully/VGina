import React, { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import database from "/firebaseConfig.js";
import Bid from "./Bid";

function CurrentBids() {
  const [activeBids, setActiveBids] = useState([]);

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

  return (
    <div className="active-bids">
      {activeBids.length === 0 ? (
        <div className="null-message">No Active bids</div>
      ) : (
        <div className="active-bids-list">
          {activeBids.map((bid, index) => (
            <Bid key={`active-${index}-${bid.id}`} itemName={bid.item} bidders={bid.bidders} timestamp={bid.timestamp} isPublic={true} bidId={bid.id} isAlt={bid.isAlt} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CurrentBids;
