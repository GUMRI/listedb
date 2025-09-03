import { Log, QueryInput, listFactory, ListOptions } from '../src/core/types.js';

export enum ERole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface User {
  id: string;
  name: string;
  email?: string;
  tags: string[];
  category: Category;
  role: ERole[];
  updatedAt?: string;
  history: Log<User>[];
  per: ERole;
}

export interface UserCreateInput {
  name: string;
  email?: string;
  tags: string[];
  category: Category;
  role: ERole[];
  per: ERole;
}


export type UserUpdateInput = Partial<UserCreateInput>;
export type UserQueryInput = QueryInput<User>;
export type UserUniqueQueryInput = { id?: string
};
    

const listOptions: ListOptions = {
  "name": "users",
  "primary": "id",
  "uniqueFields": [
    "id"
  ],
  "indexesFields": [],
  "populations": {},
  "methods": {
    "uuid": [
      "id"
    ],
    "updatedAt": [
      "updatedAt"
    ],
    "log": [
      "history"
    ]
  }
};


export const usersList = listFactory<
  User,
  UserCreateInput,
  UserUpdateInput,
  UserQueryInput,
  UserUniqueQueryInput
>(listOptions);
    