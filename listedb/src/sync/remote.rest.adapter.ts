import { RemoteAdapter } from './adapters.js';
import { SyncEngine } from './sync.engine.js';

export class RemoteRestAPIsAdapter extends RemoteAdapter {
    private syncEngine: SyncEngine<any> | null = null;

    constructor(private url: string) {
        super();
    }

    connect(syncEngine: SyncEngine<any>): void {
        this.syncEngine = syncEngine;
    }

    disconnect(): void {
        this.syncEngine = null;
    }

    async send(message: Uint8Array): Promise<void> {
        try {
            const response = await fetch(this.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: message,
            });

            if (response.ok) {
                const responseData = await response.arrayBuffer();
                if (responseData.byteLength > 0) {
                    this.syncEngine?.receive([new Uint8Array(responseData)]);
                }
            } else {
                console.error('Failed to send message:', response.statusText);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.syncEngine?.queueMessage(message);
            throw error;
        }
    }

}
