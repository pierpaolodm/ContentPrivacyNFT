import * as assert from 'assert'
const circom = require('circom')
import { babyJub } from 'circomlib'
import {
    genPubKey,
    genRandomSalt,
} from 'maci-crypto'

const F = babyJub.F

interface BabyJubPoint {
    x: BigInt,
    y: BigInt,
}

interface Message {
    point: BabyJubPoint,
    xIncrement: BigInt,
}

interface ElGamalCiphertext {
    c1: BabyJubPoint;
    c2: BabyJubPoint;
    xIncrement: BigInt;
}

const encodeToMessage = (original: BigInt, randomVal:BigInt = genRandomSalt()):
Message => {
     const randomPoint = genPubKey(randomVal)
     assert(babyJub.inSubgroup(randomPoint))
 
     const xIncrement = F.e(F.sub(randomPoint[0], original))
     assert(xIncrement >= BigInt(0))
 
     const xVal = randomPoint[0]
     const yVal = randomPoint[1]
 
     const point: BabyJubPoint = { x: xVal, y: yVal }
     return { point, xIncrement }
 }


 /*
 * Converts a Message into the original value.
 * The original value is the x-value of the BabyJub point minus the
 * x-increment.
 * @param message The message to convert.
 */
const decodeMessage = (message: Message): BigInt => {
    const decoded = BigInt(
        F.e(
            F.sub(message.point.x, message.xIncrement),
        )
    )
    assert(decoded >= BigInt(0))
    assert(decoded < babyJub.p)

    return decoded
}

 /**
  *
  * START OF SCRIPT 
  * 
  */

const input_command = process.argv[2]
if(input_command !== "--encode" && input_command !== "--decode")  {
    console.log("Invalid input command")
    process.exit(1)
}

if(input_command === "--encode"){

    const message = BigInt(process.argv[3])
    const randomness = BigInt(process.argv[4])

    const encodedMessage = encodeToMessage(message, randomness)
    
    let output_message =`${encodedMessage.point.x},` + `${encodedMessage.point.y},` + `${encodedMessage.xIncrement}`
    console.log(output_message)
}

if(input_command === "--decode"){

    const x = BigInt(process.argv[3])
    const y = BigInt(process.argv[4])
    const xIncrement = BigInt(process.argv[5])


    const message: Message = {point: {x,y},xIncrement}
    const decodedMessage = decodeMessage(message)
    console.log(decodedMessage.toString())
}