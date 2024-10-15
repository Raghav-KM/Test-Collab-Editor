# Algorithm Behind Collaboration
1. ### Local Input
   1. Input is perform on the client side as usual
   2. Performes an operation on the local CRDT and generates operation_id
   3. Broadcasts this operation to all the connected client   
2. ### External Input
   1. Performes the operatino on the local CRDT 
   2. Do a dfs traversal of the whole tree and get the Character Sequence that is represented by the local CRDT
   3. Display that Character Sequence in the text-area


# TODO
- [x] Handle Cursor position during delete operations
- [] WS connection getting disconnected after some time automatically
- [] Fix cursor decoration issue
- [] Design the (other-people) cursor
- [] Desinge tooltip
- [] Have a copy of the crdt in the backend, when a new client joins, he will get the most recent crdt 
- [] Handle Multiple Cursor with different colors
- [] Support Range Edits on CRDT