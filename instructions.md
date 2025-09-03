# Listedb Development Rules

This document outlines the development rules, architecture, and DSL syntax for the `listedb` library.

## 1. Core Principle

The `listedb` library is schema-driven. The single source of truth is the `listedb.schema.ts` file. A generator script reads this schema and produces self-contained `*.list.ts` files that contain the necessary runtime logic and type definitions for each database entity.

## 2. File Structure

-   `/listedb.schema.ts`: The schema definition file. All entities, types, and enums are defined here.
-   `/listedb/src/core/listedb.namespace.ts`: Defines the TypeScript types for the DSL (e.g., `listedb.id`, `listedb.item`). **This file is for schema definition only and must not be imported by generated code.**
-   `/listedb/src/core/types.ts`: Defines shared runtime types used by the generated code (e.g., `ListOptions`, `Log`, `QueryInput`).
-   `/listedb/src/core/list.factory.ts`: The core factory function that creates list instances.
-   `/listedb/scripts/`: Contains the generator logic (`parser.ts`, `code-generator.ts`, `generate.ts`).
-   `/listedb/lists/`: The output directory for the generated code.

## 3. The `listedb` Schema DSL

The schema is defined using standard TypeScript syntax enhanced with special types from the `listedb` namespace.

### Main Interfaces

An interface is considered a "main interface" (i.e., an entity that will become a database list) if and only if it **`extends listedb.item`**.

```typescript
// This will generate a `user.list.ts` file.
export interface User extends listedb.item {
  // ...
}

// This is a structural interface and will NOT generate a file.
// It will be copied as a dependency if used by a main interface.
interface Profile {
  bio: string;
}
```

### DSL Types

The following special types are used to define properties within an interface:

| DSL Type | Example | Generated Main Type | Generated `CreateInput` Type |
| :--- | :--- | :--- | :--- |
| **Primary Key** | `id: listedb.id<'uuid'>` | `string` | (Not included) |
| | `id: listedb.id<'increment'>` | `number` | (Not included) |
| **Unique** | `email: listedb.unique<string>`| `string` | `string` |
| **Index** | `name: listedb.index<string>`| `string` | `string` |
| **Relation (One)** | `author: listedb.oneFrom<User>` | `User` | `string` (ID of the User) |
| **Relation (Many)**| `posts: listedb.manyFrom<Post>` | `Post[]` | `string[]` (Array of Post IDs) |
| **Log History** | `history: listedb.logs<User>` | `Log<User>[]` | (Not included) |
| **Creation Time** | `createdAt: listedb.now` | `string` | (Not included) |
| **Update Time** | `updatedAt: listedb.updatedAt`| `string` | (Not included) |

## 4. Generator Logic

The generator is run with `npm run generate`. Its behavior is as follows:

1.  **Parse Schema:** It reads `listedb.schema.ts` and identifies all exported interfaces, enums, and type aliases.
2.  **Identify Main Interfaces:** It filters the list of interfaces to only include those that `extend listedb.item`.
3.  **Generate Files:** For each main interface, it generates a `[name].list.ts` file.
4.  **Create Self-Contained Files:** The generated files are completely independent of the source schema.
    -   **Type Translation:** All `listedb` DSL types are translated into pure TypeScript types.
    -   **Dependency Copying:** If a main interface uses other non-main interfaces, enums, or type aliases from the schema, their definitions are copied directly into the top of the generated file.
    -   **Dependency Imports:** If a main interface has a relation to another main interface, an `import` statement is added to import the type from the other generated list file.
    -   **Core Imports:** Imports for runtime helpers like `listFactory` and `ListOptions` are added from `@listedb/core` (or a relative path to `listedb/src/core/`).
