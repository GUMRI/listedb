listedb library - sync manager section 
Goal:
Design a SyncManager responsible for synchronizing data between a localAdapter (IndexedDB/SQLite) and a remoteAdapter (Firestore, Supabase, GraphQL, etc.). The system is central-data-based, not peer-to-peer. Each list in the system has its own dedicated SyncManager that handles two-way synchronization.

---

Core Responsibilities:
1. bootstrap() — Load initial data and detect divergence. If local changes exist, push them. If remote changes exist, pull them.
2. watchRemote() — Continuously listen for remote data changes via stream or subscription.
3. handleMutations() — Capture and push local changes to remote.
4. hasLocalChange() & hasRemoteChange() — Determine if synchronization is required before each cycle.
5. isOnline() — Verify connectivity before performing remote operations.

---

Remote Adapter Capabilities:
The remoteAdapter must expose a consistent interface to handle synchronization logic for central data storage:
- watch(collection): Stream live changes from remote source.
- mutations(type, payload): Apply create/update/delete operations.
- transaction(fn): Ensure atomic batch updates.
- query(params): Run filters or comparison queries for checkpoints or conflicts.
- getSnapshot(): Fetch raw collection data for bootstrap.

---

Data Representation:
Data in remote storage must be structured as tables (rows) or collections (documents) rather than raw CRDT states. CRDT metadata can be stored optionally to track version and merge status, depending on merge policies.

Example structure:
{
  id: "order_10",
  data: {...},
  crdt: {
    heads: [...],
    updatedAt: number,
    deleted: boolean
  }
}

Automerge will represent CRDTs through SyncMessages and state management using:
- decodeSyncState()
- encodeSyncState()
- generateSyncMessage()
- hasOurChanges()
- initSyncState()
- receiveSyncMessage()

---

Merge State Analysis:
Before any merge operation, the SyncManager must determine the item state to decide the correct synchronization action.

State | Description | Action
🟢 Local only | Exists only locally (new, not uploaded) | push() to remote
🔵 Remote only | Exists only remotely (new from another source) | pull() to local
🟡 Both — same heads | Identical versions | no action
🟠 Both — diverged heads | Independent changes on both sides | merge() via Automerge
🔴 Both — deleted in one side | Deleted on one side only | apply delete policy

---

Merge Policies:
SyncManager applies merge policies based on the granularity of change and list configuration.

Level | Policy | Description
🧱 Field Level | CRDT / Automerge-native | Use built-in CRDT merge (LWW, counter, text, etc.)
🧾 Item Level | Structural merge | Compare heads and apply Automerge.merge()
📚 List Level | Batch merge | Merge multiple documents in a single sync operation
🧰 DB Level | Transactional merge | Commit merge inside one transaction in local database

---

Summary:
SyncManager acts as the synchronization orchestrator between local and remote states. It relies on Automerge’s CRDT mechanisms to resolve conflicts deterministically, applies merge policies depending on data type and scope, and ensures data consistency through controlled bootstrap, streaming, and transactional operations.
`;     - If local changes exist → push them.
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
