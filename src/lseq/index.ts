import {
    get_character_sequence,
    init_tree,
    perform_crdt_operation,
    perform_normal_operation,
} from "./crdt";

const root_crdt = init_tree(0);
perform_normal_operation(root_crdt, {
    pos: 0,
    value: "a",
    type: "insert",
    priority: root_crdt.id.priority,
});

perform_crdt_operation(root_crdt, {
    id: { seq: [0, 8], priority: 1 },
    value: "b",
    type: "insert",
});

perform_normal_operation(root_crdt, {
    pos: 1,
    value: "c",
    type: "insert",
    priority: root_crdt.id.priority,
});

perform_normal_operation(root_crdt, {
    pos: 1,
    value: "d",
    type: "insert",
    priority: root_crdt.id.priority,
});
console.log(get_character_sequence({ ...root_crdt }));
perform_normal_operation(root_crdt, {
    pos: 3,
    value: "",
    type: "delete",
    priority: root_crdt.id.priority,
});

// console.log(root_crdt);
// console.log(JSON.stringify(root_crdt, null, 1));
console.log(get_character_sequence({ ...root_crdt }));
