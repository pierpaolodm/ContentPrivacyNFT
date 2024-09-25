from ape import networks, accounts, config
LOCAL_BLOCKCHAIN_ENVIRONMENTS = ["hardhat", "development", "ganache", "mainnet-fork"]

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
