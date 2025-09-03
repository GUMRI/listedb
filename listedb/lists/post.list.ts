import { Log, QueryInput, listFactory, ListOptions } from '../src/core/types.js';
import type { User } from './user.list.js';

export interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt?: string;
  state: State;
  history: Log<Post>[];
}

export interface PostCreateInput {
  title: string;
  content: string;
  author: string;
  state: State;
}


export type PostUpdateInput = Partial<PostCreateInput>;
export type PostQueryInput = QueryInput<Post>;
export type PostUniqueQueryInput = { id?: string
};
    

const listOptions: ListOptions = {
  "name": "posts",
  "primary": "id",
  "uniqueFields": [
    "id"
  ],
  "indexesFields": [],
  "populations": {
    "author": {
      "ref": "users",
      "method": "oneFrom"
    }
  },
  "methods": {
    "uuid": [
      "id"
    ],
    "now": [
      "createdAt"
    ],
    "updatedAt": [
      "updatedAt"
    ],
    "log": [
      "history"
    ]
  }
};


export const postsList = listFactory<
  Post,
  PostCreateInput,
  PostUpdateInput,
  PostQueryInput,
  PostUniqueQueryInput
>(listOptions);
    