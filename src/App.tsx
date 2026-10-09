import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Card } from "./components/Card";
import Column from "./components/Column";
import NewItemForm from "./components/NewItemForm";
import Rocketship from "./components/Rocketship";
import { columns } from "./types";
import type { Board, Character, ColumnId } from "./types";

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

const emptyBoard: Board = { todo: [], doing: [], done: [] };

const BOARD_KEY = "healthie-react:board-v2";
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

function indexById(characters: Character[]): Record<string, Character> {
  return Object.fromEntries(
    characters.map((character) => [character.id, character]),
  );
}

// A drag id is either a column's id or the id of an item inside a column.
function findColumn(board: Board, id: UniqueIdentifier): ColumnId | undefined {
  return columns.find(
    (column) =>
      column.id === id || board[column.id].some((item) => item.id === id),
  )?.id;
}

function App() {
  const [board, setBoard] = useState<Board>(() =>
    loadStored(BOARD_KEY, emptyBoard),
  );
  const [characters, setCharacters] = useState<Character[]>(() =>
    loadStored(CHARACTERS_KEY, []),
  );
  const charactersById = useMemo(() => indexById(characters), [characters]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [launching, setLaunching] = useState(false);
  // The board as it was when the current drag began.
  const boardBeforeDrag = useRef(board);

  useEffect(() => {
    fetchCharacters().then((results) => {
      setCharacters(results);
      store(CHARACTERS_KEY, results);
    });
  }, []);

  useEffect(() => {
    store(BOARD_KEY, board);
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    boardBeforeDrag.current = board;
    setActiveId(active.id);
  }

  // Moves the dragged item into another column as soon as it hovers over it.
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    setBoard((board) => {
      const from = findColumn(board, active.id);
      const to = findColumn(board, over.id);
      const item = from && board[from].find((item) => item.id === active.id);
      if (!from || !to || !item || from === to) return board;
      const overIndex = board[to].findIndex((item) => item.id === over.id);
      const index = overIndex === -1 ? board[to].length : overIndex;
      return {
        ...board,
        [from]: board[from].filter((item) => item.id !== active.id),
        [to]: [...board[to].slice(0, index), item, ...board[to].slice(index)],
      };
    });
  }

  // Reorders within the column, which handleDragOver has already settled.
  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const column = findColumn(board, active.id);
    if (!column) return;
    if (over && findColumn(board, over.id) === column) {
      const oldIndex = board[column].findIndex((item) => item.id === active.id);
      const newIndex = board[column].findIndex((item) => item.id === over.id);
      if (newIndex !== -1 && oldIndex !== newIndex) {
        setBoard({
          ...board,
          [column]: arrayMove(board[column], oldIndex, newIndex),
        });
      }
    }
    if (
      column === "done" &&
      findColumn(boardBeforeDrag.current, active.id) !== "done"
    ) {
      setLaunching(true);
    }
  }

  function handleDragCancel() {
    setActiveId(null);
    setBoard(boardBeforeDrag.current);
  }

  const activeColumn = columns.find(
    (column) => activeId !== null && column.id === findColumn(board, activeId),
  );
  const activeItem =
    activeColumn && board[activeColumn.id].find((item) => item.id === activeId);

  return (
    <>
      <NewItemForm
        characters={characters}
        onAdd={(item) => setBoard({ ...board, todo: [...board.todo, item] })}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="board">
          {columns.map((column) => (
            <Column
              key={column.id}
              id={column.id}
              title={column.title}
              items={board[column.id]}
              charactersById={charactersById}
            />
          ))}
        </div>
        <DragOverlay>
          {activeItem && (
            <Card
              item={activeItem}
              character={charactersById[activeItem.characterId]}
              status={activeColumn.title}
            />
          )}
        </DragOverlay>
      </DndContext>
      {launching && <Rocketship onDone={() => setLaunching(false)} />}
    </>
  );
}

export default App;
