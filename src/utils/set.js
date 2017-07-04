/* eslint no-cond-assign:0 */

exports.intersection = function intersection(...args) {
  if (args.length < 2) {
    throw new Error('Set.intersection: needs at least two arugments.');
  }
  const I = new Set();
  const len = args.length;
  let smallestSize = Infinity;
  let smallsetSet = null;

  for (let i = 0; i < len; i++) {
    const s = args[i];
    if (s.size === 0) {
      return I;
    }
    if (s.size < smallestSize) {
      smallestSize = s.size;
      smallsetSet = s;
    }
  }
  const iterator = smallsetSet.values();
  let step;
  while ((step = iterator.next(), !step.done)) {
    let isAdd = true;
    const item = step.value;
    for (let i = 0; i < len; i++) {
      const set = args[i];
      if (set === smallsetSet) {
        continue; // eslint-disable-line
      }
      if (!set.has(item)) {
        isAdd = false;
        break;
      }
    }
    if (isAdd) {
      I.add(item);
    }
  }
  return I;
};

exports.union = function union(...args) {
  if (args.length < 2) {
    throw new Error('Set.intersection: needs at least two arugments.');
  }
  const U = new Set();
  const len = args.length;
  for (let i = 0; i < len; i++) {
    const set = args[i];
    let step;
    const iterator = set.values();
    while ((step = iterator.next(), !step.done)) {
      U.add(step.value);
    }
  }
  return U;
};

exports.difference = function difference(a, b) {
  if (a.size === 0) {
    return new Set();
  }
  if (b.size === 0) {
    return new Set();
  }

  const iterator = a.values();
  const D = new Set();
  let step;
  while ((step = iterator.next(), !step.done)) {
    if (!b.has(step.value)) {
      D.add(step.value);
    }
  }

  return D;
};

exports.symmetricDifference = function symmetricDifference(a, b) {
  const S = new Set();
  let iterator = a.values();
  let step;
  while ((step = iterator.next(), !step.done)) {
    if (!b.has(step.value)) {
      S.add(step.value);
    }
  }
  iterator = b.values();
  while ((step = iterator.next(), !step.done)) {
    if (!a.has(step.value)) {
      S.add(step.value);
    }
  }
  return S;
};

exports.isSubset = function isSubset(a, b) {
  const iterator = a.values();
  let step;
  while ((step = iterator.next(), !step.done)) {
    if (!b.has(step.value)) {
      return false;
    }
  }
  return true;
};

exports.isSuperset = function isSuperset(a, b) {
  return exports.isSubset(b, a);
};

exports.add = function add(a, b) {
  const iterator = b.values();
  let step;
  while ((step = iterator.next(), !step.done)) {
    a.add(step.value);
  }
};

exports.subtract = function subtract(a, b) {
  const iterator = b.values();
  let step;
  while ((step = iterator.next(), !step.done)) {
    a.delete(step.value);
  }
};

exports.intersect = function intersect(a, b) {
  const iterator = a.values();
  let step;
  while ((step = iterator.next(), !step.done)) {
    if (b.has(step.value)) {
      a.delete(step.value);
    }
  }
};

exports.disjuct = function disjuct(a, b) {
  let iterator = a.values();
  let step;
  const toRemove = [];
  while ((step = iterator.next(), !step.done)) {
    if (b.has(step.value)) {
      toRemove.push(step.value);
    }
  }
  iterator = b.values();
  while ((step = iterator.next(), !step.done)) {
    if (!a.has(step.value)) {
      a.add(step.value);
    }
  }
  for (let i = 0; i < toRemove.length; i++) {
    a.delete(toRemove[i]);
  }
};
