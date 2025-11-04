import { Doc, SyncState, save, load, initSyncState, decodeSyncState, encodeSyncState } from '@automerge/automerge';
import { LocalAdapter } from './adapters.js';

export class LocalStorageAdapter extends LocalAdapter {
    private prefix = 'automerge-doc-';
    private syncStatePrefix = 'automerge-sync-state-';
    private queuedMessagesKey = 'automerge-queued-messages';

    async get<T>(docId: string): Promise<Doc<T> | null> {
        const item = localStorage.getItem(this.prefix + docId);
        return item ? load<T>(this.base64ToUint8Array(item)) : null;
    }

    async set<T>(docId: string, doc: Doc<T>): Promise<void> {
        localStorage.setItem(this.prefix + docId, this.uint8ArrayToBase64(save(doc)));
    }

    async getSyncState(peerId: string): Promise<SyncState | null> {
        const item = localStorage.getItem(this.syncStatePrefix + peerId);
        return item ? decodeSyncState(this.base64ToUint8Array(item)) : initSyncState();
    }

    async setSyncState(peerId: string, syncState: SyncState): Promise<void> {
        localStorage.setItem(this.syncStatePrefix + peerId, this.uint8ArrayToBase64(encodeSyncState(syncState)));
    }

    async queueMessage(message: Uint8Array): Promise<void> {
        const messages = await this.getQueuedMessages();
        messages.push(message);
        localStorage.setItem(this.queuedMessagesKey, JSON.stringify(messages.map(this.uint8ArrayToBase64)));
    }

    async getQueuedMessages(): Promise<Uint8Array[]> {
        const item = localStorage.getItem(this.queuedMessagesKey);
        return item ? JSON.parse(item).map(this.base64ToUint8Array) : [];
    }

    async clearQueuedMessages(): Promise<void> {
        localStorage.removeItem(this.queuedMessagesKey);
    }

    private uint8ArrayToBase64(array: Uint8Array): string {
        let binary = '';
        const len = array.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(array[i]);
        }
        return window.btoa(binary);
    }

    private base64ToUint8Array(base64: string): Uint8Array {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    }
}
