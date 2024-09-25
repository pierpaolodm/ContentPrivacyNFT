import json
from pathlib import Path
# from brownie import PrivacyPreservingNFT,PoseidonT4,CurveBabyJubJub,config,network
from ape import project, accounts
from .util import get_account
from .contract_management import otp_message, generate_keys, get_DH_key

# npx hardhat node
# ape run deploy_ppnft --network ::hardhat

# def create_PPNFT(contract,contract_owner,NFT_owner,NFT_URL, NFT_commitment, NFT_publickey):
def create_CNFT(contract, contract_owner, NFT_owner, NFT_url, NFT_commitment, NFT_publickey):
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
    token_ID = contract.mint_token.call(NFT_owner, NFT_url, NFT_publickey, NFT_commitment)
    tx_receipt = contract.mint_token(NFT_owner,NFT_url, NFT_publickey, NFT_commitment, sender=contract_owner)

    # Check the status of the transaction
    if tx_receipt.status == 1:
        print("Transaction was successful!")
    else:
        print("Transaction failed.")

    # Access return values or logs
    print("TokenId:", token_ID)
    return token_ID

def place_bid(contract, bidder_pk, bidder_eth, NFT_ID, bid):
    """ 
        Place a bid to buy an nft
    """
    tx_receipt = contract.place_bid(NFT_ID, bidder_pk, sender=bidder_eth, value=bid)

    # Check the status of the transaction
    if tx_receipt.status == 1:
        print("Transaction was successful!")
    else:
        print("Transaction failed.")

def accept_bid(contract, enc_keys, seller_eth, NFT_ID):
    tx_receipt = contract.accept_bid(NFT_ID, enc_keys, sender=seller_eth)

    # Check the status of the transaction
    if tx_receipt.status == 1:
        print("Transaction was successful!")
    else:
        print("Transaction failed.")

def confirm_transfer(contract, NFT_ID, buyer_eth):

    tx_receipt = contract.confirm_transfer(NFT_ID, sender=buyer_eth)

    # Check the status of the transaction
    if tx_receipt.status == 1:
        print("Transaction was successful!")
    else:
        print("Transaction failed.")

def deny_transfer(contract, NFT_ID, secret_buyer, buyer_eth):

    tx_receipt = contract.deny_transfer(NFT_ID, secret_buyer, sender=buyer_eth)

    # Check the status of the transaction
    if tx_receipt.status == 1:
        print("Transaction was successful!")
    else:
        print("Transaction failed.")


def main():
    # You need an account to deploy, as it requires a transaction.
    account = accounts.load('acc2')
    contract = project.PrivacyPreservingNFT.deploy(sender=account)
    NFT_URL = "https://prova.com"
    NFT_COMMITMENT = 1909566540319490668505464193114406576163084795931578910597850857213307102672
    NFT_PUBLICKEY = [1909566540319490668505464193114406576163084795931578910597850857213307102672, 2804941038371946927022228180870025856354364918512123731416669042891989653992]

    print("Create two CNFT")
    token_first = create_CNFT(contract, account, account, NFT_URL, NFT_COMMITMENT, NFT_PUBLICKEY)
    token_second = create_CNFT(contract, account, account, NFT_URL, NFT_COMMITMENT, NFT_PUBLICKEY)

    BUYER_PUBLICKEY = [6378989569467225567309534547136303686644419554308519296145321495775954212673, 16010429975713919011176582662180309984128710453752058578792360322531236071730]
    BUYER_PRIVATEKEY = 5108749564616922944623307300865609593199002065721763377677127026853717918172

    CIM_KEYS = [20654402781161244175649661120811486717942345019967861771375015267468133361436, 17981196581554561415736919538296660446323667881694034503987452210026485961492, 14323223138064477798325804107984787773432249179628703453481456957044015918693]
    
    # First test... everything is fine.
    buyer_account = accounts.load('acc3')
    place_bid(contract, BUYER_PUBLICKEY, buyer_account, token_first, 10**9)

    DH_KEY = get_DH_key(BUYER_PRIVATEKEY, NFT_PUBLICKEY)
    sess_key = generate_keys(DH_KEY)
    ENC_KEYS = otp_message(sess_key, CIM_KEYS)
    accept_bid(contract, ENC_KEYS, account, token_first)

    confirm_transfer(contract, token_first, buyer_account)

    # Second test... wrong symmetric key is passed.
    # place_bid(contract, BUYER_PUBLICKEY, buyer_account, token_second, 10**9)

    # DH_KEY = get_DH_key(BUYER_PRIVATEKEY, NFT_PUBLICKEY)
    # sess_key = generate_keys(DH_KEY)
    # ENC_KEYS = otp_message(sess_key, [CIM_KEYS[0]+1, CIM_KEYS[1], CIM_KEYS[2]])
    # accept_bid(contract, ENC_KEYS, account, token_second)

    # deny_transfer(contract, token_second, BUYER_PRIVATEKEY, buyer_account) TODO fix this


