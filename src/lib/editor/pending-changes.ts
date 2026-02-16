export type PendingChangeType = "create" | "update" | "delete";

export interface PendingChange {
  path: string;
  type: PendingChangeType;
  content?: string;
  originalSha?: string;
  isBinary?: boolean;
  timestamp: number;
}

export interface PendingChangesData {
  changes: Record<string, PendingChange>;
}

const STORAGE_KEY = "rhizome_pending_changes";

export class PendingChangesStore {
  private data: PendingChangesData;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = this.load();
  }

  private load(): PendingChangesData {
    if (typeof window === "undefined") {
      return { changes: {} };
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      console.warn("Failed to load pending changes");
    }
    return { changes: {} };
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      console.warn("Failed to save pending changes");
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): PendingChangesData {
    return this.data;
  }

  get hasPendingChanges(): boolean {
    return Object.keys(this.data.changes).length > 0;
  }

  get pendingCount(): number {
    return Object.keys(this.data.changes).length;
  }

  getChange(path: string): PendingChange | undefined {
    return this.data.changes[path];
  }

  getAllChanges(): PendingChange[] {
    return Object.values(this.data.changes);
  }

  addCreate(path: string, content: string, isBinary = false): void {
    const existing = this.data.changes[path];
    
    if (existing?.type === "delete") {
      delete this.data.changes[path];
    }
    
    if (existing?.type === "create" || existing?.type === "update") {
      this.data.changes[path] = {
        ...existing,
        content,
        timestamp: Date.now(),
      };
    } else {
      this.data.changes[path] = {
        path,
        type: "create",
        content,
        isBinary,
        timestamp: Date.now(),
      };
    }
    
    this.save();
    this.notify();
  }

  addUpdate(path: string, content: string, originalSha: string | undefined, isBinary = false): void {
    const existing = this.data.changes[path];
    
    if (existing?.type === "delete") {
      return;
    }
    
    if (existing?.type === "create") {
      this.data.changes[path] = {
        ...existing,
        content,
        timestamp: Date.now(),
      };
    } else {
      this.data.changes[path] = {
        path,
        type: "update",
        content,
        originalSha,
        isBinary,
        timestamp: Date.now(),
      };
    }
    
    this.save();
    this.notify();
  }

  addDelete(path: string, originalSha?: string): void {
    const existing = this.data.changes[path];
    
    if (existing?.type === "create") {
      delete this.data.changes[path];
      this.save();
      this.notify();
      return;
    }
    
    this.data.changes[path] = {
      path,
      type: "delete",
      originalSha,
      timestamp: Date.now(),
    };
    
    this.save();
    this.notify();
  }

  removeChange(path: string): void {
    if (this.data.changes[path]) {
      delete this.data.changes[path];
      this.save();
      this.notify();
    }
  }

  clear(): void {
    this.data = { changes: {} };
    this.save();
    this.notify();
  }
}

export const pendingChanges = new PendingChangesStore();

export function usePendingChanges(): PendingChangesData & {
  pendingCount: number;
  hasPendingChanges: boolean;
} {
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    return pendingChanges.subscribe(() => forceUpdate((n) => n + 1));
  }, []);
  
  const snapshot = pendingChanges.getSnapshot();
  return {
    ...snapshot,
    pendingCount: pendingChanges.pendingCount,
    hasPendingChanges: pendingChanges.hasPendingChanges,
  };
}

import { useEffect, useState } from "react";
