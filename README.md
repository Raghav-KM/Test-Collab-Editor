# Algorithm Behind Collaboration
1. ### Local Input
   1. Input is perform on the client side as usual
   2. Performes an operation on the local CRDT and generates operation_id
   3. Broadcasts this operation to all the connected client   
2. ### External Input
   1. Performes the operatino on the local CRDT 
   2. Do a dfs traversal of the whole tree and get the Character Sequence that is represented by the local CRDT
   3. Display that Character Sequence in the text-area
