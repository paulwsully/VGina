import React from "react";

function CharacterSelect({ id, value, onChange, characters, loadingCharacters }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(characters.find((character) => character.id === e.target.value))} disabled={loadingCharacters}>
      <option value="">Select a character...</option>
      {characters.map((character) => (
        <option key={character.id} value={character.id}>
          {character.name}
        </option>
      ))}
    </select>
  );
}

export default CharacterSelect;
