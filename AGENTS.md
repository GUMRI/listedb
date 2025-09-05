# Rules and Guidelines for AI Agents working on `listedb`

Welcome, agent! This document contains the core rules and best practices for developing the `listedb` library. Please adhere to these guidelines to ensure consistency and correctness.

## 1. Project Overview

`listedb` is a schema-driven, local-first database library for TypeScript, inspired by Prisma. Its main feature is a CLI tool that generates fully-typed data-access "lists" from a user-defined schema.

The project is a monorepo with two key packages:
-   `packages/core`: The core runtime library. Contains the `listFactory`, shared types, and the schema DSL namespace.
-   `packages/cli`: The `oclif`-based command-line tool that contains the generator logic.

## 2. The Generator: Input and Output

The primary task you will likely work on is the generator. Understanding its inputs and outputs is critical.

-   **Input:** The generator's input is a single TypeScript file, typically named `listedb.schema.ts`. This file defines all data structures using standard TypeScript and the `listedb` DSL.

-   **Output:** The generator's output is a directory of `*.list.ts` files, typically located in a `listedb/lists/` directory. Each generated file corresponds to one "main interface" from the schema.

## 3. Core Development Rules

These are the fundamental rules that govern the generator's logic. Do not violate these rules unless explicitly asked to by the user.

### Rule 1: Identifying Main Interfaces
The generator must only create a `*.list.ts` file for an interface if, and only if, that interface **`extends listedb.item`**. This is the sole method for distinguishing a database entity from a simple structural interface.

### Rule 2: Generated Files Must Be Self-Contained
The generated `*.list.ts` files **must not** import anything from the original `listedb.schema.ts` or from `listedb.namespace.ts`. The generator's primary job is to *translate* the schema into pure, runnable TypeScript code.

### Rule 3: Dependency Handling
There are two types of dependencies an interface can have. You must handle them differently:
-   **Copied Dependencies:** If an interface uses a non-main `interface`, `type` alias, or `enum` from the schema, the definition of that dependency must be copied verbatim into the top of the generated file.
-   **Imported Dependencies (Relations):** If an interface has a relationship with another **main interface** (using `listedb.oneFrom<T>` or `listedb.manyFrom<T>`), the generated file should `import type { T } from './t.list.js'`.

### Rule 4: DSL Type Translation
The generator must translate the `listedb` DSL types into standard TypeScript types according to the established rules. For example:
-   `listedb.id<'uuid'>` -> `string`
-   `listedb.manyFrom<Post>` -> `Post[]` in the main interface, but `string[]` in the `CreateInput` interface.

## 4. Best Practices

-   **Parser First:** The generator logic is split between `parser.ts` and `code-generator.ts`. When adding new features to the generator, always start by enhancing the parser to extract the required information into a structured format. Then, modify the code generator to use that new structured data. Do not put complex parsing logic inside the code generator.
-   **Clarity over Cleverness:** The code generation templates should be clear and easy to read. Use helper functions to build up complex parts of the generated file.
-   **Verify with the User:** If a request is ambiguous or requires a significant change to the core rules, always confirm your understanding with the user before implementing.
-   **The `AGENTS.md` is the Source of Truth:** This file reflects the final set of rules agreed upon with the user. Refer to it before starting any new task.
