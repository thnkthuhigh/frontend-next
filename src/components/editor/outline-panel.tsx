"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  List,
  Quote,
  Code,
  Table,
  Minus,
  AlertCircle,
  Plus,
} from "lucide-react";
import { DocumentBlock, useDocumentStore } from "@/store/document-store";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Block type definitions
const blockTypes = [
  { type: "paragraph", label: "Para", icon: AlignLeft },
  { type: "heading1", label: "H1", icon: Heading1 },
  { type: "heading2", label: "H2", icon: Heading2 },
  { type: "heading3", label: "H3", icon: Heading3 },
  { type: "list", label: "List", icon: List },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "code_block", label: "Code", icon: Code },
  { type: "table", label: "Table", icon: Table },
  { type: "callout", label: "Note", icon: AlertCircle },
  { type: "divider", label: "Line", icon: Minus },
] as const;

const blockIcons: Record<string, React.ElementType> = {
  paragraph: AlignLeft,
  heading1: Heading1,
  heading2: Heading2,
  heading3: Heading3,
  list: List,
  quote: Quote,
  code_block: Code,
  table: Table,
  callout: AlertCircle,
  divider: Minus,
};

// Compact insert button for sidebar
function CompactInsertButton({ index }: { index: number }) {
  const { blocks, setBlocks } = useDocumentStore();

  const handleInsert = (type: DocumentBlock["type"]) => {
    const newBlock: DocumentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: "",
      meta: type === "list" ? { items: [""] } :
        type === "table" ? { headers: ["Header 1", "Header 2"], rows: [["Cell 1", "Cell 2"]] } :
          type === "code_block" ? { language: "text" } :
            type === "callout" ? { calloutStyle: "info" } : undefined
    };

    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    setBlocks(newBlocks);
  };

  return (
    <div className="relative group/insert py-1 flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full bg-background border border-border p-0.5 text-muted-foreground hover:text-primary hover:border-primary transition-all opacity-0 group-hover/insert:opacity-100 scale-90 group-hover/insert:scale-100">
            <Plus size={12} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-40 p-1">
          <div className="grid grid-cols-2 gap-0.5">
            {blockTypes.map((b) => (
              <DropdownMenuItem
                key={b.type}
                onClick={() => handleInsert(b.type as DocumentBlock["type"])}
                className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer text-xs"
              >
                <b.icon size={12} className="text-primary" />
                <span>{b.label}</span>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Compact sortable block item for sidebar
interface CompactBlockItemProps {
  block: DocumentBlock;
  onRemove: (id: string) => void;
  onScrollTo: (id: string) => void;
}

function CompactBlockItem({ block, onRemove, onScrollTo }: CompactBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = blockIcons[block.type] || AlignLeft;

  const getPreviewText = () => {
    if (block.type === 'divider') return '—————';
    if (block.type === 'list' && block.meta?.items?.length) {
      return `${block.meta.items.length} items`;
    }
    if (block.type === 'table' && block.meta?.rows?.length) {
      return `${block.meta.rows.length} rows`;
    }
    if (!block.content) return `Empty ${block.type}`;
    return block.content.slice(0, 30) + (block.content.length > 30 ? '...' : '');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1.5 p-1.5 rounded-lg border transition-all cursor-pointer",
        isDragging
          ? "opacity-50 border-primary bg-primary/10 z-50 shadow-lg"
          : "border-transparent hover:border-border hover:bg-card/50"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 rounded hover:bg-secondary cursor-grab active:cursor-grabbing text-muted-foreground shrink-0"
      >
        <GripVertical size={12} />
      </button>

      {/* Block info - clickable to scroll */}
      <button
        onClick={() => onScrollTo(block.id)}
        className="flex-1 flex items-center gap-1.5 min-w-0 text-left"
      >
        <div className={cn(
          "p-1 rounded shrink-0",
          block.type.startsWith('heading') ? "bg-primary/20 text-primary" : "bg-secondary/50 text-muted-foreground"
        )}>
          <IconComponent size={10} />
        </div>
        <span className="text-[10px] text-muted-foreground truncate flex-1">
          {getPreviewText()}
        </span>
      </button>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(block.id);
        }}
        className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
}

// Main Outline Panel component
interface OutlinePanelProps {
  onScrollToBlock?: (blockId: string) => void;
}

export function OutlinePanel({ onScrollToBlock }: OutlinePanelProps) {
  const { blocks, moveBlock, removeBlock, syncBlocksToHtml } = useDocumentStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      moveBlock(oldIndex, newIndex);
      // Immediately sync to WYSIWYG after reordering
      syncBlocksToHtml();
    }
  };

  const handleScrollTo = (blockId: string) => {
    if (onScrollToBlock) {
      onScrollToBlock(blockId);
    }
  };

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-2 rounded-full bg-secondary/50 mb-2">
          <AlignLeft size={16} className="text-primary opacity-80" />
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          No blocks yet
        </p>
        <CompactInsertButton index={0} />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {blocks.length} Blocks
        </span>
      </div>

      {/* Sortable list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            <CompactInsertButton index={0} />
            {blocks.map((block, index) => (
              <div key={block.id}>
                <CompactBlockItem
                  block={block}
                  onRemove={removeBlock}
                  onScrollTo={handleScrollTo}
                />
                <CompactInsertButton index={index + 1} />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
