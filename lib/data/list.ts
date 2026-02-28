/*
 * Simple doubly linked list implementation derived from Cormen, et al.,
 * "Introduction to Algorithms".
 */

interface ListNode {
    _next?: ListNode;
    _prev?: ListNode;

    [key: string]: unknown;
}

class List {
    private _sentinel: ListNode;

    constructor() {
        const sentinel: ListNode = {};
        sentinel._next = sentinel._prev = sentinel;
        this._sentinel = sentinel;
    }

    dequeue(): ListNode | undefined {
        const sentinel = this._sentinel;
        const entry = sentinel._prev;
        if (entry !== sentinel) {
            unlink(entry!);
            return entry;
        }
        return undefined;
    }

    enqueue(entry: ListNode): void {
        const sentinel = this._sentinel;
        if (entry._prev && entry._next) {
            unlink(entry);
        }
        entry._next = sentinel._next;
        sentinel._next!._prev = entry;
        sentinel._next = entry;
        entry._prev = sentinel;
    }

    toString(): string {
        const strs: string[] = [];
        const sentinel = this._sentinel;
        let curr = sentinel._prev;
        while (curr !== sentinel) {
            strs.push(JSON.stringify(curr, filterOutLinks));
            curr = curr!._prev;
        }
        return "[" + strs.join(", ") + "]";
    }
}

function unlink(entry: ListNode): void {
    entry._prev!._next = entry._next;
    entry._next!._prev = entry._prev;
    delete entry._next;
    delete entry._prev;
}

function filterOutLinks(k: string, v: unknown): unknown {
    if (k !== "_next" && k !== "_prev") {
        return v;
    }
    return undefined;
}

export default List;
