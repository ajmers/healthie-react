import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCard } from "./Card";
import type { Character, ColumnId, Item } from "../types";

type ColumnProps = {
  id: ColumnId;
  title: string;
  items: Item[];
  charactersById: Record<string, Character>;
};

export default function Column(props: ColumnProps) {
  // Makes the column itself a drop target, so cards can land in an empty one.
  const { setNodeRef } = useDroppable({ id: props.id });
  return (
    <section className="column">
      <h3>{props.title}</h3>
      <SortableContext
        items={props.items}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="column-cards">
          {props.items.map((item) => (
            <SortableCard
              key={item.id}
              item={item}
              character={props.charactersById[item.characterId]}
              status={props.title}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}
