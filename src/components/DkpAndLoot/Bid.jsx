import React, { useState, useEffect } from "react";
import Bidder from "./Bidder";

function Bid({ itemName, bidders, findCurrentDKP }) {
  const [timer, setTimer] = useState("00:00");

  const updateTimer = (startTime) => {
    const elapsedTime = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    setTimer(`${minutes}:${seconds}`);
  };

  useEffect(() => {
    const startTime = Date.now();
    updateTimer(startTime);

    const intervalId = setInterval(() => {
      updateTimer(startTime);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleItemClick = async () => {
    const itemsData = await window.electron.readItemsData();
    const cleanItemName = itemName.replace(/[\W_]+/g, "").toLowerCase();

    const foundItem = itemsData.find((item) => {
      const cleanItemNameFromData = item.ItemName.replace(/[\W_]+/g, "").toLowerCase();
      return cleanItemName === cleanItemNameFromData;
    });

    await window.electron.ipcRenderer.invoke("set-foundItem", foundItem);
    await window.electron.ipcRenderer.invoke("open-itemDetailsWindow");
  };

  const handleMouseEnter = async (event) => {
    window.electron.ipcRenderer.send("disable-only-click-through");
  };

  const handleMouseLeave = () => {
    window.electron.ipcRenderer.send("enable-only-click-through");
  };

  const hasMultipleBidders = bidders.length > 1;
  let paysAmount = hasMultipleBidders ? bidders[1].dkp + 1 : null;

  const closeBid = async () => {
    await window.electron.ipcRenderer.invoke("close-bid", { itemName, bidders });
  };

  return (
    <div className="bid">
      <div className="item-name text-primary bold" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleItemClick}>
        {itemName}
      </div>
      <div className="bidders">
        {bidders.map((bidder, index) => (
          <Bidder key={index} index={index} bidder={bidder} paysAmount={index === 0 && hasMultipleBidders ? paysAmount : null} findCurrentDKP={findCurrentDKP} />
        ))}
      </div>
      <div className="bid-bottom">
        <div
          className="bid-close text-primary"
          onClick={closeBid}
          onMouseEnter={() => window.electron.ipcRenderer.send("disable-only-click-through")}
          onMouseLeave={() => window.electron.ipcRenderer.send("enable-only-click-through")}
        >
          Close Bid
        </div>
        <span className="timer">{timer}</span>
      </div>
    </div>
  );
}

export default Bid;
