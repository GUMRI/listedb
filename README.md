# listedb  लिस्टेडबी

`listedb` is a modern, schema-driven, local-first database library for TypeScript applications, inspired by the developer experience of Prisma.

## Core Concepts

-   **Schema-First:** Define your entire database schema in a single `listedb.schema.ts` file using standard TypeScript syntax.
-   **Code Generation:** A powerful CLI tool reads your schema and generates fully-typed list objects for all your data models.
-   **Local-First:** Designed from the ground up for local-first applications, enabling robust offline capabilities.
-   **TypeScript Native:** Leverages the power of TypeScript to provide an excellent, type-safe developer experience.

## Quick Start

Get started with `listedb` in a new or existing project by running the `init` command.

### 1. Initialize Your Project

Run the following command in your project's root directory:

```bash
npx listedb init
```

This command will do two things:
1.  Install the necessary core library: `@listedb/core`.
2.  Create a boilerplate `listedb.schema.ts` file to get you started.

### 2. Define Your Schema

Open the newly created `listedb.schema.ts` file and define your data models. A "main" data model that will become a database list must `extend listedb.item`.

```typescript
// listedb.schema.ts
import { listedb } from '@listedb/core';

// An interface for a related, but non-main, data structure.
// This will be copied into any list file that uses it.
interface Profile {
  bio: string;
  website?: string;
}

// A main interface that will become a database list.
export interface User extends listedb.item {
  id: listedb.id<'uuid'>;
  email: listedb.unique<string>;
  name: string;
  profile: Profile;
  createdAt: listedb.now;
}
```

### 3. Generate Your Lists

Once your schema is defined, run the `generate` command:

```bash
npx listedb generate
```

The generator will read your schema and create a `listedb/` directory containing your list files (e.g., `listedb/lists/user.list.ts`). These files contain fully-typed objects for interacting with your data.

## Development

This project is a monorepo containing two main packages:

-   `packages/core`: The core runtime library.
-   `packages/cli`: The `oclif`-based command-line tool.

To build all packages, run:
```bash
npm install
npm run build
```
