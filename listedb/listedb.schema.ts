const listedb = require("./src/core/listedb.namespace");

exports.ERole = {
  ADMIN: "ADMIN",
  USER: "USER",
};

// Interfaces and types are used for type checking and don't need to be explicitly exported for the parser.
// The parser reads them as part of the TypeScript AST.
// We just need to make sure the file is a valid TypeScript file.
// The `export` keyword is kept for the interfaces because it's needed by the parser to identify which entities to process.

interface Category { id: listedb.id<"uuid">; name: string }

export interface User extends listedb.item {
  id: listedb.id<"uuid">;
  name: string;
  email?: string;
  tags: string[];
  category: Category;
  role: exports.ERole[];
  updatedAt?: listedb.updatedAt;
  history: listedb.logs<User>;
  per: exports.ERole;
}

type State = "draft" | "published" | "archived";

export interface Post extends listedb.item {
  id: listedb.id<"uuid">;
  title: string;
  content: string;
  author: listedb.oneFrom<User>;
  createdAt: listedb.now;
  updatedAt?: listedb.updatedAt;
  state: State;
  history: listedb.logs<Post>;
}
