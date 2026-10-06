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
  status: string;
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

function Card(props: CardProps) {
  const characters = useContext(CharactersContext);
  return (
    <div className="card">
      <h4>{props.name}</h4>
      <img
        style={{ width: "80%" }}
        src={characters[props.characterId]?.image}
      />
      <p>Status: {props.status}</p>
    </div>
  );
}

const config: Config<{ components: { Card: CardProps }; root: BoardProps }> = {
  components: {
    Card: {
      fields: {
        name: { type: "text" },
        characterId: { type: "text" },
        status: { type: "text" },
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
              <Cards
                style={{ display: "flex", flex: 1, flexDirection: "column" }}
                minEmptyHeight={200}
              />
            </section>
          );
        })}
      </div>
    ),
  },
};

const usePuck = createUsePuck<typeof config>();

// Keeps each card's status equal to the title of the column it sits in.
function StatusSync() {
  const dispatch = usePuck((state) => state.dispatch);
  const board = usePuck((state) => state.appState.data.root.props) as
    Partial<BoardProps> | undefined;
  useEffect(() => {
    const outOfSync = columns.some((column) =>
      (board?.[column.slot] ?? []).some(
        (card) => card.props.status !== column.title,
      ),
    );
    if (!outOfSync) return;
    dispatch({
      type: "setData",
      data: (data) => {
        const current = data.root.props as Partial<BoardProps> | undefined;
        const synced = Object.fromEntries(
          columns.map((column) => [
            column.slot,
            (current?.[column.slot] ?? []).map((card) => ({
              ...card,
              props: { ...card.props, status: column.title },
            })),
          ]),
        );
        const root = { ...data.root, props: { ...current, ...synced } };
        return { root: root as Data["root"] };
      },
    });
  }, [board, dispatch]);
  return null;
}

function NewItemForm(props: { characters: Character[] }) {
  const dispatch = usePuck((state) => state.dispatch);
  const [formState, setState] = useState<CardProps>({
    name: "",
    characterId: "",
    status: "To Do",
  });
  return (
    <form className="new-item-form">
      <h3>New item</h3>
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

const BOARD_KEY = "healthie-react:board";
const CHARACTERS_KEY = "healthie-react:characters";

function loadStored<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable or full; the app still works without it
  }
}

function indexById(characters: Character[]) {
  return Object.fromEntries(
    characters.map((character) => [character.id, character]),
  );
}

function App() {
  const [board] = useState(() => loadStored(BOARD_KEY, initialData));
  const [characters, setCharacters] = useState<Character[]>(() =>
    loadStored(CHARACTERS_KEY, []),
  );
  const [charactersById, setCharactersById] = useState<
    Record<string, Character>
  >(() => indexById(loadStored(CHARACTERS_KEY, [])));
  console.log("Characters:", characters);
  console.log("CharactersById:", charactersById);
  useEffect(() => {
    fetchCharacters().then((data) => {
      setCharacters(data.results);
      setCharactersById(indexById(data.results));
      store(CHARACTERS_KEY, data.results);
    });
  }, []);

  return (
    <CharactersContext.Provider value={charactersById}>
      <Puck
        config={config}
        data={board}
        iframe={{ enabled: false }}
        onChange={(data) => {
          console.log("Board:", data.root.props);
          store(BOARD_KEY, data);
        }}
      >
        <StatusSync />
        <NewItemForm characters={characters} />
        <Puck.Preview />
      </Puck>
    </CharactersContext.Provider>
  );
}

export default App;
