import React, { useState, useEffect, useRef } from "react";
import Bids from "./Bids";
import Rolls from "./Rolls";
import GuildDKP from "./GuildDKP";
import ClosedBids from "./ClosedBids";
import "./DkpAndLoot.scss";

function DkpAndLoot({ sortedData }) {
  const [isDkpListVisible, setIsDkpListVisible] = useState(false);
  const [isClosedBidsVisible, setIsClosedBidsVisible] = useState(false);

  const toggleDkpListVisibility = () => {
    setIsDkpListVisible(!isDkpListVisible);
  };

  const toggleClosedBidsVisibility = () => {
    setIsClosedBidsVisible(!isClosedBidsVisible);
  };

  return (
    <div className="dkp-container">
      <h3>Active Bids</h3>
      <Bids dkp={sortedData} />
      <hr />
      <h3>Rolls</h3>
      <Rolls />
      <hr />
      <h3 onClick={toggleDkpListVisibility} style={{ cursor: "pointer" }}>
        Guild DKP {isDkpListVisible ? "-" : "+"}
      </h3>
      {isDkpListVisible && <GuildDKP sortedData={sortedData} />}
      <hr />
      <h3 onClick={toggleClosedBidsVisibility} style={{ cursor: "pointer" }}>
        Closed Bids {isClosedBidsVisible ? "-" : "+"}
      </h3>
      {isClosedBidsVisible && <ClosedBids />}
      <hr />
    </div>
  );
}
export default DkpAndLoot;
