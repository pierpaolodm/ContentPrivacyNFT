jest.setTimeout(90000)
const assert = require('assert')
import { hash2, hash5, hash16 } from '../'
import {
    OptimisedMT,
    calculateRoot,
    calcInitialVals,
} from '../OptimisedMT'
import { IncrementalTree } from '../IncrementalTree'

const ZERO_VALUE = BigInt(0)

describe('Benchmarks', () => {
    const depth = 32
    const numInsertions = 1000
    const indexToUpdate = 999

    const tree = new IncrementalTree(depth, ZERO_VALUE, 2, hash2)
    const omt = new OptimisedMT(depth, ZERO_VALUE, 2, hash2)

    it('Insertions', () => {
        let start = Date.now() 
        for (let i = 0; i < numInsertions; i ++) {
            tree.insert(BigInt(1))
        }
        let end = Date.now() 

        let dur = (end - start) / 1000 

        console.log(`${numInsertions} insertions took ${dur} seconds for an IncrementalTree`)

        start = Date.now()
        for (let i = 0; i < numInsertions; i ++) {
            omt.insert(BigInt(1))
        }
        end = Date.now()
        dur = (end - start) / 1000 
        console.log(`${numInsertions} insertions took ${dur} seconds for an OptimisedMT`)
    })

    it('Updates', () => {
        let start = Date.now() 
        tree.update(indexToUpdate, BigInt(1234))
        let end = Date.now() 
        let dur = (end - start) / 1000 
        console.log(`one update took ${dur} seconds for an IncrementalTree`)

        start = Date.now()
        omt.update(indexToUpdate, BigInt(1234))
        end = Date.now()
        dur = (end - start) / 1000 
        console.log(`one update took ${dur} seconds for an OptimisedMT`)
    })
})
