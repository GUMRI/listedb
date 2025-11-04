import type { Doc, SyncState } from '@automerge/automerge';
import type { SyncEngine } from './sync.engine.js';

export abstract class LocalAdapter {
    abstract get<T>(docId: string): Promise<Doc<T> | null>;
    abstract set<T>(docId: string, doc: Doc<T>): Promise<void>;
    abstract getSyncState(peerId: string): Promise<SyncState | null>;
    abstract setSyncState(peerId: string, syncState: SyncState): Promise<void>;
    abstract queueMessage(message: Uint8Array): Promise<void>;
    abstract getQueuedMessages(): Promise<Uint8Array[]>;
    abstract clearQueuedMessages(): Promise<void>;
}

export abstract class RemoteAdapter {
    abstract connect(syncEngine: SyncEngine<any>): void;
    abstract disconnect(): void;
    abstract send(message: Uint8Array): Promise<void>;
}
