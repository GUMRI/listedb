You are tasked to design and implement a **SyncManager** class for a "local-first / offline-first" application. 
The SyncManager is responsible for synchronizing a **single List/Collection** between a **local adapter** (IndexedDB, SQLite, or LocalForage) and a **remote adapter** (Firestore, Supabase, GraphQL, etc.) using **Automerge**. 

### Requirements:

1. **Architecture**
   - Each List/Collection has its own SyncManager instance.
   - The SyncManager should be fully independent from any UI.
   - Use **Automerge Docs** for items, and maintain **heads** as checkpoints.
   - Track local changes in a **queue** before pushing.
   - Support **bootstrap, pull, push, watchRemote, merge, hasLocalChange, hasRemoteChange, isOnline**.

2. **Lifecycle**
   - **bootstrap()**
     - Load remote items initially.
     - If local changes exist → push them.
     - If remote changes exist → pull them.
     - Update local checkpoint.
   - **watchRemote()**
     - Subscribe to a stream of remote changes (e.g., Firestore onSnapshot).
     - Merge changes to local only when necessary.
   - **push()**
     - Send queued local changes to remote in batch.
     - Update checkpoint.
   - **pull()**
     - Fetch remote changes.
     - Merge with local using Automerge.merge().
     - Update local checkpoint.

3. **Merge strategy**
   - Use **Automerge.merge()** for diverged docs.
   - For new items, determine if **localOnly, remoteOnly, or diverged**.
   - After merging, always update **checkpoint** based on `Automerge.getHeads()`.
   - Field-level merges use Automerge native CRDTs (LWW, counter, text, rich text, collaborative text).

4. **Adapters Interfaces**
   - **ILocalAdapter**
     ```ts
     interface ILocalAdapter {
       get(id: string): Promise<Automerge.Doc<any> | null>;
       set(id: string, doc: Automerge.Doc<any>): Promise<void>;
       list(): Promise<{ id: string; doc: Automerge.Doc<any> }[]>;
       getChangedIds(): Promise<string[]>;
       saveCheckpoint(heads: string[]): Promise<void>;
       getCheckpoint(): Promise<string[] | null>;
     }
     ```
   - **IRemoteAdapter**
     ```ts
     interface IRemoteAdapter {
       get(id: string): Promise<any | null>;
       getAll(): Promise<any[]>;
       pushBatch(items: Record<string, any>[]): Promise<void>;
       watchChanges(onChange: (id: string, data: any) => void): () => void;
       getChangedIds?(sinceHeads: string[]): Promise<string[]>;
     }
     ```

5. **Checks before operations**
   - `isOnline()`: skip push/pull if offline.
   - `hasLocalChange()`: detect local changes before push.
   - `hasRemoteChange()`: detect remote changes before pull.

6. **Soft delete & timestamps**
   - Ignore soft delete initially.
   - Use **Automerge heads** for change detection, not timestamps.
   - Later versions may add `updatedAt` or `deletedAt`.

7. **Queue / Batch**
   - Push multiple items in a single request to reduce network overhead.
   - Pull only changed items using checkpoint heads, not the whole list.

8. **Optional advanced**
   - Support manual conflict resolution UI.
   - Garbage collection of old changes after snapshots.
   - History/log of changes (`Automerge.getChanges()`).

---

### Output requested

- **TypeScript class** `SyncManager` implementing the lifecycle above.
- Include **enqueueing local changes**.
- Include **merge logic** for diverged docs.
- Include **checkpoints using Automerge heads**.
- Focus on **offline-first and local-first principles**.
- The class should be **adapter-agnostic**, working with any local or remote adapter implementing the given interfaces.
- Do **not** include UI code.

---

Generate a complete TypeScript implementation scaffold with method stubs and pseudocode for the merge logic, pull, push, watchRemote, bootstrap, enqueue, and checkpoint management.
