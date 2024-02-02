import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import database from "/firebaseConfig.js";

function ClosedBids({}) {
  const [closedBids, setClosedBids] = useState({});

  useEffect(() => {
    const dataRef = ref(database, "/closedBids");
    onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        setClosedBids(snapshot.val());
      } else {
        console.log("No data available");
      }
    });
  }, []);

  return (
    <div className="closed-bids">
      {Object.entries(closedBids).length === 0 ? (
        <div className="null-message">No closed bids</div>
      ) : (
        Object.entries(closedBids).map(([key, bid]) => (
          <div key={key} className="closed-bid">
            <div className="closed-bid-name">
              <div className="text-primary bold">
                {bid.item} - <span className="bid-win-amount">{bid.bidders.length > 1 ? bid.bidders[1].dkp + 1 : 1}</span>
              </div>
              <span>{new Date(bid.timestamp).toLocaleString()}</span>
            </div>
            <div className="closed-bid-bidders">
              {bid.bidders.map((bidder, index) => (
                <div key={`${key}-${index}-${bidder.name}`} className="closed-bidder">
                  <span className="bidder-name">{bidder.name}</span> <span>{bidder.dkp}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ClosedBids;
