const assert = require('assert')
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
const unstringifyBigInts: (obj: object) => any = ff.utils.unstringifyBigInts

type Leaf = bigint
type Root = bigint
type PathElements = bigint[][]
type Indices = number[]

interface MerkleProof {
    pathElements: PathElements;
    indices: Indices;
    depth: number;
    root: bigint;
    leaf: Leaf;
}

const deepCopyBigIntArray = (arr: bigint[]) => {
    return arr.map((x) => BigInt(x.toString()))
}

const calcInitialVals = (
    leavesPerNode: number,
    depth: number,
    zeroValue: bigint,
    hashFunc: (leaves: bigint[]) => bigint
) => {
    const zeros: bigint[] = []
    const filledSubtrees: bigint[][] = []
    const filledPaths = {}

    let currentLevelHash = zeroValue
    for (let i = 0; i < depth; i++) {
        if (i < depth - 1) {
            filledPaths[i] = []
        }
        zeros.push(currentLevelHash)

        const z: bigint[] = []
        for (let j = 0; j < leavesPerNode; j ++) {
            z.push(zeros[i])
        }
        filledSubtrees.push(z)

        currentLevelHash = hashFunc(z)
    }

    const root = hashFunc(filledSubtrees[depth - 1])

    return { zeros, filledSubtrees, filledPaths, root }
}

const _insert = (
    depth: number,
    leavesPerNode: number,
    nextIndex: number,
    value: bigint,
    filledSubtrees: bigint[][],
    filledPaths: any,
    leaves: bigint[],
    zeros: bigint[],
    hashFunc: (leaves: bigint[]) => bigint,
) => {
    let m = nextIndex % leavesPerNode
    filledSubtrees[0][m] = value
    let currentIndex = nextIndex
    for (let i = 1; i < depth; i++) {
        // currentIndex is the leaf or node's absolute index
        currentIndex = Math.floor(currentIndex / leavesPerNode)

        // m is the leaf's relative position within its node
        m = currentIndex % leavesPerNode

        if (m === 0) {
            // Zero out the level
            for (let j = 1; j < filledSubtrees[i].length; j ++) {
                filledSubtrees[i][j] = zeros[i]
            }
        }

        const z = filledSubtrees[i - 1]
        const hashed = hashFunc(z)
        filledSubtrees[i][m] = hashed

        if (filledPaths[i - 1].length <= currentIndex) {
            filledPaths[i - 1].push(hashed)
        } else {
            filledPaths[i - 1][currentIndex] = hashed
        }
    }
    leaves.push(value)
}

const _genMerklePath = (
    _index: number,
    leavesPerNode: number,
    depth: number,
    leaves: bigint[],
    zeros: bigint[],
    filledPaths: any,
    root: bigint,
): MerkleProof => {
    if (_index < 0) {
        throw new Error('The leaf index must be greater than 0')
    }
    if (_index >= leaves.length) {
        throw new Error('The leaf index is too large')
    }

    const pathElements: bigint[][] = []
    const indices: number[] = [_index % leavesPerNode]

    let r = Math.floor(_index / leavesPerNode)

    for (let i = 0; i < depth; i ++) {
        const s: bigint[] = []
        if (i === 0) {
            // Get a slice of leaves, padded with zeros
            const leafStartIndex = _index - (_index % leavesPerNode)
            const leafEndIndex = leafStartIndex + leavesPerNode
            for (let j = leafStartIndex; j < leafEndIndex; j ++) {
                if (j < leaves.length) {
                    s.push(leaves[j])
                } else {
                    s.push(zeros[i])
                }
            }
        } else {
            for (let j = 0; j < leavesPerNode; j ++) {
                const x = r * leavesPerNode + j
                if (filledPaths[i - 1].length <= x) {
                    s.push(zeros[i])
                } else {
                    const e = filledPaths[i - 1][x]
                    s.push(e)
                }
            }
        }

        const p = r % leavesPerNode
        pathElements.push(s)

        if (i < depth - 1) {
            indices.push(p)
        }

        r = Math.floor(r /leavesPerNode)
    }

    // Remove the commitments to elements which are the leaves per level
    const newPe: bigint[][] = [[]]
    const firstIndex = _index % leavesPerNode

    for (let i = 0; i < pathElements[0].length; i ++) {
        if (i !== firstIndex) {
            newPe[0].push(pathElements[0][i])
        }
    }

    for (let i = 1; i < pathElements.length; i ++) {
        const level: bigint[] = []
        for (let j = 0; j < pathElements[i].length; j ++) {
            if (j !== indices[i]) {
                level.push(pathElements[i][j])
            }
        }
        newPe.push(level)
    }

    return {
        pathElements: newPe,
        indices,
        depth: depth,
        root,
        leaf: leaves[_index],
    }
}

const _genMerkleSubrootPath = (
    _startIndex: number, // inclusive
    _endIndex: number, // exclusive
    leavesPerNode: number,
    depth: number,
    zeroValue: bigint,
    leaves: bigint[],
    zeros: bigint[],
    filledSubtrees: bigint[][],
    filledPaths: any,
    root: bigint,
    hashFunc: (leaves: bigint[]) => bigint,
): MerkleProof => {
    // The end index must be greater than the start index
    assert(_endIndex > _startIndex)
    const numLeaves = _endIndex - _startIndex

    // The number of leaves must be a multiple of the tree arity
    assert(numLeaves % leavesPerNode === 0)

    // The number of leaves must be lower than the maximum tree capacity
    assert(numLeaves < leavesPerNode ** depth)

    // The number of leaves must the tree arity raised to some positive integer
    let f = false
    let subDepth
    for (let i = 0; i < depth; i ++) {
        if (numLeaves === leavesPerNode ** i) {
            subDepth = i
            f = true
            break
        }
    }

    assert(f)
    assert(subDepth < depth)

    const leaf = calculateRoot(
        leaves.slice(_startIndex, _endIndex),
        leavesPerNode,
        hashFunc,
    )

    const fullPath = _genMerklePath(
        _startIndex,
        leavesPerNode,
        depth,
        leaves,
        zeros,
        filledPaths,
        root,
    )
    fullPath.depth = depth - subDepth
    fullPath.indices = fullPath.indices.slice(subDepth, depth)
    fullPath.pathElements = fullPath.pathElements.slice(subDepth, depth)
    fullPath.leaf = leaf

    return fullPath
}

const _verifyMerklePath = (
    _proof: MerkleProof,
    _hashFunc: (leaves: bigint[]) => bigint,
) => {
    assert (_proof.pathElements)

    const pathElements = _proof.pathElements
    // Validate the proof format
    assert (_proof.indices)
    for (let i = 0; i < _proof.depth; i ++) {
        assert(pathElements[i])
        assert(_proof.indices[i] != undefined)
    }

    // Hash the first level
    const firstLevel: bigint[] = pathElements[0].map(BigInt)
    firstLevel.splice(Number(_proof.indices[0]), 0, _proof.leaf)
    let currentLevelHash: bigint = _hashFunc(firstLevel)

    // Verify the proof
    for (let i = 1; i < pathElements.length; i ++) {
        const level: bigint[] = pathElements[i].map(BigInt)
        level.splice(Number(_proof.indices[i]), 0, currentLevelHash)

        currentLevelHash = _hashFunc(level)
    }

    return currentLevelHash === _proof.root
}

/* 
 * An incremental Merkle tree.
 */
class IncrementalTree {
    // The number of leaves per node
    public leavesPerNode: number

    // The tree depth
    public depth: number

    // The default value for empty leaves
    public zeroValue: bigint

    // The tree root
    public root: bigint

    // The the smallest empty leaf index
    public nextIndex: number

    // All leaves in the tree
    public leaves: Leaf[] = []

    // Contains the zero value per level. i.e. zeros[0] is zeroValue,
    // zeros[1] is the hash of leavesPerNode zeros, and so on.
    public zeros: bigint[] = []

    // Caches values needed for efficient appends.
    public filledSubtrees: bigint[][] = []

    // Caches values needed to compute Merkle paths.
    public filledPaths: any = {}

    // The hash function to use
    public hashFunc: (leaves: bigint[]) => bigint

    constructor (
        _depth: number,
        _zeroValue: bigint | number,
        _leavesPerNode: number,
        _hashFunc: (leaves: bigint[]) => bigint
    ) {
        this.leavesPerNode = Number(_leavesPerNode)

        this.depth = Number(_depth)

        assert(this.depth > 0)

        this.nextIndex = 0
        this.zeroValue = BigInt(_zeroValue)

        this.hashFunc = _hashFunc

        const r = calcInitialVals(
            this.leavesPerNode,
            this.depth,
            this.zeroValue,
            this.hashFunc,
        )

        this.filledSubtrees = r.filledSubtrees
        this.filledPaths = r.filledPaths
        this.zeros = r.zeros
        this.root = r.root
    }

    /* 
     * Insert a leaf into the Merkle tree
     * @param _value The value to insert. This may or may not already be
     *               hashed.
     */
    public insert(
        _value: Leaf,
    ) {
        // Ensure that _value is a BigInt
        _value = BigInt(_value)

        // A node is one level above the leaf
        // m is the leaf's relative position within its node
        let m = this.nextIndex % this.leavesPerNode

        if (m === 0) {
            // Zero out the level in filledSubtrees
            for (let j = 1; j < this.filledSubtrees[0].length; j ++) {
                this.filledSubtrees[0][j] = this.zeros[0]
            }
        }

        _insert(
            this.depth,
            this.leavesPerNode,
            this.nextIndex,
            _value,
            this.filledSubtrees,
            this.filledPaths,
            this.leaves,
            this.zeros,
            this.hashFunc,
        )

        this.nextIndex ++
        this.root = this.hashFunc(
            this.filledSubtrees[this.filledSubtrees.length - 1],
        )
    }

    /* 
     * Update the leaf at the specified index with the given value.
     */
    public update(
        _index: number,
        _value: Leaf,
    ) {
        if (_index >= this.nextIndex || _index >= this.leaves.length) {
            throw new Error('The leaf index specified is too large')
        }

        _value = BigInt(_value)

        const temp = this.leaves
        temp[_index] = _value

        this.leaves[_index] = _value

        const newTree = new IncrementalTree(
            this.depth,
            this.zeroValue,
            this.leavesPerNode,
            this.hashFunc,
        )

        for (let i = 0; i < temp.length; i++) {
            newTree.insert(temp[i])
        }

        this.leaves = newTree.leaves
        this.zeros = newTree.zeros
        this.filledSubtrees = newTree.filledSubtrees
        this.filledPaths = newTree.filledPaths
        this.root = newTree.root
        this.nextIndex = newTree.nextIndex
    }

    /*
     * Returns the leaf value at the given index
     */
    public getLeaf(_index: number): Leaf {
        return this.leaves[_index]
    }

    /*
     * Generates a Merkle proof from a subroot to the root.
     */
    public genMerkleSubrootPath(
        _startIndex: number, // inclusive
        _endIndex: number, // exclusive
    ): MerkleProof {
        return _genMerkleSubrootPath(
            _startIndex,
            _endIndex,
            this.leavesPerNode,
            this.depth,
            this.zeroValue,
            this.leaves,
            this.zeros,
            this.filledSubtrees,
            this.filledPaths,
            this.root,
            this.hashFunc,
        )
    }

    /*  Generates a Merkle proof from a leaf to the root.
     */
    public genMerklePath(_index: number): MerkleProof {
        return _genMerklePath(
            _index,
            this.leavesPerNode,
            this.depth,
            this.leaves,
            this.zeros,
            this.filledPaths,
            this.root,
        )
    }

    /*
     * Return true if the given Merkle path is valid, and false otherwise.
     */
    public static verifyMerklePath(
        _proof: MerkleProof,
        _hashFunc: (leaves: bigint[]) => bigint,
    ): boolean {

        return _verifyMerklePath( _proof, _hashFunc)
    }

    /*  Deep-copies this object
     */
    public copy(): IncrementalTree {
        const newTree = new IncrementalTree(
            this.depth,
            this.zeroValue,
            this.leavesPerNode,
            this.hashFunc,
        )
        newTree.leaves = deepCopyBigIntArray(this.leaves)
        newTree.zeros = deepCopyBigIntArray(this.zeros)
        newTree.root = this.root
        newTree.nextIndex = this.nextIndex
        newTree.filledSubtrees = this.filledSubtrees.map(deepCopyBigIntArray)
        newTree.filledPaths = unstringifyBigInts(JSON.parse(
            JSON.stringify(stringifyBigInts(this.filledPaths))
        ))

        return newTree
    }

    public equals(t: IncrementalTree): boolean {
        const eq =
            this.depth === t.depth &&
            this.zeroValue === t.zeroValue &&
            this.leavesPerNode === t.leavesPerNode &&
            this.root === t.root &&
            this.nextIndex === t.nextIndex &&
            this.leaves.length === t.leaves.length &&
            this.filledSubtrees.length === t.filledSubtrees.length
            this.filledPaths.length === t.filledPaths.length

        if (!eq) { return false }
        
        for (let i = 0; i < this.leaves.length; i ++) {
            if (this.leaves[i] !== t.leaves[i]) {
                return false
            }
        }

        return true
    }
}

/* 
 * Multiple incremental Merkle tree. When a tree is full, the next insertion
 * goes into a new tree.
 */
class MultiIncrementalTree {
    // The number of leaves per node
    public leavesPerNode: number

    // The tree depth
    public depth: number

    // The default value for empty leaves
    public zeroValue: bigint

    public currentTreeNum = 0

    // The tree roots
    public roots: bigint[]

    // The the smallest empty leaf index
    public nextIndex: number

    // All leaves in the tree
    public leaves: Leaf[] = []

    // Contains the zero value per level. i.e. zeros[0] is zeroValue,
    // zeros[1] is the hash of leavesPerNode zeros, and so on.
    public zeros: bigint[] = []

    // Caches values needed for efficient appends.
    public filledSubtrees: bigint[][][] = []

    // Caches values needed to compute Merkle paths.
    public filledPaths: any[] = []

    // The hash function to use
    public hashFunc: (leaves: bigint[]) => bigint

    constructor (
        _depth: number,
        _zeroValue: bigint | number,
        _leavesPerNode: number,
        _hashFunc: (leaves: bigint[]) => bigint
    ) {
        this.leavesPerNode = Number(_leavesPerNode)

        this.depth = Number(_depth)

        assert(this.depth > 0)

        this.nextIndex = 0
        this.zeroValue = BigInt(_zeroValue)

        this.hashFunc = _hashFunc

        const r = calcInitialVals(
            this.leavesPerNode,
            this.depth,
            this.zeroValue,
            this.hashFunc,
        )

        this.zeros = r.zeros
        this.filledSubtrees = [r.filledSubtrees]
        this.filledPaths = [r.filledPaths]
        this.roots = [r.root]
    }

    /* 
     * Insert a leaf into the Merkle tree
     * @param _value The value to insert. This may or may not already be
     *               hashed.
     */
    public insert(
        _value: Leaf,
    ) {

        if (this.nextIndex >= this.leavesPerNode ** this.depth) {
            this.nextIndex = 0
            this.currentTreeNum ++
            const r = calcInitialVals(
                this.leavesPerNode,
                this.depth,
                this.zeroValue,
                this.hashFunc,
            )

            this.zeros = r.zeros
            this.filledSubtrees.push(r.filledSubtrees)
            this.filledPaths.push(r.filledPaths)
            this.roots.push(r.root)
        }
        // Ensure that _value is a BigInt
        _value = BigInt(_value)

        // A node is one level above the leaf
        // m is the leaf's relative position within its node
        let m = this.nextIndex % this.leavesPerNode

        if (m === 0) {
            // Zero out the level in filledSubtrees
            for (let j = 1; j < this.leavesPerNode; j ++) {
                this.filledSubtrees[this.currentTreeNum][0][j] = this.zeros[0]
            }
        }

        _insert(
            this.depth,
            this.leavesPerNode,
            this.nextIndex,
            _value,
            this.filledSubtrees[this.currentTreeNum],
            this.filledPaths[this.currentTreeNum],
            this.leaves,
            this.zeros,
            this.hashFunc,
        )

        this.nextIndex ++
        this.roots[this.currentTreeNum] = this.hashFunc(
            this.filledSubtrees[this.currentTreeNum][this.filledSubtrees[this.currentTreeNum].length - 1],
        )
    }

    /* 
     * Update the leaf at the specified index with the given value.
     */
    public update(
        _absoluteIndex: number,
        _value: Leaf,
    ) {
        if (_absoluteIndex >= this.leaves.length) {
            throw new Error('The leaf index specified is too large')
        }

        _value = BigInt(_value)

        const capacity = this.leavesPerNode ** this.depth
        const treeNum = Math.floor(_absoluteIndex / capacity)

        const subTree = new IncrementalTree(
            this.depth,
            this.zeroValue,
            this.leavesPerNode,
            this.hashFunc,
        )

        this.leaves[_absoluteIndex] = _value

        const s = treeNum * capacity

        for (let i = s; i < s + capacity; i ++) {
            if (i >= this.leaves.length) {
                break
            }
            subTree.insert(this.leaves[i])
        }

        this.filledPaths[treeNum] = subTree.filledPaths
        this.filledSubtrees[treeNum] = subTree.filledSubtrees
        this.roots[treeNum] = subTree.root
    }

    /*
     * Returns the leaf value at the given index
     */
    public getLeaf(_index: number): Leaf {
        return this.leaves[_index]
    }

    /*
     * Generates a Merkle proof from a subroot to the root.
     */
    public genMerkleSubrootPath(
        _absoluteStartIndex: number, // inclusive
        _absoluteEndIndex: number, // exclusive
    ): MerkleProof {
        assert(_absoluteEndIndex > _absoluteStartIndex)

        const capacity = this.leavesPerNode ** this.depth
        const treeNum = Math.floor(_absoluteStartIndex / capacity)

        const leaves = this.leaves.slice(
            treeNum * capacity,
            treeNum * capacity + capacity,
        )

        return _genMerkleSubrootPath(
            _absoluteStartIndex % capacity,
            _absoluteEndIndex % capacity,
            this.leavesPerNode,
            this.depth,
            this.zeroValue,
            leaves,
            this.zeros,
            this.filledSubtrees[treeNum],
            this.filledPaths[treeNum],
            this.roots[treeNum],
            this.hashFunc,
        )
    }

    /*  
     *  Generates a Merkle proof from a leaf to the root.
     */
    public genMerklePath(
        _absoluteIndex: number,
    ): MerkleProof {
        const capacity = this.leavesPerNode ** this.depth
        const index = _absoluteIndex % capacity
        const treeNum = Math.floor(_absoluteIndex / capacity)

        assert(treeNum < this.roots.length)

        return _genMerklePath(
            index,
            this.leavesPerNode,
            this.depth,
            this.leaves,
            this.zeros,
            this.filledPaths[treeNum],
            this.roots[treeNum],
        )
    }

    /*
     * Return true if the given Merkle path is valid, and false otherwise.
     */
    public static verifyMerklePath(
        _proof: MerkleProof,
        _hashFunc: (leaves: bigint[]) => bigint,
    ): boolean {

        return _verifyMerklePath( _proof, _hashFunc)
    }

    /*  Deep-copies this object
     */
    public copy(): MultiIncrementalTree {
        const newTree = new MultiIncrementalTree(
            this.depth,
            this.zeroValue,
            this.leavesPerNode,
            this.hashFunc,
        )
        newTree.leaves = deepCopyBigIntArray(this.leaves)
        newTree.zeros = deepCopyBigIntArray(this.zeros)
        newTree.roots = deepCopyBigIntArray(this.roots)
        newTree.currentTreeNum = this.currentTreeNum
        newTree.nextIndex = this.nextIndex
        newTree.filledSubtrees = unstringifyBigInts(JSON.parse(
            JSON.stringify(stringifyBigInts(this.filledSubtrees))
        ))
        newTree.filledPaths = unstringifyBigInts(JSON.parse(
            JSON.stringify(stringifyBigInts(this.filledPaths))
        ))

        return newTree
    }

    public equals(t: MultiIncrementalTree): boolean {
        const eq =
            this.currentTreeNum === t.currentTreeNum &&
            this.depth === t.depth &&
            this.zeroValue === t.zeroValue &&
            this.leavesPerNode === t.leavesPerNode &&
            this.nextIndex === t.nextIndex &&
            this.roots.length === t.roots.length &&
            this.leaves.length === t.leaves.length &&
            JSON.stringify(stringifyBigInts(this.filledPaths)) ===
                JSON.stringify(stringifyBigInts(t.filledPaths)) &&
            JSON.stringify(stringifyBigInts(this.filledSubtrees)) ===
                JSON.stringify(stringifyBigInts(t.filledSubtrees))

        if (!eq) { return false }

        for (let i = 0; i < this.roots.length; i ++) {
            if (this.roots[i] !== t.roots[i]) {
                return false
            }
        }
        
        for (let i = 0; i < this.leaves.length; i ++) {
            if (this.leaves[i] !== t.leaves[i]) {
                return false
            }
        }

        return true
    }
}

/*
 * Calculate a Merkle root given a list of leaves
 */
const calculateRoot = (
    leaves: bigint[],
    arity: number,
    hashFunc: (leaves: bigint[]) => bigint,
): bigint => {
    if (leaves.length === 1) {
        return leaves[0]
    }

    assert(leaves.length % arity === 0)

    const hashes: bigint[] = []
    for (let i = 0; i < leaves.length / arity; i ++) {
        const r: bigint[] = []
        for (let j = 0; j < arity; j ++) {
            r.push(leaves[i * arity + j])
        }
        hashes.push(hashFunc(r))
    }
    return calculateRoot(hashes, arity, hashFunc)
}

export {
    IncrementalTree,
    MultiIncrementalTree,
    calculateRoot,
}
