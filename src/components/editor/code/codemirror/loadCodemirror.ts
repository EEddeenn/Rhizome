import type { EditorView } from "@codemirror/view";

export interface CodeMirrorModules {
  EditorView: typeof import("@codemirror/view").EditorView;
  EditorState: typeof import("@codemirror/state").EditorState;
  lineNumbers: typeof import("@codemirror/view").lineNumbers;
  highlightActiveLine: typeof import("@codemirror/view").highlightActiveLine;
  highlightActiveLineGutter: typeof import("@codemirror/view").highlightActiveLineGutter;
  keymap: typeof import("@codemirror/view").keymap;
  dropCursor: typeof import("@codemirror/view").dropCursor;
  drawSelection: typeof import("@codemirror/view").drawSelection;
  markdown: typeof import("@codemirror/lang-markdown").markdown;
  markdownLanguage: typeof import("@codemirror/lang-markdown").markdownLanguage;
  defaultHighlightStyle: typeof import("@codemirror/language").defaultHighlightStyle;
  syntaxHighlighting: typeof import("@codemirror/language").syntaxHighlighting;
  bracketMatching: typeof import("@codemirror/language").bracketMatching;
  indentOnInput: typeof import("@codemirror/language").indentOnInput;
  languages: typeof import("@codemirror/language-data").languages;
  autocompletion: typeof import("@codemirror/autocomplete").autocompletion;
  closeBrackets: typeof import("@codemirror/autocomplete").closeBrackets;
  closeBracketsKeymap: typeof import("@codemirror/autocomplete").closeBracketsKeymap;
  completionKeymap: typeof import("@codemirror/autocomplete").completionKeymap;
  defaultKeymap: typeof import("@codemirror/commands").defaultKeymap;
  history: typeof import("@codemirror/commands").history;
  historyKeymap: typeof import("@codemirror/commands").historyKeymap;
}

let cachedModules: CodeMirrorModules | null = null;
let modulesPromise: Promise<CodeMirrorModules> | null = null;

export async function loadCodeMirrorModules(): Promise<CodeMirrorModules> {
  if (cachedModules) return cachedModules;
  if (modulesPromise) return modulesPromise;

  modulesPromise = Promise.all([
    import("@codemirror/view"),
    import("@codemirror/state"),
    import("@codemirror/lang-markdown"),
    import("@codemirror/language"),
    import("@codemirror/language-data"),
    import("@codemirror/autocomplete"),
    import("@codemirror/commands"),
  ]).then(([
    view,
    state,
    markdownMod,
    language,
    languageData,
    autocomplete,
    commands,
  ]) => {
    cachedModules = {
      EditorView: view.EditorView,
      EditorState: state.EditorState,
      lineNumbers: view.lineNumbers,
      highlightActiveLine: view.highlightActiveLine,
      highlightActiveLineGutter: view.highlightActiveLineGutter,
      keymap: view.keymap,
      dropCursor: view.dropCursor,
      drawSelection: view.drawSelection,
      markdown: markdownMod.markdown,
      markdownLanguage: markdownMod.markdownLanguage,
      defaultHighlightStyle: language.defaultHighlightStyle,
      syntaxHighlighting: language.syntaxHighlighting,
      bracketMatching: language.bracketMatching,
      indentOnInput: language.indentOnInput,
      languages: languageData.languages,
      autocompletion: autocomplete.autocompletion,
      closeBrackets: autocomplete.closeBrackets,
      closeBracketsKeymap: autocomplete.closeBracketsKeymap,
      completionKeymap: autocomplete.completionKeymap,
      defaultKeymap: commands.defaultKeymap,
      history: commands.history,
      historyKeymap: commands.historyKeymap,
    };
    return cachedModules;
  });

  return modulesPromise;
}

export type { EditorView };
