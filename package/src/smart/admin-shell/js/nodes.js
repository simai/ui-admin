// The shell's rule for the page's nodes (AS-5): a node the page has taken out
// of the shell -- removed, or moved somewhere else -- is the page's decision and
// is forgotten, never put back. A node not placed yet may be out of the
// document for a moment (the base releases the held slot nodes right before
// the drawing places them), so it is kept unless the page put it somewhere
// else; a placed node is kept only while it is still inside the shell.
//
// inside(node): the node is in the shell now; placed: the nodes the shell has
// placed once (a WeakSet or anything with has()).
export function holdsNode(node, inside, placed) {
    if (!node || !node.nodeType) return false;
    if (inside(node)) return true;
    if (!placed.has(node)) return node.parentNode === null;
    return false;
}

// The nodes of one area the shell still holds, in their order.
export function heldNodes(list, inside, placed) {
    return [].concat(list ?? []).filter((node) => holdsNode(node, inside, placed));
}
