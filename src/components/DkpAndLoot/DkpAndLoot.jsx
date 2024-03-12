import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom"; // Make sure to import Navigate
import Bids from "./Bids";
import Rolls from "./Rolls";
import GuildDKP from "./GuildDKP";
import ClosedBids from "./ClosedBids";
import "./DkpAndLoot.scss";

function DkpAndLoot({ sortedData, fileName, user }) {
  const [isDkpListVisible, setIsDkpListVisible] = useState(false);
  const [isClosedBidsVisible, setIsClosedBidsVisible] = useState(false);
  const [isOfficer, setisOfficer] = useState(false);

  // These will obviously be removed once guild formation and management has been created.
  const officers = ["Mistabone", "Kazyras", "Panniq", "Broketoof", "Macail", "Vonerick", "Lianthia", "Meno", "Limpy", "Biggest", "Typheria", "Manie", "Laruso"];

  const toggleDkpListVisibility = () => {
    setIsDkpListVisible(!isDkpListVisible);
  };

  const toggleClosedBidsVisibility = () => {
    setIsClosedBidsVisible(!isClosedBidsVisible);
  };

  const checkIfIsOfficer = () => {
    setisOfficer(officers.includes(fileName));
  };

  useEffect(() => {
    checkIfIsOfficer();
  }, [fileName]); // Added fileName as a dependency

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="dkp-container">
      {isOfficer && (
        <>
          <h3>Bid Taking</h3>
          <Bids dkp={sortedData} />
          <hr />
        </>
      )}
      <h3>Rolls</h3>
      <Rolls />
      <hr />
      <h3 onClick={toggleDkpListVisibility} style={{ cursor: "pointer" }}>
        Guild DKP {isDkpListVisible ? "-" : "+"}
      </h3>
      {isDkpListVisible && <GuildDKP sortedData={sortedData} />}
      <hr />
      {isOfficer && (
        <>
          <h3 onClick={toggleClosedBidsVisibility} style={{ cursor: "pointer" }}>
            Closed Bids {isClosedBidsVisible ? "-" : "+"}
          </h3>
          {isClosedBidsVisible && <ClosedBids />}
          <hr />
        </>
      )}
    </div>
  );
}
export default DkpAndLoot;
