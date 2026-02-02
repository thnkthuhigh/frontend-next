import { create } from "zustand";
import { Editor } from "@tiptap/react";

interface EditorStore {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  isEditorFocused: boolean;
  setEditorFocused: (focused: boolean) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
  isEditorFocused: false,
  setEditorFocused: (focused) => set({ isEditorFocused: focused }),
}));
