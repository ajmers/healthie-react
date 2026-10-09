import type { ComponentProps } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Character, Item } from "../types";

type CardProps = {
  item: Item;
  character?: Character;
  status: string;
};

export function Card({
  item,
  character,
  status,
  ...divProps
}: CardProps & ComponentProps<"div">) {
  return (
    <div className="card" {...divProps}>
      <h4>{item.name}</h4>
      <img
        style={{ width: "80%" }}
        src={character?.image}
        alt={character?.name ?? ""}
        draggable={false}
      />
      <p>Status: {status}</p>
    </div>
  );
}

export function SortableCard(props: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id });
  return (
    <Card
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
      {...props}
    />
  );
}
