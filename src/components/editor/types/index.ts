export type { EditorConfig, TokenValidationResult, VaultAdapter } from "@/lib/editor";
export { GitHubApiError } from "@/lib/editor";

export type { MergedEntry, BuildManifest, RuntimeManifest } from "@/lib/manifest";

export type { ConnectionState, UseEditorConnectionReturn } from "../hooks/useEditorConnection";
export type { ManifestState, UseManifestOperationsReturn } from "../hooks/useManifestOperations";
export type { NoteState, UseNoteOperationsReturn } from "../hooks/useNoteOperations";
