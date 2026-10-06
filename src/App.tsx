import { createContext, useContext, useState, useEffect } from "react";
import "./App.css";
import { Puck, createUsePuck } from "@puckeditor/core";
import type { Config, Data, Slot } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

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

type CardProps = {
  name: string;
  characterId: string;
};

type BoardProps = {
  todo: Slot;
  doing: Slot;
  done: Slot;
};

const columns = [
  { slot: "todo", id: "left", title: "To Do" },
  { slot: "doing", id: "center", title: "Doing" },
  { slot: "done", id: "right", title: "Done" },
] as const;

const CharactersContext = createContext<Record<string, Character>>({});
const StatusContext = createContext("");

function Card(props: CardProps) {
  const characters = useContext(CharactersContext);
  const status = useContext(StatusContext);
  return (
    <div
      style={{
        width: "60%",
        margin: "10px",
        padding: "10px",
        border: "1px solid #ccc",
      }}
    >
      <h4>{props.name}</h4>
      <img
        style={{ width: "80%" }}
        src={characters[props.characterId]?.image}
      />
      <p>Status: {status}</p>
    </div>
  );
}

const config: Config<{ components: { Card: CardProps }; root: BoardProps }> = {
  components: {
    Card: {
      fields: {
        name: { type: "text" },
        characterId: { type: "text" },
      },
      render: Card,
    },
  },
  root: {
    fields: {
      todo: { type: "slot", allow: ["Card"] },
      doing: { type: "slot", allow: ["Card"] },
      done: { type: "slot", allow: ["Card"] },
    },
    render: (props) => (
      <div style={{ display: "flex", flexDirection: "row" }}>
        {columns.map((column) => {
          const Cards = props[column.slot];
          return (
            <section
              key={column.id}
              id={column.id}
              style={{ display: "flex", flex: 1, flexDirection: "column" }}
            >
              <h3 style={{ alignSelf: "begin" }}>{column.title}</h3>
              <StatusContext.Provider value={column.title}>
                <Cards
                  style={{ display: "flex", flex: 1, flexDirection: "column" }}
                  minEmptyHeight={200}
                />
              </StatusContext.Provider>
            </section>
          );
        })}
      </div>
    ),
  },
};

const usePuck = createUsePuck<typeof config>();

function NewItemForm(props: { characters: Character[] }) {
  const dispatch = usePuck((state) => state.dispatch);
  const [formState, setState] = useState<CardProps>({
    name: "",
    characterId: "",
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
          const card = {
            type: "Card",
            props: { ...formState, id: `Card-${crypto.randomUUID()}` },
          };
          dispatch({
            type: "setData",
            data: (data) => {
              const board = data.root.props as Partial<BoardProps> | undefined;
              const root = {
                ...data.root,
                props: { ...board, todo: [...(board?.todo ?? []), card] },
              };
              return { root: root as Data["root"] };
            },
          });
        }}
      >
        Add
      </button>
    </form>
  );
}

const initialData = {
  root: { props: { todo: [], doing: [], done: [] } },
  content: [],
};

function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersById, setCharactersById] = useState<
    Record<string, Character>
  >({});
  console.log("Characters:", characters);
  console.log("CharactersById:", charactersById);
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

  return (
    <CharactersContext.Provider value={charactersById}>
      <Puck
        config={config}
        data={initialData}
        iframe={{ enabled: false }}
        onChange={(data) => console.log("Board:", data.root.props)}
      >
        <NewItemForm characters={characters} />
        <Puck.Preview />
      </Puck>
    </CharactersContext.Provider>
  );
}

export default App;
