import { useState, useEffect } from "react";
import "./App.css";

function fetchCharacters() {
  return fetch("https://rickandmortyapi.com/api/character").then((response) =>
    response.json(),
  );
}

type Character = {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  image: string;
};

type Item = {
  name: string;
  characterId: string;
  status: string;
};

function NewItemForm(props: {
  characters: Character[];
  items: Item[];
  addItem: (items: Item[]) => void;
}) {
  const [formState, setState] = useState<Item>({
    name: "",
    characterId: "",
    status: "To Do",
  });
  return (
    <form
      style={{
        width: "20%",
        margin: "20px",
        display: "flex",
        gap: "10px",
        flexDirection: "column",
      }}
    >
      <input
        type="text"
        placeholder="New item"
        onChange={(e) => setState({ ...formState, name: e.target.value })}
      />
      <select
        onChange={(e) =>
          setState({ ...formState, characterId: e.target.value })
        }
      >
        <option value="" key={0}>
          Select a character
        </option>

        {props.characters.map((character) => (
          <option key={character.id} value={character.id}>
            {character.name}
          </option>
        ))}
      </select>
      <button
        onClick={(e) => {
          e.preventDefault();
          props.addItem([...props.items, formState]);
        }}
      >
        Add
      </button>
    </form>
  );
}

function Card(props: { item: Item; characters: Record<string, Character> }) {
  return (
    <div
      style={{
        width: "60%",
        margin: "10px",
        padding: "10px",
        border: "1px solid #ccc",
      }}
    >
      <h4>{props.item.name}</h4>
      <img
        style={{ width: "80%" }}
        src={props.characters[props.item.characterId]?.image}
      />
      <p>Status: {props.item.status}</p>
    </div>
  );
}

function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersById, setCharactersById] = useState<
    Record<string, Character>
  >({});
  console.log("Characters:", characters);
  console.log("CharactersById:", charactersById);
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    fetchCharacters().then((data) => {
      setCharacters(data.results);
      setCharactersById(
        Object.fromEntries(
          data.results.map((character: Character) => [character.id, character]),
        ),
      );
    });
  }, []);
  console.log("Items:", items);

  return (
    <>
      <NewItemForm characters={characters} items={items} addItem={setItems} />

      <div style={{ display: "flex", flexDirection: "row" }}>
        <section
          id="left"
          style={{ display: "flex", flex: 1, flexDirection: "column" }}
        >
          <h3 style={{ alignSelf: "begin" }}>To Do</h3>
          {items
            .filter((item) => item.status === "To Do")
            .map((item, index) => (
              <Card key={index} item={item} characters={charactersById} />
            ))}
        </section>

        <section
          id="center"
          style={{ display: "flex", flex: 1, flexDirection: "column" }}
        >
          <h3 style={{ alignSelf: "begin" }}>Doing</h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items
              .filter((item) => item.status === "Doing")
              .map((item, index) => (
                <Card key={index} item={item} characters={charactersById} />
              ))}
          </div>
        </section>
        <section
          id="right"
          style={{ display: "flex", flex: 1, flexDirection: "column" }}
        >
          <h3 style={{ alignSelf: "begin" }}>Done</h3>
        </section>
        {items
          .filter((item) => item.status === "Done")
          .map((item, index) => (
            <Card key={index} item={item} characters={charactersById} />
          ))}
      </div>
    </>
  );
}

export default App;
