import json
from pathlib import Path
# from brownie import PrivacyPreservingNFT,PoseidonT4,CurveBabyJubJub,config,network
from ape import project, accounts
from .util import *
from .contract_management import otp_message, generate_keys, get_DH_key, generate_keypair_sec256, get_DH_key_sec256
from .secp256k1 import is_on_curve

def main():
    # You need an account to deploy, as it requires a transaction.
    account = accounts.load('acc2')
    contract = project.PrivacyPreservingNFT.deploy(sender=account)
    NFT_URL = "https://prova.com"
    CIM_KEYS = [20654402781161244175649661120811486717942345019967861771375015267468133361436, 17981196581554561415736919538296660446323667881694034503987452210026485961492, 14323223138064477798325804107984787773432249179628703453481456957044015918693]
    NFT_COMMITMENT = 1909566540319490668505464193114406576163084795931578910597850857213307102672

    NFT_PUBLICKEY, NFT_PRIVATEKEY = generate_keypair_sec256()
    print("public", NFT_PUBLICKEY)
    print("curve?", is_on_curve(NFT_PUBLICKEY))
    print("private", NFT_PRIVATEKEY)

    print("Create two CNFT")
    token_first,gas = create_CNFT(contract, account, account, NFT_URL, NFT_COMMITMENT, NFT_PUBLICKEY)
    print("Gas for the first token mint", gas)
    token_second, gas = create_CNFT(contract, account, account, NFT_URL, NFT_COMMITMENT+1, NFT_PUBLICKEY)
    print("Gas for the second token mint", gas)

    BUYER_PUBLICKEY, BUYER_PRIVATEKEY  = generate_keypair_sec256()
    print("public", BUYER_PUBLICKEY)
    print("curve?", is_on_curve(BUYER_PUBLICKEY))
    print("private", BUYER_PRIVATEKEY)

    # First test... everything is fine.
    buyer_account = accounts.load('acc3')
    gas = place_bid(contract, BUYER_PUBLICKEY, buyer_account, token_first, 10**9)
    print("Gas for placing a bid", gas)

    DH_KEY = get_DH_key(BUYER_PRIVATEKEY, NFT_PUBLICKEY)
    DH_KEY = get_DH_key_sec256(BUYER_PRIVATEKEY, NFT_PUBLICKEY)
    sess_key = generate_keys(DH_KEY)
    ENC_KEYS = otp_message(sess_key, CIM_KEYS)
    print("DH", DH_KEY)
    print("SESS_KEY", sess_key)
    print("ENC", ENC_KEYS)
    gas = accept_bid(contract, ENC_KEYS, account, token_first)
    print("Gas for accepting a bid", gas)

    gas = confirm_transfer(contract, token_first, buyer_account)
    print("Gas for confirming the bid", gas)

    # Second test... wrong symmetric key is passed.
    place_bid(contract, BUYER_PUBLICKEY, buyer_account, token_second, 10**9)

    DH_KEY = get_DH_key_sec256(BUYER_PRIVATEKEY, NFT_PUBLICKEY)
    sess_key = generate_keys(DH_KEY)
    ENC_KEYS = otp_message(sess_key, [6378989569467225567309534547136303686644419554308519296145321495775954212673, CIM_KEYS[1], CIM_KEYS[2]])
    accept_bid(contract, ENC_KEYS, account, token_second)

    gas = deny_transfer(contract, token_second, BUYER_PRIVATEKEY, buyer_account)
    print("Gas for denying a bid", gas)


