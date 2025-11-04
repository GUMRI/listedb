import { Doc, SyncState } from '@automerge/automerge';
import { LocalAdapter } from './adapters.js';

export class LocalMemoryAdapter extends LocalAdapter {
    private documents = new Map<string, Doc<any>>();
    private syncStates = new Map<string, SyncState>();
    private queuedMessages: Uint8Array[] = [];

    async get<T>(docId: string): Promise<Doc<T> | null> {
        return this.documents.get(docId) || null;
    }

    async set<T>(docId: string, doc: Doc<T>): Promise<void> {
        this.documents.set(docId, doc);
    }

    async getSyncState(peerId: string): Promise<SyncState | null> {
        return this.syncStates.get(peerId) || null;
    }

    async setSyncState(peerId: string, syncState: SyncState): Promise<void> {
        this.syncStates.set(peerId, syncState);
    }

    async queueMessage(message: Uint8Array): Promise<void> {
        this.queuedMessages.push(message);
    }

    async getQueuedMessages(): Promise<Uint8Array[]> {
        return this.queuedMessages;
    }

    async clearQueuedMessages(): Promise<void> {
        this.queuedMessages = [];
    }
}
