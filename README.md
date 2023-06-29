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
export NODE_OPTIONS="--max-old-space-size=8192" # 8 GB as example
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
├── scripts
│   ├── image_ops
│   └── proving_system
```
## Usage
To generate an image proof, use the following command:

```bash
./image_proof.py --image <image_path> --operation <operation_info> --frame-pixel <frame_pixel> [--check-pixel <check_pixel>] [--save-tiles <save_tiles_path>] [--save-image <save_image_path>] [--generate-csv] [--generate-contract]
```

- `<image_path>`: Path to the image file for which you want to generate the proof. Only PNG images are supported.
- `<operation_info>`: Image operation to perform. Currently, only "resize" operation is implemented. Specify the dimensions of the operation in the format `<height>x<width>`. For example, "resize_22x22" will resize the image to 22x22 pixels.
- `<frame_pixel>`: Number of pixels to divide in the greatest dimension of the frame.
- `<check_pixel>` : Maximum number of pixels to divide in order to respect a threshold. If specified, the script will calculate the maximum number of pixels per frame based on the threshold and print the result.
- `<save_tiles_path>` (optional): Path to save the frames as individual images.
- `<save_image_path>` (optional): Path to save the low-resolution image.
- `--generate-csv` (optional): Generate a CSV file with time and memory usage for each frame.
- `--generate-contract` (optional): Generate a contract in Solidity for verifying the proof on Ethereum.

**Example Usage:**

To generate a proof for an image `tux.png`, with a frame size of 32 pixels, and save the frames and low-resolution image that is in this case the resize of the original image to 22x22 pixels, use the following command:

```bash
./image_proof.py --image ./input/tux.png --operation resize_22x22 --frame-pixel 32 --save-tiles ./output/tiles --save-image ./output/resize_tux.png --generate-csv --generate-contract
```
## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/PIERdemo/ContentPrivacyNFT/blob/main/LICENSE) file for details.
