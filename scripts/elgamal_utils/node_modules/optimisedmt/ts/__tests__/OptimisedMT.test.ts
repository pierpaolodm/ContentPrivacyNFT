jest.setTimeout(90000)
const assert = require('assert')
import { hash2, hash5, hash16 } from '../'
import {
    OptimisedMT,
    calculateRoot,
    calcInitialVals,
} from '../OptimisedMT'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts

const ZERO_VALUE = BigInt(0)

const hashLeftRight = (left: bigint, right: bigint) => {
    return hash2([left, right])
}

const testEmpty = (
    depth: number,
    arity: number,
    hashFunc: (leaves: bigint[]) => bigint,
) => {
    const tree = new OptimisedMT(depth, ZERO_VALUE, arity, hashFunc)

    const leaves: bigint[] = []
    for (let i = 0; i < arity ** depth; i ++) {
        leaves.push(ZERO_VALUE)
    }

    const expectedRoot = calculateRoot(leaves, arity, hashFunc)

    expect(tree.root.toString()).toEqual(expectedRoot.toString())
}

const testCalcParentIndices = (
    _index: number,
    _leavesPerNode: number,
    _depth: number,
    _expected: number[],
) => {
    const indices = OptimisedMT.calcParentIndices(_index, _leavesPerNode, _depth)
    expect(indices.toString()).toEqual(_expected.toString())
}

const testCalcChildIndices = (
    _index: number,
    _leavesPerNode: number,
    _depth: number,
    _expected: number[],
) => {
    const indices = OptimisedMT.calcChildIndices(_index, _leavesPerNode, _depth)
    expect(indices.toString()).toEqual(_expected.toString())
}

const testInsertion = (
    depth: number,
    arity: number,
    hashFunc: (leaves: bigint[]) => bigint,
) => {
    const tree = new OptimisedMT(depth, ZERO_VALUE, arity, hashFunc)
    const leaves: bigint[] = []
    for (let i = 0; i < arity ** depth; i ++) {
        const rootBefore = tree.root
        const nextIndexBefore = tree.nextIndex

        const leaf = BigInt(i + 1)
        leaves.push(leaf)
        tree.insert(leaf)

        const nextIndexAfter = tree.nextIndex
        const rootAfter = tree.root

        expect(nextIndexBefore + 1).toEqual(nextIndexAfter)
        expect(rootBefore).not.toEqual(rootAfter)
    }

    const expectedRoot = calculateRoot(leaves, arity, hashFunc)
    expect(tree.root.toString()).toEqual(expectedRoot.toString())

    //const miTree = new MultiIncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //const iTree = new IncrementalTree(depth, ZERO_VALUE, arity, hashFunc)

    //const leaves: bigint[] = []
    //for (let i = 0; i < arity ** depth; i ++) {
        //const leaf = BigInt(i)
        //leaves.push(leaf)
        //miTree.insert(leaf)
        //iTree.insert(leaf)

        //expect(miTree.roots[0].toString()).toEqual(iTree.root.toString())
    //}

    //const expectedRoot = calculateRoot(leaves, arity, hashFunc)
    //expect(miTree.roots[0].toString()).toEqual(expectedRoot.toString())
    //expect(iTree.root.toString()).toEqual(expectedRoot.toString())
    
    //const newLeaf = BigInt(1234)
    //miTree.insert(newLeaf)
    //const newLeaves: bigint[] = [newLeaf]
    //for (let i = 1; i < arity ** depth; i ++) {
        //const leaf = BigInt(i)
        //newLeaves.push(leaf)
        //miTree.insert(leaf)
    //}
    //const newExpectedRoot = calculateRoot(newLeaves, arity, hashFunc)
    //expect(miTree.roots[1].toString()).toEqual(newExpectedRoot.toString())
}

const testUpdate = (
    depth: number,
    arity: number,
    hashFunc: (leaves: bigint[]) => bigint,
) => {
    const tree = new OptimisedMT(depth, ZERO_VALUE, arity, hashFunc)

    const leaves: bigint[] = []
    for (let i = 0; i < arity ** depth; i ++) {
        const leaf = BigInt(i)
        leaves.push(leaf)
        tree.insert(leaf)
    }

    const newLeaf = BigInt(1234)
    const indexToUpdate = arity ** depth - 1 

    const rootBefore = tree.root
    const nextIndexBefore = tree.nextIndex

    leaves[indexToUpdate] = newLeaf
    tree.update(indexToUpdate, newLeaf)

    const nextIndexAfter = tree.nextIndex
    const rootAfter = tree.root

    expect(rootBefore).not.toEqual(rootAfter)
    const expectedRoot = calculateRoot(leaves, arity, hashFunc)
    expect(tree.root.toString()).toEqual(expectedRoot.toString())

    expect(nextIndexBefore).toEqual(nextIndexAfter)
    //const miTree = new MultiIncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //const iTree = new IncrementalTree(depth, ZERO_VALUE, arity, hashFunc)

    //const leaves: bigint[] = []
    //for (let i = 0; i < arity ** depth; i ++) {
        //const leaf = BigInt(i)
        //leaves.push(leaf)
        //miTree.insert(leaf)
        //iTree.insert(leaf)
    //}

    //const newLeaf = BigInt(1234)
    //const indexToUpdate = arity ** depth - 1 

    //leaves[indexToUpdate] = newLeaf
    //miTree.update(indexToUpdate, newLeaf)
    //iTree.update(indexToUpdate, newLeaf)

    //const expectedRoot = calculateRoot(leaves, arity, hashFunc)
    //expect(iTree.root.toString()).toEqual(expectedRoot.toString())

    //expect(miTree.roots[0].toString()).toEqual(expectedRoot.toString())

    //const newMiTree = new MultiIncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //for (let i = 0; i < arity ** depth * 2; i ++) {
        //const leaf = BigInt(i)
        //newMiTree.insert(leaf)
    //}
    //const newLeaf2 = BigInt(4567)
    //const newLeaves: bigint[] = [newLeaf2]
    //for (let i = 1; i < arity ** depth; i ++) {
        //newLeaves.push(BigInt(i + arity ** depth))
    //}
    //const indexToUpdate2 = arity ** depth
    //newMiTree.update(indexToUpdate2, newLeaf2)
    //const newExpectedRoot = calculateRoot(newLeaves, arity, hashFunc)
    //expect(newMiTree.roots[1].toString()).toEqual(newExpectedRoot.toString())
}

const testGenMerkleProof = (
    depth: number,
    arity: number,
    hashFunc: (leaves: bigint[]) => bigint,
) => {
    // Empty tree
    const tree = new OptimisedMT(depth, ZERO_VALUE, arity, hashFunc)
    const path = tree.genMerklePath(arity ** depth - 1)
    expect(OptimisedMT.verifyMerklePath(path, hashFunc)).toBeTruthy()

    for (let i = 0; i < arity ** depth; i ++) {
        const leaf = BigInt(i)
        tree.insert(leaf)
        const path = tree.genMerklePath(i)
        expect(OptimisedMT.verifyMerklePath(path, hashFunc)).toBeTruthy()
    }
    
    //const miTree = new MultiIncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //const iTree = new IncrementalTree(depth, ZERO_VALUE, arity, hashFunc)

    //for (let i = 0; i < arity ** depth; i ++) {
        //const leaf = BigInt(i)
        //miTree.insert(leaf)
        //iTree.insert(leaf)
    //}

    //for (let i = 0; i < arity ** depth; i ++) {
        //const mp = iTree.genMerklePath(i)
        //const mp2 = miTree.genMerklePath(i)
        //expect(IncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()
        //expect(IncrementalTree.verifyMerklePath(mp2, hashFunc)).toBeTruthy()
        //expect(MultiIncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()
        //expect(MultiIncrementalTree.verifyMerklePath(mp2, hashFunc)).toBeTruthy()

        //expect(JSON.stringify(stringifyBigInts(mp))
        //).toEqual(
            //JSON.stringify(stringifyBigInts(mp2))
        //)
    //}

    //for (let i = 0; i < arity ** depth; i ++) {
        //const leaf = BigInt(i)
        //miTree.insert(leaf)
    //}

    //for (let i = 0; i < arity ** depth; i ++) {
        //const mp = miTree.genMerklePath(i + arity ** depth)
        //expect(MultiIncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()
    //}
}

const testGenMerkleSubtreeProof = (
    depth: number,
    subDepth: number,
    arity: number,
    hashFunc: (leaves: bigint[]) => bigint,
) => {
    const tree = new OptimisedMT(depth, ZERO_VALUE, arity, hashFunc)
    const subCapacity = arity ** subDepth

    for (let i = 0; i < arity ** depth; i ++) {
        const leaf = BigInt(i)
        tree.insert(leaf)
    }

    for (let i = 0; i < arity ** depth - subCapacity; i += subCapacity) {
        const start = i
        const end = start + subCapacity

        const mp = tree.genMerkleSubrootPath(start, end)
        expect(OptimisedMT.verifyMerklePath(mp, hashFunc)).toBeTruthy()

        expect(mp.depth).toEqual(depth - subDepth)

        mp.pathElements[0][0] = mp.pathElements[0][0] + BigInt(1)
        expect(OptimisedMT.verifyMerklePath(mp, hashFunc)).toBeFalsy()
    }

    //const miTree = new MultiIncrementalTree(depth, ZERO_VALUE, arity, hashFunc)
    //const iTree = new IncrementalTree(depth, ZERO_VALUE, arity, hashFunc)

    //const subCapacity = arity ** subDepth

    //for (let i = 0; i < arity ** depth; i ++) {
        //const leaf = BigInt(i)
        //miTree.insert(leaf)
        //iTree.insert(leaf)
    //}

    //for (let i = 0; i < arity ** depth - subCapacity; i += subCapacity) {
        //const start = i
        //const end = start + subCapacity

        //const mp = iTree.genMerkleSubrootPath(start, end)
        //expect(IncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()

        //const mp2 = miTree.genMerkleSubrootPath(start, end)

        //expect(IncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()
        //expect(IncrementalTree.verifyMerklePath(mp2, hashFunc)).toBeTruthy()
        //expect(MultiIncrementalTree.verifyMerklePath(mp, hashFunc)).toBeTruthy()
        //expect(MultiIncrementalTree.verifyMerklePath(mp2, hashFunc)).toBeTruthy()

        //expect(JSON.stringify(stringifyBigInts(mp))
        //).toEqual(
            //JSON.stringify(stringifyBigInts(mp2))
        //)

        //expect(mp.depth).toEqual(depth - subDepth)

        //mp.pathElements[0][0] = mp.pathElements[0][0] + BigInt(1)
        //expect(IncrementalTree.verifyMerklePath(mp, hashFunc)).toBeFalsy()
        //expect(MultiIncrementalTree.verifyMerklePath(mp, hashFunc)).toBeFalsy()
    //}
}

const allTests = (
    arity: number,
    depth: number,
    hashFunc: (leaves: bigint[]) => bigint,
    subDepth: number,
) => {
    it('empty tree', async () => {
        testEmpty(depth, arity, hashFunc)
    })
    it('insertions', async () => {
        testInsertion(depth, arity, hashFunc)
        testInsertion(3, 5, hash5)
    })

    it('udpates', async () => {
        testUpdate(depth, arity, hashFunc)
    })

    it('merkle proof', async () => {
        testGenMerkleProof(depth, arity, hashFunc)
    })

    it('merkle subtree proof (a)', async () => {
        testGenMerkleSubtreeProof(depth, subDepth, arity, hashFunc)
    })

    it('merkle subtree proof (b)', async () => {
        testGenMerkleSubtreeProof(depth, subDepth, arity, hashFunc)
    })
}

describe('Incremental Merkle Tree', () => {
    describe('Arity of 2', () => {
        const arity = 2
        const depth = 3
        const subDepth = 2
        const hashFunc = hash2

        allTests(arity, depth, hashFunc, subDepth)
    })

    describe('Arity of 5', () => {
        const arity = 5
        const depth = 3
        const subDepth = 2
        const hashFunc = hash5

        allTests(arity, depth, hashFunc, subDepth)
    })

    it('calcParentIndices', () => {
        testCalcParentIndices(0, 5, 1, [5])
        testCalcParentIndices(4, 2, 3, [10, 13, 14])
    })

    it('calcChildIndices', () => {
        testCalcChildIndices(10, 2, 3, [4, 5])
        testCalcChildIndices(13, 2, 3, [10, 11])
        testCalcChildIndices(14, 2, 3, [12, 13])
    })
})
