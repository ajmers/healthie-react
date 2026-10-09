import { createContext, useContext, useState, useEffect } from "react";
import "./App.css";
import { Puck, createUsePuck } from "@puckeditor/core";
import type { Config, Data, Slot } from "@puckeditor/core";
import Rocketship from "./components/Rocketship";
import "@puckeditor/core/puck.css";

type Character = {
  id: string;
  name: string;
  image: string;
};

function fetchCharacters(): Promise<Character[]> {
  return fetch("https://rickandmortyapi.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "{ characters { results { id name image } } }",
    }),
  })
    .then((response) => response.json())
    .then((json) => json.data.characters.results);
}

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

type ColumnSlot = (typeof columns)[number]["slot"];

type Position = { column: ColumnSlot; index: number };

// The smallest record of a board edit that is enough to reverse it. A reorder
// is a move whose from and to are in the same column.
type Change =
  | { type: "add"; cardId: string; column: ColumnSlot }
  | { type: "move"; cardId: string; from: Position; to: Position };

// Returns the board as it was before the given change was made.
function revert(board: Partial<BoardProps>, change: Change) {
  if (change.type === "add") {
    return {
      ...board,
      [change.column]: (board[change.column] ?? []).filter(
        (card) => card.props.id !== change.cardId,
      ),
    };
  }
  const moved = board[change.to.column] ?? [];
  const index = moved.findIndex((card) => card.props.id === change.cardId);
  if (index === -1) return board;
  const without = { ...board, [change.to.column]: moved.toSpliced(index, 1) };
  return {
    ...without,
    [change.from.column]: (without[change.from.column] ?? []).toSpliced(
      change.from.index,
      0,
      moved[index],
    ),
  };
}

// Puck names each column's drop zone "root:<slot>".
function columnOfZone(zone: string) {
  return columns.find((column) => `root:${column.slot}` === zone)?.slot;
}

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

function UndoButton(props: { changes: Change[]; onUndone: () => void }) {
  const dispatch = usePuck((state) => state.dispatch);
  const last = props.changes.at(-1);
  return (
    <button
      type="button"
      className="undo-button"
      disabled={!last}
      onClick={() => {
        if (!last) return;
        dispatch({
          type: "setData",
          data: (data) => {
            const board = data.root.props as Partial<BoardProps> | undefined;
            const root = { ...data.root, props: revert(board ?? {}, last) };
            return { root: root as Data["root"] };
          },
        });
        props.onUndone();
      }}
    >
      Undo
    </button>
  );
}

function NewItemForm(props: {
  characters: Character[];
  onAdd: (change: Change) => void;
}) {
  const dispatch = usePuck((state) => state.dispatch);
  const [formState, setState] = useState<CardProps>({
    name: "",
    characterId: "",
    status: "To Do",
  });
  return (
    <form
      className="new-item-form"
      onSubmit={(e) => {
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
        props.onAdd({ type: "add", cardId: card.props.id, column: "todo" });
        setState({ ...formState, name: "", characterId: "" });
      }}
    >
      <h3>New item</h3>
      <input
        type="text"
        placeholder="New item"
        required
        value={formState.name}
        onChange={(e) => setState({ ...formState, name: e.target.value })}
      />
      <select
        required
        value={formState.characterId}
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
      <button type="submit">Add</button>
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
  const [launching, setLaunching] = useState(false);
  // Undo stack: every add, move and reorder since the page loaded.
  const [changes, setChanges] = useState<Change[]>([]);
  const record = (change: Change) => setChanges((all) => [...all, change]);
  useEffect(() => {
    fetchCharacters().then((results) => {
      setCharacters(results);
      setCharactersById(indexById(results));
      store(CHARACTERS_KEY, results);
    });
  }, []);

  return (
    <CharactersContext.Provider value={charactersById}>
      <Puck
        config={config}
        data={board}
        iframe={{ enabled: false }}
        onAction={(action, _state, previous) => {
          if (action.type !== "move") return;
          if (
            action.destinationZone === "root:done" &&
            action.sourceZone !== action.destinationZone
          ) {
            setLaunching(true);
          }
          const fromColumn = columnOfZone(action.sourceZone);
          const toColumn = columnOfZone(action.destinationZone);
          if (!fromColumn || !toColumn) return;
          const from = { column: fromColumn, index: action.sourceIndex };
          const to = { column: toColumn, index: action.destinationIndex };
          if (from.column === to.column && from.index === to.index) return;
          const board = previous.data.root.props as
            Partial<BoardProps> | undefined;
          const cardId = board?.[from.column]?.[from.index]?.props.id;
          if (cardId) record({ type: "move", cardId, from, to });
        }}
        onChange={(data) => {
          console.log("Data:", data);
          console.log("Board:", data.root.props);
          store(BOARD_KEY, data);
        }}
      >
        <StatusSync />
        <NewItemForm characters={characters} onAdd={record} />
        <UndoButton
          changes={changes}
          onUndone={() => setChanges((all) => all.slice(0, -1))}
        />
        <Puck.Preview />
      </Puck>
      {launching && <Rocketship onDone={() => setLaunching(false)} />}
    </CharactersContext.Provider>
  );
}

export default App;
