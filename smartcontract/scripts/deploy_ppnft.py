import json
from pathlib import Path
from brownie import PrivacyPreservingNFT,PoseidonT4,CurveBabyJubJub,config,network
from .util import get_account

def create_PPNFT(contract,contract_owner,NFT_owner,NFT_URL, NFT_commitment, NFT_publickey):
    """
    Create a new PPNFT and mint it to the NFT_owner address with the NFT_URL, NFT_commitment and NFT_publickey
    :param contract: the contract to interact with
    :param contract_owner: the owner of the contract
    :param NFT_owner: the owner of the NFT
    :param NFT_URL: the URL on IPFS of the NFT
    :param NFT_commitment: the commitment of the NFT
    :param NFT_publickey: the public key of the NFT owner
    :return: the tokenID of the minted NFT
    """
    tokenID = contract.mint_token.call(NFT_owner,NFT_URL, NFT_publickey, NFT_commitment, {'from': contract_owner})
    tx = contract.mint_token(NFT_owner,NFT_URL, NFT_publickey, NFT_commitment, {'from': contract_owner})
    tx.wait(1)
    print(f"NFT minted with tokenID: {tokenID}")
    return tokenID

