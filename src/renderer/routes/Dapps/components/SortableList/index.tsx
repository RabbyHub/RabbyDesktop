/* eslint-disable @typescript-eslint/no-shadow */
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  Active,
  MouseSensor,
  DragOverlay,
} from '@dnd-kit/core';
import { useTransition, animated, AnimatedProps } from '@react-spring/web';

import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

import React, {
  CSSProperties,
  PropsWithChildren,
  ReactNode,
  useMemo,
  useState,
} from 'react';
import { DAppBlock } from '../DAppBlock';

export const SortableItem = (
  props: PropsWithChildren<{
    id: string | number;
    style?: AnimatedProps<{ style: CSSProperties }>['style'];
  }>
) => {
  const { id, children, style: s } = props;
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  // const context = useMemo(
  //   () => ({
  //     attributes,
  //     listeners,
  //     ref: setActivatorNodeRef,
  //   }),
  //   [attributes, listeners, setActivatorNodeRef]
  // );
  const style = useMemo(
    () => ({
      opacity: isDragging ? 0.4 : undefined,
      transform: CSS.Translate.toString(transform),
      transition,
      outline: 'none',
      ...s,
    }),
    [isDragging, transform, transition, s]
  );

  return (
    <animated.div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </animated.div>
  );
};

interface SortableListProps {
  data?: IDappWithTabInfo[];
  onChange?(items: IDappWithTabInfo[]): void;
  renderItem?(item: IDappWithTabInfo): ReactNode;
}
export const SortableList = ({
  data = [],
  onChange,
  renderItem,
}: SortableListProps) => {
  const items = useMemo(
    () => data.map((item) => ({ ...item, id: item.origin })),
    [data]
  );
  const [active, setActive] = useState<Active | null>(null);
  const activeItem = useMemo(
    () => items.find((item) => item.id === active?.id),
    [active, items]
  );
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const transitions = useTransition(items, {
    initial: { scale: 1, opacity: 1 },
    enter: { scale: 1, opacity: 1 },
    leave: { scale: 0, opacity: 0 },
    config: { duration: 300 },
    keys: (d) => d?.origin,
  });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => {
        setActive(active);
      }}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over?.id) {
          const activeIndex = items.findIndex(({ id }) => id === active.id);
          const overIndex = items.findIndex(({ id }) => id === over.id);

          onChange?.(arrayMove(items, activeIndex, overIndex));
        }
        setActive(null);
      }}
      onDragCancel={() => {
        setActive(null);
      }}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        {transitions((style, item) => {
          return (
            <SortableItem id={item.id} key={item.id} style={style}>
              {renderItem?.(item)}
            </SortableItem>
          );
        })}
        <DragOverlay>
          {activeItem ? renderItem?.(activeItem) : null}
        </DragOverlay>
      </SortableContext>
    </DndContext>
  );
};
