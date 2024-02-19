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
        console.error("No data available");
      }
    });
  }, []);

  const sortedBids = Object.entries(closedBids).sort((a, b) => {
    return new Date(b[1].timestamp) - new Date(a[1].timestamp);
  });

  return (
    <div className="closed-bids">
      {sortedBids.length === 0 ? (
        <div className="null-message">No closed bids</div>
      ) : (
        sortedBids.map(([key, bid]) => (
          <div key={key} className="closed-bid">
            <div className="closed-bid-name">
              <div className="text-primary bold">
                {bid.item} <span className="bid-win-amount">({bid.bidders.length > 1 ? bid.bidders[1].dkp + 1 : 1})</span> {bid.bidTaker ? <span className="bid-taker"> {bid.bidTaker}</span> : ""}
              </div>
              <span>{new Date(bid.timestamp).toLocaleString()}</span>
            </div>
            <div className="closed-bid-bidders">
              {bid.bidders.map((bidder, index) => (
                <div key={`${key}-${index}-${bidder.name}`} className="closed-bidder">
                  {bidder.isAlt && <span className="bidder-alt">alt | </span>}
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
