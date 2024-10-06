export type crdt_id = {
    seq: ReadonlyArray<number>;
    priority: number;
};
export type crdt_node = {
    id: crdt_id;
    value: string;
    level: number;
    deleted: boolean;
    children: crdt_node[];
};

export type crdt_operation = {
    id: crdt_id;
    value: string;
    type: "insert" | "delete";
};

export type normal_operation = {
    pos: number;
    value: string;
    type: OperationType;
    priority: number;
};

export type OperationType = "insert" | "delete";
