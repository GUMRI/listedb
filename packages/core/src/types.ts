/**
 * Represents a log entry for a given item type.
 */
export interface Log<T> {
  timestamp: Date;
  event: 'create' | 'update' | 'delete';
  data: Partial<T>;
}

/**
 * Represents the input for querying a list.
 * This is a placeholder and would be more complex in a real implementation.
 */
export type QueryInput<T> = Partial<T>;

/**
 * Defines the options for creating a new list with the listFactory.
 */
export interface ListOptions {
  name: string;
  primary: string;
  uniqueFields?: string[];
  indexesFields?: string[];
  populations?: {
    [key: string]: {
      ref: string;
      method: 'oneFrom' | 'manyFrom';
    };
  };
  methods?: {
    uuid?: string[];
    autoIncrement?: string[];
    now?: string[];
    updatedAt?: string[];
    log?: string[];
  };
}
