import { create } from "zustand";
import { Editor } from "@tiptap/react";

interface EditorStore {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  isEditorFocused: boolean;
  setEditorFocused: (focused: boolean) => void;
  // P1-011: Track AI panel state for adaptive toast positioning
  isAIPanelOpen: boolean;
  setAIPanelOpen: (open: boolean) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
  isEditorFocused: false,
  setEditorFocused: (focused) => set({ isEditorFocused: focused }),
  // P1-011: AI panel state
  isAIPanelOpen: false,
  setAIPanelOpen: (open) => set({ isAIPanelOpen: open }),
}));
