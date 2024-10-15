import {
    crdt_id,
    crdt_node,
    crdt_operation,
    normal_operation,
    OperationType,
} from "./types";

const RANGE = 2048;

export function init_tree(priority: number): crdt_node {
    const begin: crdt_node = {
        id: { seq: [0, 0], priority: priority },
        value: "[",
        level: 1,
        deleted: true,
        children: [],
    };

    const end: crdt_node = {
        id: { seq: [0, RANGE], priority: priority },
        value: "]",
        level: 1,
        deleted: true,
        children: [],
    };

    const root = {
        id: { seq: [0], priority: priority },
        value: "_",
        level: 0,
        deleted: true,
        children: [begin, end],
    };

    return root;
}

export function perform_crdt_operation(root: crdt_node, op: crdt_operation) {
    // console.log(op.id);
    if (op.type == "insert") {
        insert_node_at(root, {
            id: op.id,
            value: op.value,
            level: op.id.seq.length - 1,
            deleted: false,
            children: [],
        });
    } else if (op.type == "delete") {
        delete_node_at(root, op.id);
    }
}

export function perform_normal_operation(
    root: crdt_node,
    op: normal_operation
): crdt_id {
    const op_id = get_crdt_id(root, op.pos, op.type);
    op_id.priority = op.priority;
    if (op.type == "insert") {
        insert_node_at(root, {
            id: op_id,
            value: op.value,
            level: op_id.seq.length - 1,
            deleted: false,
            children: [],
        });
    } else if (op.type == "delete") {
        delete_node_at(root, op_id);
    }
    return op_id;
}

export function insert_node_at(root: crdt_node, node: crdt_node) {
    function dfs(u: crdt_node, level: number): boolean {
        if (level == node.level - 1 && u.id.seq[level] == node.id.seq[level]) {
            u.children.push(node);
            u.children.sort((a: crdt_node, b: crdt_node) => {
                const dif = a.id.seq.at(-1)! - b.id.seq.at(-1)!;
                if (dif != 0) return dif;
                else return a.id.priority - b.id.priority;
            });
            return true;
        } else {
            for (const v of u.children) {
                if (v.id.seq[level + 1] == node.id.seq[level + 1]) {
                    if (dfs(v, level + 1)) return true;
                }
            }
            return false;
        }
    }
    dfs(root, 0);
}

export function delete_node_at(root: crdt_node, delete_id: crdt_id) {
    function dfs(u: crdt_node, level: number) {
        if (u.level > delete_id.seq.length - 1) return;
        if (
            level == delete_id.seq.length - 1 &&
            u.id.seq[level] == delete_id.seq[level] &&
            u.id.priority == delete_id.priority
        ) {
            u.deleted = true;
        } else {
            for (const v of u.children) {
                if (v.id.seq[level + 1] == delete_id.seq[level + 1]) {
                    dfs(v, level + 1);
                }
            }
        }
    }
    dfs(root, 0);
}

export function get_crdt_id_between(
    prev_node: crdt_node,
    next_node: crdt_node
): crdt_id {
    let new_id = {
        seq: [] as number[],
        priority: -1,
    };
    let mid = 0;

    let plen = prev_node.id.seq.length;
    let nlen = next_node.id.seq.length;

    if (plen == nlen) {
        mid = (prev_node.id.seq.at(-1)! + next_node.id.seq.at(-1)!) / 2;
        mid = Math.floor(mid);
        new_id = {
            seq: [...prev_node.id.seq],
            priority: -1,
        };
    } else if (plen > nlen) {
        mid = (prev_node.id.seq.at(-1)! + RANGE) / 2;
        mid = Math.floor(mid);

        new_id = {
            seq: [...prev_node.id.seq],
            priority: -1,
        };
    } else if (nlen > plen) {
        mid = next_node.id.seq.at(-1)! / 2;
        mid = Math.floor(mid);

        new_id = {
            seq: [...next_node.id.seq],
            priority: -1,
        };
    }

    if (mid == new_id.seq.at(-1)) {
        new_id.seq.push(RANGE / 2);
    } else {
        new_id.seq[new_id.seq.length - 1] = mid;
    }

    return new_id as crdt_id;
}

export function get_crdt_id(
    root: crdt_node,
    op_pos: number,
    type: OperationType
): crdt_id {
    if (type == "insert") {
        let pos = 0;

        let siblings: {
            prev_node: crdt_node | null;
            next_node: crdt_node | null;
        } = {
            prev_node: null,
            next_node: null,
        };

        function dfs(u: crdt_node): boolean {
            if (!u.deleted) pos++;

            siblings = {
                prev_node: siblings.next_node,
                next_node: u,
            };

            if (pos > op_pos) {
                return true;
            } else {
                for (const v of u.children) {
                    if (dfs(v)) return true;
                }
            }
            return false;
        }

        dfs(root);
        const op_id = get_crdt_id_between(
            { ...siblings.prev_node! },
            { ...siblings.next_node! }
        );
        return op_id;
    } else if (type == "delete") {
        let pos = -1;
        let op_id: crdt_id = { seq: [], priority: -1 };

        function dfs(u: crdt_node): boolean {
            if (!u.deleted) pos++;

            if (pos == op_pos) {
                op_id = u.id;
                return true;
            } else {
                for (const v of u.children) {
                    if (dfs(v)) return true;
                }
            }
            return false;
        }

        dfs({ ...root });
        return op_id;
    } else {
        return {
            seq: [],
            priority: -1,
        };
    }
}

export function get_position_by_id(u: crdt_node, id: crdt_id): number {
    let pos = 0;
    const dfs = (u: crdt_node): boolean => {
        if (JSON.stringify(u.id) == JSON.stringify(id)) {
            return true;
        } else {
            if (!u.deleted) pos++;
            for (const v of u.children) {
                if (dfs(v)) return true;
            }
            return false;
        }
    };
    dfs(u);
    return pos;
}

export function get_character_sequence(u: crdt_node): string {
    let sequence = "";
    if (!u.deleted) sequence += u.value;
    for (const v of u.children) {
        sequence += get_character_sequence(v);
    }
    return sequence;
}
