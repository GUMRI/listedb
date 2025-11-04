import { SyncEngine } from './sync.engine';
import { LocalMemoryAdapter } from './local.memory.adapter';
import { LocalStorageAdapter } from './local.storage.adapter';
import { RemoteRestAPIsAdapter } from './remote.rest.adapter';
import localStorage from 'localstorage-memory';
import { Schema } from './types';
import * as Automerge from '@automerge/automerge/wasm_bundle';
import { jest } from '@jest/globals';

describe('SyncEngine', () => {
  let syncEngine: SyncEngine<any>;
  let localAdapter: LocalMemoryAdapter;
  let remoteAdapter: RemoteRestAPIsAdapter;

  const schema: Schema = {
    name: 'todos',
    fields: {
      id: { autouuid: true },
      text: {},
      createdAt: { now: true },
      updatedAt: { updatedAt: true },
      count: { count: true },
    },
  };

  beforeEach(async () => {
    localAdapter = new LocalMemoryAdapter();
    remoteAdapter = new RemoteRestAPIsAdapter('https://api.example.com/sync');
    syncEngine = new SyncEngine(schema, localAdapter, remoteAdapter);
    await syncEngine.init();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      })
    ) as jest.Mock;
  });

  it('should initialize with an empty doc', async () => {
    const doc = await localAdapter.get('todos');
    expect(doc).toBeDefined();
    expect(Automerge.getHistory(doc).length).toBe(1);
  });

  it('should add an item to the list', async () => {
    await syncEngine.addItem({ text: 'Buy milk' });
    const doc = await localAdapter.get('todos');
    const list = doc.todos;
    expect(list.length).toBe(1);
    expect(list[0].text).toBe('Buy milk');
    expect(list[0].id).toBeDefined();
    expect(list[0].createdAt).toBeDefined();
    expect(list[0].updatedAt).toBeDefined();
    expect(doc.metadata.count).toBe(1);
  });

  it('should update an item in the list', async () => {
    await syncEngine.addItem({ text: 'Buy milk' });
    let doc = await localAdapter.get('todos');
    let list = doc.todos;
    const itemId = list[0].id;

    await syncEngine.updateItem(itemId, { text: 'Buy almond milk' });
    doc = await localAdapter.get('todos');
    list = doc.todos;
    expect(list[0].text).toBe('Buy almond milk');
    expect(list[0].updatedAt).toBeDefined();
  });

  it('should delete an item from the list', async () => {
    await syncEngine.addItem({ text: 'Buy milk' });
    let doc = await localAdapter.get('todos');
    let list = doc.todos;
    const itemId = list[0].id;

    await syncEngine.deleteItem(itemId);
    doc = await localAdapter.get('todos');
    list = doc.todos;
    expect(list.length).toBe(0);
  });

  it('should queue messages when offline', async () => {
    jest.spyOn(remoteAdapter, 'send').mockImplementation(async () => {
        throw new Error('Network error');
    });
    await syncEngine.addItem({ text: 'Buy milk' });
    const queuedMessages = await localAdapter.getQueuedMessages();
    expect(queuedMessages.length).toBe(1);
  });
});
