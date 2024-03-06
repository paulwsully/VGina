import React, { useState, useEffect } from "react";
import Input from "../Utilities/Input";
import Checkbox from "../Utilities/Checkbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import Bidder from "./Bidder";

function Bid({ itemName, bidders = [], findCurrentDKP = "", isPublic = false, timestamp = "", bidId = "", isAlt = false }) {
  const [timer, setTimer] = useState("00:00");
  const [timerColor, setTimerColor] = useState("white");
  const [name, setname] = useState("white");
  const [bidDetails, setbidDetails] = useState({ amt: 1, isAlt: false, name: "", item: "" });
  const [dialogText, setdialogText] = useState("");

  const updateTimer = () => {
    const startTime = timestamp ? new Date(timestamp).getTime() : Date.now();
    const elapsedTime = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    setTimer(`${minutes}:${seconds}`);

    if (totalSeconds > 90) {
      setTimerColor("red");
    } else if (totalSeconds > 60) {
      setTimerColor("orange");
    } else if (totalSeconds > 30) {
      setTimerColor("yellow");
    } else {
      setTimerColor("white");
    }
  };

  useEffect(() => {
    setbidDetails((prev) => ({ ...prev, name: name }));
  }, [name]);

  useEffect(() => {
    const fetchname = async () => {
      const logFilePath = await window.electron.ipcRenderer.invoke("storeGet", "logFile");
      const nameMatch = logFilePath.match(/eqlog_(.+?)_pq.proj.txt/);
      setname(nameMatch ? nameMatch[1] : "Unknown");
    };

    fetchname();
  }, []);

  useEffect(() => {
    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [timestamp]);

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
  let paysAmount = hasMultipleBidders ? bidders[1].amt + 1 : null;

  const closeBid = async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke("close-bid", bidId);
      // window.electron.ipcRenderer.send("enable-only-click-through");
      window.electron.ipcRenderer.send("disable-only-click-through");
    } catch (error) {
      console.error("Error closing bid:", error);
    }
  };

  const handleInputChange = (field, value) => {
    const newValue = field === "amt" ? parseInt(value, 10) : value;
    const validValue = field === "amt" && isNaN(newValue) ? 0 : newValue;

    console.log(bidDetails, validValue, field);
    setbidDetails((prev) => ({ ...prev, [field]: validValue }));
  };

  const handleCheckboxChange = (field, isChecked) => {
    console.log(isChecked);
    setbidDetails((prev) => ({ ...prev, [field]: isChecked }));
  };

  const updateBid = async (details, successMessage, errorMessage) => {
    try {
      await window.electron.ipcRenderer.invoke("update-bid", details);
      setdialogText(successMessage);
    } catch (error) {
      console.error(errorMessage, error);
      setdialogText(errorMessage);
    } finally {
      setTimeout(() => setdialogText(""), 2000);
    }
  };

  const sendBid = () => {
    const details = { ...bidDetails, item: itemName };
    updateBid(details, "You have submitted your bid.", "Failed to update bid:");
  };

  const retract = () => {
    const details = { ...bidDetails, item: itemName, amt: 0 };
    updateBid(details, "You have retracted your bid.", "Failed to retract bid:");
  };

  return (
    <div className="bid" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="input-row">
        {isPublic && (
          <>
            <span className="timer" style={{ color: timerColor }}>
              {timer}
            </span>
            <span>|</span>
          </>
        )}
        <div className="item-name text-primary bold" onClick={handleItemClick}>
          {itemName}
        </div>
      </div>
      {!isPublic && (
        <div className="bidders">
          {bidders.map((bidder, index) => (
            <Bidder key={index} index={index} bidder={bidder} paysAmount={index === 0 && hasMultipleBidders ? paysAmount : null} findCurrentDKP={findCurrentDKP} />
          ))}
        </div>
      )}
      <div className="bid-bottom">
        {isPublic && (
          <>
            <div className="bid-actions">
              <div className="input-row">
                <Input id="bidAmount" placeholder="Bid" label="" onTextChange={(value) => handleInputChange("amt", value)} onEnter={() => updateBid({ ...bidDetails, item: itemName }, "You have submitted your bid.", "Failed to update bid:")} />
                <Checkbox id={`isAlt${bidId}`} label="Alt" onCheckChange={(checked) => handleCheckboxChange("isAlt", checked)} />
                <button className="pill" onClick={sendBid}>
                  <FontAwesomeIcon icon={faPaperPlane} /> Send
                </button>
                <button className="pill error" onClick={retract}>
                  <FontAwesomeIcon icon={faTrashAlt} /> Retract
                </button>
              </div>
            </div>
            {dialogText && <div className="dialog">{dialogText}</div>}
          </>
        )}
        {!isPublic && (
          <div className="bid-close pill" onClick={closeBid}>
            Close Bid
          </div>
        )}
      </div>
    </div>
  );
}

export default Bid;
