import { SyncEngine } from './sync.engine';
import { Schema } from './types';
import { LocalAdapter, RemoteAdapter } from './adapters';
import { LocalMemoryAdapter } from './local.memory.adapter';
import { LocalStorageAdapter } from './local.storage.adapter';
import { RemoteRestAPIsAdapter } from './remote.rest.adapter';
import * as Automerge from '@automerge/automerge';
import { createReactive } from './reactive';

export function lSchema(schema: Schema) {
  return schema;
}

export const lField = {
  id: {
    autoincrement: () => ({ autoincrement: true }),
    autouuid: () => ({ autouuid: true }),
  },
  now: () => ({ now: true }),
  updatedAt: () => ({ updatedAt: true }),
};

export async function list<T extends { [key: string]: any }>(
  schema: Schema,
  filters?: any,
  options?: {
    source?: 'indexeddb' | 'sqlite' | 'rest' | 'graphql' | 'firebase' | 'supabase' | { local: 'memory' | 'localStorage'; remote: 'rest'; sync: { auto: boolean; interval: number } };
    endpoint?: string;
  }
) {
  let localAdapter: LocalAdapter;
  let remoteAdapter: RemoteAdapter;

  if (typeof options?.source === 'object') {
    if (options.source.local === 'memory') {
      localAdapter = new LocalMemoryAdapter();
    } else if (options.source.local === 'localStorage') {
      localAdapter = new LocalStorageAdapter();
    }
    if (options.source.remote === 'rest') {
      remoteAdapter = new RemoteRestAPIsAdapter(options?.endpoint || 'https://api.example.com/sync');
    }
  } else {
    localAdapter = new LocalMemoryAdapter();
    remoteAdapter = new RemoteRestAPIsAdapter(options?.endpoint || 'https://api.example.com/sync');
  }

  const syncEngine = new SyncEngine<T>(schema, localAdapter, remoteAdapter);
  await syncEngine.init();

  const initialDoc = await localAdapter.get<T>(schema.name);
  const reactiveList = createReactive<T[]>((initialDoc ? initialDoc[schema.name] : []) || []);

  const applyFilters = (data: T[]) => {
    if (!filters) {
      return data;
    }
    const filter = filters();
    if (!filter || !filter.where) {
      return data;
    }
    return data.filter(item => {
      for (const key in filter.where) {
        if (typeof filter.where[key] === 'object') {
          const subFilter = filter.where[key];
          if (subFilter.gte && item[key] < subFilter.gte) {
            return false;
          }
          if (subFilter.lte && item[key] > subFilter.lte) {
            return false;
          }
        } else {
          if (item[key] !== filter.where[key]) {
            return false;
          }
        }
      }
      return true;
    });
  };

  syncEngine.onChange((doc) => {
    const data = (doc[schema.name] as T[]) || [];
    reactiveList(applyFilters(data));
  });

  if (filters) {
    filters.subscribe(() => {
      const doc = syncEngine.doc;
      const data = (doc[schema.name] as T[]) || [];
      reactiveList(applyFilters(data));
    });
  }

  return Object.assign(reactiveList, {
    create: async (item: { data: Partial<T> }) => {
      await syncEngine.addItem(item.data);
    },
    update: async (item: { where: { id: string }, data: Partial<T> }) => {
      await syncEngine.updateItem(item.where.id, item.data);
    },
    delete: async (item: { where: { id: string } }) => {
      await syncEngine.deleteItem(item.where.id);
    },
    findUnique: (query: { where: { id: string } }) => {
      return reactiveList().find(item => item.id === query.where.id) || null;
    },
    findFirst: (query: { where: { [key: string]: any } }) => {
      const key = Object.keys(query.where)[0];
      return reactiveList().find(item => item[key] === query.where[key]) || null;
    },
  });
}
