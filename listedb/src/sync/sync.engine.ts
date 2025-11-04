import * as Automerge from '@automerge/automerge/wasm_bundle';
import { v4 as uuidv4 } from 'uuid';
import { LocalAdapter, RemoteAdapter } from './adapters.js';
import { Schema } from './types.js';
import { EventEmitter } from 'events';

export class SyncEngine<T extends { [key: string]: any }> {
    private doc: Automerge.Doc<T>;
    private syncStates: Map<string, Automerge.SyncState> = new Map();
    private peerId: string;
    private eventEmitter = new EventEmitter();

    constructor(
        private schema: Schema,
        private localAdapter: LocalAdapter,
        private remoteAdapter: RemoteAdapter
    ) {
        this.peerId = uuidv4();
    }

    async init(): Promise<void> {
        let doc = await this.localAdapter.get<T>(this.schema.name);
        if (!doc) {
            doc = Automerge.from({ [this.schema.name]: [], metadata: { count: 0 } });
            await this.localAdapter.set(this.schema.name, doc);
        }
        this.doc = doc;
        this.remoteAdapter.connect(this);
    }

    async addItem(item: Partial<T>): Promise<void> {
        const newItem = this.applySchemaDefaults(item);
        this.doc = Automerge.change(this.doc, (d: any) => {
            if (!d[this.schema.name]) {
                d[this.schema.name] = [];
            }
            d[this.schema.name].push(newItem);
            d.metadata.count = d[this.schema.name].length;
        });
        await this.localAdapter.set(this.schema.name, this.doc);
        this.eventEmitter.emit('change', this.doc);
        this.sync();
    }

    async updateItem(id: string, item: Partial<T>): Promise<void> {
        this.doc = Automerge.change(this.doc, (d: any) => {
            const list = d[this.schema.name] as any[];
            const index = list.findIndex(i => i.id === id);
            if (index > -1) {
                Object.assign(list[index], this.applySchemaDefaults(item, true));
            }
        });
        await this.localAdapter.set(this.schema.name, this.doc);
        this.eventEmitter.emit('change', this.doc);
        this.sync();
    }

    async deleteItem(id: string): Promise<void> {
        this.doc = Automerge.change(this.doc, (d: any) => {
            const list = d[this.schema.name] as any[];
            const index = list.findIndex(i => i.id === id);
            if (index > -1) {
                list.splice(index, 1);
            }
            d.metadata.count = list.length;
        });
        await this.localAdapter.set(this.schema.name, this.doc);
        this.eventEmitter.emit('change', this.doc);
        this.sync();
    }

    async sync(): Promise<void> {
        const syncState = await this.getSyncState(this.peerId);
        const [nextSyncState, message] = Automerge.generateSyncMessage(this.doc, syncState);
        this.setSyncState(this.peerId, nextSyncState);

        if (message) {
            await this.remoteAdapter.send(message);
        }

        const queuedMessages = await this.localAdapter.getQueuedMessages();
        if (queuedMessages.length > 0) {
            await Promise.all(queuedMessages.map(msg => this.remoteAdapter.send(msg)));
            this.localAdapter.clearQueuedMessages();
        }
    }

    async receive(messages: Uint8Array[]): Promise<void> {
        for (const message of messages) {
            const syncState = await this.getSyncState(this.peerId);
            const [nextDoc, nextSyncState] = Automerge.receiveSyncMessage(this.doc, syncState, message);
            this.doc = nextDoc;
            this.setSyncState(this.peerId, nextSyncState);
        }
        this.localAdapter.set(this.schema.name, this.doc);
        this.eventEmitter.emit('change', this.doc);
    }

    onChange(callback: (doc: Automerge.Doc<T>) => void): void {
        this.eventEmitter.on('change', callback);
    }

    queueMessage(message: Uint8Array) {
        this.localAdapter.queueMessage(message)
    }

    getQueuedMessages() {
        return this.localAdapter.getQueuedMessages();
    }

    clearQueuedMessages() {
        this.localAdapter.clearQueuedMessages();
    }

    private async getSyncState(peerId: string): Promise<Automerge.SyncState> {
        let syncState = this.syncStates.get(peerId);
        if (!syncState) {
            syncState = await this.localAdapter.getSyncState(peerId) || Automerge.initSyncState();
            this.syncStates.set(peerId, syncState);
        }
        return syncState;
    }

    private setSyncState(peerId: string, syncState: Automerge.SyncState): void {
        this.syncStates.set(peerId, syncState);
        this.localAdapter.setSyncState(peerId, syncState);
    }

    private applySchemaDefaults(item: Partial<T>, isUpdate = false): T {
        const newItem = { ...item };
        for (const [field, meta] of Object.entries(this.schema.fields)) {
            if (meta.autouuid && !isUpdate) {
                newItem[field] = uuidv4();
            }
            if (meta.now && !isUpdate) {
                newItem[field] = new Date().toISOString();
            }
            if (meta.updatedAt) {
                newItem[field] = new Date().toISOString();
            }
        }
        return newItem as T;
    }
}
