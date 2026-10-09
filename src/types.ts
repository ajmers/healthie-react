export type Character = {
  id: string;
  name: string;
  image: string;
};

export type Item = {
  id: string;
  name: string;
  characterId: string;
};

export const columns = [
  { id: "todo", title: "To Do" },
  { id: "doing", title: "Doing" },
  { id: "done", title: "Done" },
] as const;

export type ColumnId = (typeof columns)[number]["id"];

// The column an item sits in is its status; items don't store it themselves.
export type Board = Record<ColumnId, Item[]>;
