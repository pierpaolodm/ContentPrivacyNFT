# ContentPrivacyNFT
## Description
This project aims to address the **issue** of **indiscriminate access** to **data** contained within **decentralized** platforms that regulate the **ownership** of digital assets through **Non-Fungible Tokens** (NFTs). While NFTs have been widely used for digital asset ownership, the public accessibility of the associated data poses a challenge for asset owners in certain scenarios.

The goal of this project is to design and implement a framework for publishing NFTs that maintains compliance with standards while integrating **privacy-enhancing tools** such as **zero-knowledge proofs** (ZKP). By leveraging ZKP, the framework aims to enable confidentiality of the NFT content without compromising its usability. However, the inefficiency of such tools presents a significant challenge, requiring extensive experimental work to identify practical solutions in real-world scenarios.

## Prerequisites
- [Circom](https://docs.circom.io/) (v2.0.0)
- [Snarkjs](https://github.com/iden3/snarkjs) (v0.6.10)
- [RapidSnark](https://github.com/iden3/rapidsnark) (v0.0.0)
- [Python](https://www.python.org/) (v3.10)
    - [Numpy](https://numpy.org/) (v1.24.0) [Python package] 
    - [Tensorflow](https://www.tensorflow.org/) (v2.12.0) [Python package]
    - [OpenCV](https://opencv.org/) (v4.7.0) [Python package]

### Recommandations
Since the snarks usually take a long time to generate, it is recommended to unlock `nodejs` memory limit by running the following command:
```bash
export NODE_OPTIONS=--max-old-space-size=#[memory MB]
```
Morover follow the recommandations provided in the following [link](https://hackmd.io/V-7Aal05Tiy-ozmzTGBYPA?view#Best-Practices-for-Large-Circuits) to improve the performance of the snarks generation.


## Installation
After cloning the repository, it is necessary to modify the following file in order to set the correct paths:
- Modifiy the path of the **rapidsnark** library in `scripts/proving_system/prover.sh`.
- Set the **powersoftau** file in `image_proof.py`

After that ensure that the following directories exist:
```bash
├── circuits
│   └── base
│       └── poseidon2
├── input
├── output
├── powersoftau
├── scripts
│   ├── image_ops
│   └── proving_system
```
## Usage
TODO