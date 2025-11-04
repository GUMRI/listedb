import { RemoteAdapter } from './adapters.js';
import { SyncEngine } from './sync.engine.js';

export class RemoteRestAPIsAdapter extends RemoteAdapter {
    private syncEngine: SyncEngine<any> | null = null;
    private pollingInterval: NodeJS.Timeout | null = null;

    constructor(private url: string, private pollIntervalMs = 5000) {
        super();
    }

    connect(syncEngine: SyncEngine<any>): void {
        this.syncEngine = syncEngine;
        this.startPolling();
    }

    disconnect(): void {
        this.stopPolling();
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
        }
    }

    private startPolling(): void {
        this.pollingInterval = setInterval(() => this.poll(), this.pollIntervalMs);
    }

    private stopPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    private async poll(): Promise<void> {
        if (!this.syncEngine) return;

        try {
            const messages = await this.syncEngine.getQueuedMessages();
            if (messages.length > 0) {
                await Promise.all(messages.map(message => this.send(message)));
                this.syncEngine.clearQueuedMessages();
            } else {
                this.send(new Uint8Array());
            }
        } catch (error) {
            console.error('Error polling for messages:', error);
        }
    }
}
