import React, { useEffect, useState, useRef } from "react";
import "./Dkp.scss";
import Bids from "./Bids";
import Rolls from "./Rolls";

function Dkp() {
  const [data, setData] = useState(null);
  const [sortedData, setSortedData] = useState(null);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  const sortByClass = (data) => {
    const sorted = {};
    data.Models.forEach((character) => {
      const characterClass = character.CharacterClass;
      if (!sorted[characterClass]) {
        sorted[characterClass] = [];
      }
      sorted[characterClass].push(character);
    });
    return sorted;
  };

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;

      const fetchData = async () => {
        try {
          const response = await fetch("https://7gnjtigho4.execute-api.us-east-2.amazonaws.com/prod/dkp", {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json, fsdftext/plain",
              clientid: "8c6625795510c",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const jsonData = await response.json();
          setData(jsonData);
          const sorted = sortByClass(jsonData);
          setSortedData(sorted);
        } catch (error) {
          console.error("Error fetching data:", error);
          setError(error);
        }
      };

      fetchData();
    }
  }, []);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!sortedData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dkp-container">
      <h3>Live Bids</h3>
      <Bids dkp={sortedData} />
      <hr />
      <h3>Rolls</h3>
      <Rolls />
      <hr />
      <h3>Guild DKP</h3>
      <div className="dkp-list">
        {sortedData &&
          Object.entries(sortedData)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([characterClass, characters]) => (
              <div key={characterClass} className="class-group">
                <h3>{characterClass}</h3>
                {characters
                  .sort((a, b) => b.CurrentDKP - a.CurrentDKP)
                  .map((character) => (
                    <div key={character.IdCharacter} className="character">
                      <div className="dkp-amt bold text-primary">{character.CurrentDKP}</div> {character.CharacterName}
                    </div>
                  ))}
              </div>
            ))}
      </div>
    </div>
  );
}

export default Dkp;
