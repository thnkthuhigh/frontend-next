"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Editor } from "@tiptap/react";

interface EditorContextType {
    editor: Editor | null;
    setEditor: (editor: Editor | null) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
    const [editor, setEditorState] = useState<Editor | null>(null);

    const setEditor = useCallback((newEditor: Editor | null) => {
        setEditorState(newEditor);
    }, []);

    return (
        <EditorContext.Provider value={{ editor, setEditor }}>
            {children}
        </EditorContext.Provider>
    );
}

export function useEditorContext() {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error("useEditorContext must be used within an EditorProvider");
    }
    return context;
}
