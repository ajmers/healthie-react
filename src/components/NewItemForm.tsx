import { useState } from "react";
import type { Character, Item } from "../types";

type NewItemFormProps = {
  characters: Character[];
  onAdd: (item: Item) => void;
};

export default function NewItemForm(props: NewItemFormProps) {
  const [name, setName] = useState("");
  const [characterId, setCharacterId] = useState("");
  return (
    <form
      className="new-item-form"
      onSubmit={(e) => {
        e.preventDefault();
        props.onAdd({ id: crypto.randomUUID(), name, characterId });
        setName("");
        setCharacterId("");
      }}
    >
      <h3>New item</h3>
      <input
        type="text"
        placeholder="New item"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        required
        value={characterId}
        onChange={(e) => setCharacterId(e.target.value)}
      >
        <option value="">Select a character</option>
        {props.characters.map((character) => (
          <option key={character.id} value={character.id}>
            {character.name}
          </option>
        ))}
      </select>
      <button type="submit">Add</button>
    </form>
  );
}
