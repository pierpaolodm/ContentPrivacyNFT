"use strict";
exports.__esModule = true;
exports.calcInitialVals = exports.calculateRoot = exports.OptimisedMT = void 0;
var assert = require('assert');
var ff = require('ffjavascript');
var stringifyBigInts = ff.utils.stringifyBigInts;
var unstringifyBigInts = ff.utils.unstringifyBigInts;
var deepCopyBigIntArray = function (arr) {
    return arr.map(function (x) { return BigInt(x.toString()); });
};
var calcInitialVals = function (leavesPerNode, depth, zeroValue, hashFunc) {
    var zeros = [];
    var currentLevelHash = zeroValue;
    for (var i = 0; i < depth; i++) {
        zeros.push(currentLevelHash);
        var z = [];
        for (var j = 0; j < leavesPerNode; j++) {
            z.push(zeros[i]);
        }
        currentLevelHash = hashFunc(z);
    }
    var root = currentLevelHash;
    return { zeros: zeros, root: root };
};
exports.calcInitialVals = calcInitialVals;
var OptimisedMT = /** @class */ (function () {
    function OptimisedMT(_depth, _zeroValue, _leavesPerNode, _hashFunc) {
        // The the smallest empty leaf index
        this.nextIndex = 0;
        // Contains the zero value per level. i.e. zeros[0] is zeroValue,
        // zeros[1] is the hash of leavesPerNode zeros, and so on.
        this.zeros = [];
        this.depth = _depth;
        this.zeroValue = _zeroValue;
        this.leavesPerNode = _leavesPerNode;
        this.hashFunc = _hashFunc;
        var r = calcInitialVals(this.leavesPerNode, this.depth, this.zeroValue, this.hashFunc);
        this.zeros = r.zeros;
        this.root = r.root;
        var numNodes = 1;
        for (var i = 0; i < this.depth; i++) {
            numNodes += Math.pow(this.leavesPerNode, (i + 1));
        }
        this.numNodes = numNodes;
        var rootIndex = numNodes - 1;
        this.nodes = {};
        this.nodes[rootIndex] = r.root;
        if (!_hashFunc) {
            this.hashFunc = poseidon;
        }
    }
    /*
     * Insert a leaf into the Merkle tree
     * @param _value The value to insert. This may or may not already be
     *               hashed.
     */
    OptimisedMT.prototype.insert = function (_value) {
        this.update(this.nextIndex, _value);
        this.nextIndex++;
    };
    OptimisedMT.prototype.update = function (_index, _value) {
        // Ensure that _value is a BigInt
        _value = BigInt(_value);
        // Set the leaf value
        this.setNode(_index, _value);
        // Set the parent leaf value
        // Get the parent indices
        var parentIndices = this.getParentIndices(_index);
        for (var _i = 0, parentIndices_1 = parentIndices; _i < parentIndices_1.length; _i++) {
            var parentIndex = parentIndices_1[_i];
            var childIndices = this.getChildIndices(parentIndex);
            var elements = [];
            for (var _a = 0, childIndices_1 = childIndices; _a < childIndices_1.length; _a++) {
                var childIndex = childIndices_1[_a];
                elements.push(this.getNode(childIndex));
            }
            this.nodes[parentIndex] = this.hashFunc(elements);
        }
        this.root = this.nodes[this.numNodes - 1];
    };
    /*
     *  Generates a Merkle proof from a leaf to the root.
     */
    OptimisedMT.prototype.genMerklePath = function (_index) {
        if (_index < 0) {
            throw new Error('The leaf index must be greater than 0');
        }
        if (_index >= Math.pow(this.leavesPerNode, this.depth)) {
            throw new Error('The leaf index is too large');
        }
        var pathElements = [];
        var indices = [_index % this.leavesPerNode];
        var r = Math.floor(_index / this.leavesPerNode);
        // Generate indices
        for (var i = 0; i < this.depth; i++) {
            var p = r % this.leavesPerNode;
            if (i < this.depth - 1) {
                indices.push(p);
            }
            r = Math.floor(r / this.leavesPerNode);
        }
        // Generate path elements
        var leafIndex = _index;
        var offset = 0;
        for (var i = 0; i < this.depth; i++) {
            var elements = [];
            var index = indices[i];
            var start = leafIndex - (leafIndex % this.leavesPerNode) + offset;
            for (var i_1 = 0; i_1 < this.leavesPerNode; i_1++) {
                if (i_1 !== index) {
                    elements.push(this.getNode(start + i_1));
                }
            }
            pathElements.push(elements);
            leafIndex = Math.floor(leafIndex / this.leavesPerNode);
            offset += Math.pow(this.leavesPerNode, (this.depth - i));
        }
        return {
            pathElements: pathElements,
            indices: indices,
            depth: this.depth,
            root: this.root,
            leaf: this.getNode(_index)
        };
    };
    /*
     * Generates a Merkle proof from a subroot to the root.
     */
    OptimisedMT.prototype.genMerkleSubrootPath = function (_startIndex, // inclusive
    _endIndex) {
        // The end index must be greater than the start index
        assert(_endIndex > _startIndex);
        var numLeaves = _endIndex - _startIndex;
        // The number of leaves must be a multiple of the tree arity
        assert(numLeaves % this.leavesPerNode === 0);
        // The number of leaves must be lower than the maximum tree capacity
        assert(numLeaves < Math.pow(this.leavesPerNode, this.depth));
        // The number of leaves must the tree arity raised to some positive integer
        var f = false;
        var subDepth;
        for (var i = 0; i < this.depth; i++) {
            if (numLeaves === Math.pow(this.leavesPerNode, i)) {
                subDepth = i;
                f = true;
                break;
            }
        }
        assert(f);
        assert(subDepth < this.depth);
        var subTree = new OptimisedMT(subDepth, this.zeroValue, this.leavesPerNode, this.hashFunc);
        for (var i = _startIndex; i < _endIndex; i++) {
            subTree.insert(this.getNode(i));
        }
        var fullPath = this.genMerklePath(_startIndex);
        fullPath.depth = this.depth - subDepth;
        fullPath.indices = fullPath.indices.slice(subDepth, this.depth);
        fullPath.pathElements = fullPath.pathElements.slice(subDepth, this.depth);
        fullPath.leaf = subTree.root;
        return fullPath;
    };
    OptimisedMT.prototype.getNode = function (_index) {
        assert(_index <= this.numNodes - 1);
        if (this.nodes[_index] != undefined) {
            return this.nodes[_index];
        }
        else {
            var r = 0;
            var level = this.depth;
            while (true) {
                r += Math.pow(this.leavesPerNode, level);
                if (_index < r) {
                    break;
                }
                level--;
            }
            return this.zeros[this.depth - level];
        }
    };
    OptimisedMT.prototype.setNode = function (_index, _value) {
        assert(_index <= this.numNodes - 1);
        this.nodes[_index] = _value;
    };
    OptimisedMT.prototype.getChildIndices = function (_index) {
        return OptimisedMT.calcChildIndices(_index, this.leavesPerNode, this.depth);
    };
    OptimisedMT.calcChildIndices = function (_index, _leavesPerNode, _depth) {
        // The node must be a parent
        assert(_index >= Math.pow(_leavesPerNode, _depth));
        // Determine which level the node is at
        var level = 0;
        var r = Math.pow(_leavesPerNode, level);
        while (true) {
            if (_index < r) {
                break;
            }
            level++;
            r += Math.pow(_leavesPerNode, level);
        }
        var start = (_index - (Math.pow(_leavesPerNode, (level)))) * _leavesPerNode;
        var indices = [start];
        for (var i = 0; i < _leavesPerNode - 1; i++) {
            indices.push(start + i + 1);
        }
        return indices;
    };
    OptimisedMT.prototype.getParentIndices = function (_index) {
        return OptimisedMT.calcParentIndices(_index, this.leavesPerNode, this.depth);
    };
    OptimisedMT.calcParentIndices = function (_index, _leavesPerNode, _depth) {
        assert(_depth > 1);
        assert(_leavesPerNode > 1);
        // The index must be of a leaf
        var treeCapacity = Math.pow(_leavesPerNode, _depth);
        assert(_index < treeCapacity);
        var indices = [];
        var levelCapacity = 0;
        var r = _index;
        for (var i = 0; i < _depth; i++) {
            levelCapacity += Math.pow(_leavesPerNode, (_depth - i));
            r = Math.floor(r / _leavesPerNode);
            var levelIndex = levelCapacity + r;
            indices.push(levelIndex);
        }
        return indices;
    };
    /*
     *  Deep-copies this object
     */
    OptimisedMT.prototype.copy = function () {
        var newTree = new OptimisedMT(this.depth, this.zeroValue, this.leavesPerNode, this.hashFunc);
        newTree.nodes = JSON.parse(JSON.stringify(stringifyBigInts(this.nodes)));
        newTree.numNodes = this.numNodes;
        newTree.nextIndex = this.nextIndex;
        newTree.zeros = deepCopyBigIntArray(this.zeros);
        newTree.root = this.root;
        newTree.nextIndex = this.nextIndex;
        return newTree;
    };
    OptimisedMT.verifyMerklePath = function (_proof, _hashFunc) {
        assert(_proof.pathElements);
        var pathElements = _proof.pathElements;
        // Validate the proof format
        assert(_proof.indices);
        for (var i = 0; i < _proof.depth; i++) {
            assert(pathElements[i]);
            assert(_proof.indices[i] != undefined);
        }
        // Hash the first level
        var firstLevel = pathElements[0].map(BigInt);
        firstLevel.splice(Number(_proof.indices[0]), 0, _proof.leaf);
        var currentLevelHash = _hashFunc(firstLevel);
        // Verify the proof
        for (var i = 1; i < pathElements.length; i++) {
            var level = pathElements[i].map(BigInt);
            level.splice(Number(_proof.indices[i]), 0, currentLevelHash);
            currentLevelHash = _hashFunc(level);
        }
        return currentLevelHash === _proof.root;
    };
    return OptimisedMT;
}());
exports.OptimisedMT = OptimisedMT;
/*
 * Calculate a Merkle root given a list of leaves
 */
var calculateRoot = function (leaves, arity, hashFunc) {
    if (leaves.length === 1) {
        return leaves[0];
    }
    assert(leaves.length % arity === 0);
    var hashes = [];
    for (var i = 0; i < leaves.length / arity; i++) {
        var r = [];
        for (var j = 0; j < arity; j++) {
            r.push(leaves[i * arity + j]);
        }
        hashes.push(hashFunc(r));
    }
    return calculateRoot(hashes, arity, hashFunc);
};
exports.calculateRoot = calculateRoot;
//# sourceMappingURL=OptimisedMT.js.map