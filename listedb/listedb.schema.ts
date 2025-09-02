import * as listedb from "./src/core/listedb.namespace.js";

export enum ERole {
  ADMIN = "ADMIN",
  USER = "USER",
}

interface Category { id: listedb.id<"uuid">; name: string }

export interface User extends listedb.item {
  id: listedb.id<"uuid">;
  name: string;
  email?: string;
  tags: string[];
  category: Category;
  role: ERole[];
  updatedAt?: listedb.updatedAt;
  history: listedb.logs<User>;
  per: ERole;
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
