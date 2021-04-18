function isTsNode(): boolean {
  return typeof process[Symbol.for('ts-node.register.instance')] !== 'undefined';
}

export {
  isTsNode
};