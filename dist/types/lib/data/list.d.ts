interface ListNode {
    _next?: ListNode;
    _prev?: ListNode;
    [key: string]: unknown;
}
declare class List {
    private _sentinel;
    constructor();
    dequeue(): ListNode | undefined;
    enqueue(entry: ListNode): void;
    toString(): string;
}
export default List;
//# sourceMappingURL=list.d.ts.map