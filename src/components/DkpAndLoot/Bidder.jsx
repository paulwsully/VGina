import React, { useEffect, useState } from "react";

function Bidder({ index, bidder, paysAmount, findCurrentDKP }) {
  const [currentDKP, setCurrentDKP] = useState(null);

  useEffect(() => {
    const dkpValue = findCurrentDKP(bidder.name);
    setCurrentDKP(dkpValue);
  }, [bidder.name, findCurrentDKP]);
  return (
    <div className="bidder">
      <div className="bidder-name">
        {bidder.isAlt && <span className="alt">alt | </span>}
        {bidder.name}
      </div>
      <div className={`bidder-amt ${currentDKP < bidder.dkp ? "error" : ""}`}>
        {bidder.dkp} <span>/</span> {currentDKP > 0 ? currentDKP : 0}
      </div>
      {index === 0 && (
        <div className="bidder-pay-amt">
          <span>pays</span>
          {paysAmount ? paysAmount : 1}
        </div>
      )}
    </div>
  );
}

export default Bidder;
