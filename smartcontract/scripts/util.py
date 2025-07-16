from ape import networks, accounts, config
from csv import DictWriter
import os

LOCAL_BLOCKCHAIN_ENVIRONMENTS = ["hardhat", "development", "ganache", "mainnet-fork"]


def append_to_csv(row,csv_path):
    """
    Append a row to a csv file if it exists, otherwise create it
    :param row: dictionary with the row to append
    :param csv_path: path to the csv file
    """
    with open(csv_path, 'a+', newline='') as csv_file:
        dict_writer = DictWriter(csv_file, fieldnames=list(row.keys()))
        if 0 == os.stat(csv_path).st_size:
            dict_writer.writeheader()
        dict_writer.writerow(row)


def create_CNFT(contract, contract_owner, NFT_owner, NFT_url, NFT_commitment, NFT_publickey):
    global counter
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
    gas_cost = contract.mint_token.estimate_gas_cost(NFT_owner, NFT_url, NFT_publickey, NFT_commitment)
    tx_receipt = contract.mint_token(NFT_owner,NFT_url, NFT_publickey, NFT_commitment, sender=contract_owner,show_trace=False)

    # Check the status of the transaction
    if tx_receipt.status == 1:
        print("Transaction was successful!")
    else:
        print("Transaction failed.")

    # Access return values or logs
    print("TokenId:", token_ID)
    return token_ID, gas_cost

def place_bid(contract, bidder_pk, bidder_eth, NFT_ID, bid):
    """ 
        Place a bid to buy an nft
    """
    gas_cost = contract.place_bid.estimate_gas_cost(NFT_ID, bidder_pk, sender=bidder_eth, value=bid)
    tx_receipt = contract.place_bid(NFT_ID, bidder_pk, sender=bidder_eth, value=bid)

    # Check the status of the transaction
    if tx_receipt.status == 1:
        print("Transaction was successful!")
    else:
        print("Transaction failed.")
    return gas_cost

def accept_bid(contract, enc_keys, seller_eth, NFT_ID):
    gas_cost = contract.accept_bid.estimate_gas_cost(NFT_ID, enc_keys, sender=seller_eth)
    tx_receipt = contract.accept_bid(NFT_ID, enc_keys, sender=seller_eth)

    # Check the status of the transaction
    if tx_receipt.status == 1:
        print("Transaction was successful!")
    else:
        print("Transaction failed.")
    return gas_cost

def confirm_transfer(contract, NFT_ID, buyer_eth):
    gas_cost = contract.confirm_transfer.estimate_gas_cost(NFT_ID, sender=buyer_eth)
    tx_receipt = contract.confirm_transfer(NFT_ID, sender=buyer_eth)

    # Check the status of the transaction
    if tx_receipt.status == 1:
        print("Transaction was successful!")
    else:
        print("Transaction failed.")
    return gas_cost

def deny_transfer(contract, NFT_ID, secret_buyer, buyer_eth):
    gas_cost = contract.confirm_transfer.estimate_gas_cost(NFT_ID, sender=buyer_eth)
    tx_receipt = contract.deny_transfer(NFT_ID, secret_buyer, sender=buyer_eth, show_trace=False)

    # Check the status of the transaction
    if tx_receipt.status == 1:
        print("Transaction was successful!")
    else:
        print("Transaction failed.")

    return gas_cost

def get_account(index=None, id=None):
    """
    Get the account depending on the network we are on.
    If we are on a persistent network like mainnet, we will use the id.
    If we are on a local network like hardhat, we will use the index.
    :param index: rappresent the index of the account in the list of accounts for local network
    :param id: rappresent the id of the account for persistent network
    :return: account
    """
    if index:
        return accounts[index]
    if networks.show_active() in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        return accounts[0]
    if id:
        return accounts.load(id)
    return accounts.add(config["wallets"]["from_key"])
