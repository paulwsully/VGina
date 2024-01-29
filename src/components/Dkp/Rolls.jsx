import React, { useState, useEffect } from "react";

function Rolls() {
  const [rolls, setRolls] = useState([]);

  useEffect(() => {
    const getRolls = async () => {
      try {
        const currentRolls = await window.electron.ipcRenderer.invoke("get-rolls");
        if (Array.isArray(currentRolls)) {
          // Sort rollers for each roll by roll value in descending order
          const sortedRolls = currentRolls.map((roll) => {
            return {
              ...roll,
              rollers: roll.rollers.slice().sort((a, b) => b.roll - a.roll),
            };
          });
          setRolls(sortedRolls);
        } else {
          console.error("Received data is not an array:", currentRolls);
        }
      } catch (err) {
        console.error("Error fetching rolls:", err);
      }
    };

    const rollsUpdated = async () => {
      await getRolls();
    };

    window.electron.ipcRenderer.on("rolls-updated", rollsUpdated);
    getRolls();

    return () => {
      window.electron.ipcRenderer.removeAllListeners("rolls-updated");
    };
  }, []);

  const closeRoll = async (rollMax) => {
    try {
      await window.electron.ipcRenderer.invoke("close-roll", rollMax);
    } catch (err) {
      console.error("Error closing roll:", err);
    }
  };

  return (
    <div className="rolls">
      {rolls.length === 0 && <div className="null-message">No rolls active</div>}
      {rolls.map((roll, index) => (
        <div className="roll-group" key={index}>
          <h3>Roll: {roll.rollMax}</h3>
          <div className="rolls">
            {roll.rollers.map((roller, rollerIndex) => (
              <div className="roll" key={rollerIndex}>
                {roller.name} | {roller.roll}
              </div>
            ))}
          </div>
          <div className="bid-close text-primary" onClick={() => closeRoll(roll.rollMax)}>
            Close Roll
          </div>
        </div>
      ))}
    </div>
  );
}

export default Rolls;
