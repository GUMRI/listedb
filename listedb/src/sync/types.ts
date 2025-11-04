export interface IDslMeta {
    keyPath?: boolean;
    unique?: boolean;
    autoincrement?: boolean;
    autouuid?: boolean;
    now?: boolean;
    updatedAt?: boolean;
    count?: boolean;
}

export type TFieldsMeta = Record<string, IDslMeta>;

export interface Schema {
    name: string;
    fields: TFieldsMeta;
}
