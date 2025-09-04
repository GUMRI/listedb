/**
 * This namespace defines the DSL (Domain Specific Language) for the listedb schema.
 * These types are used for defining the schema structure in `listedb.schema.ts`.
 * They are for static analysis and type-checking only and should NOT be imported by runtime code.
 */

export declare namespace listedb {

    /**
     * The base interface that all main database entities must extend.
     * This is how the generator identifies which interfaces should become lists.
     */
    export interface item {
        id: any;
    }

    /**
     * Defines a primary key. Can be a 'uuid' (string) or 'increment' (number).
     */
    export type id<T extends "uuid" | "increment"> = T extends "uuid" ? string : number;

    /**
     * Defines a one-to-one or many-to-one relationship with another main entity.
     */
    export type oneFrom<T extends item> = T;

    /**
     * Defines a one-to-many relationship with another main entity.
     */
    export type manyFrom<T extends item> = T[];

    /**
     * Marks a field as having a unique constraint.
     */
    export type unique<T> = T;

    /**
     * Marks a field as having an index for faster lookups.
     */
    export type index<T> = T;

    /**
     * Defines a field for storing a history of changes to the item.
     */
    export type logs<T extends item> = T[];

    /**
     * Defines a field that will automatically be updated with the current timestamp on every modification.
     */
    export type updatedAt = Date;

    /**
     * Defines a field that will be set to the current timestamp when the item is created.
     */
    export type now = Date;
}
