import React from "react";

function GuildDKP({ sortedData }) {
  return (
    <div className="dkp-list">
      {Object.entries(sortedData)
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
  );
}

export default GuildDKP;
