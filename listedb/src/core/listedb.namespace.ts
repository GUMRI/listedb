// This file represents the core DSL for the listedb library.

// Represents a primary key, which can be a UUID or an auto-incrementing number.
export type id<T extends "uuid" | "increment"> = T extends "uuid" ? string : number;

// Represents a one-to-one or one-to-many relationship.
export type oneFrom<T> = T;
export type manyFrom<T> = T[];

// Represents database constraints.
export type unique<T> = T;
export type index<T> = T;

// Represents special fields for tracking and management.
export type logs<T> = T[];
export type updatedAt = Date;
export type now = Date;

// Base interface for all items managed by listedb.
export interface item {
    id: any;
}
