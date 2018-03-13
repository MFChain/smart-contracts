import csv
import os
import re
import argparse

from web3 import Web3, HTTPProvider
from solc import compile_files

from utils import wait_for_tx

try:
    os.remove("account_data.db")
except OSError:
    pass

# web3.py instance
w3 = Web3(HTTPProvider('http://127.0.0.1:8545'))
try:
    w3.personal.unlockAccount(w3.eth.accounts[0], '1')
except ValueError:
    pass


def ethereum_accounts(accounts):
    matched = re.match(r'^(,?0x[a-fA-F0-9]{40})+$', accounts)
    if not matched:
        raise argparse.ArgumentTypeError('Account arguments do not match "<address1>,<address2>"')
    accounts = re.findall(r'0x[a-fA-F0-9]{40}', accounts)
    for acc in accounts:
        if not w3.isChecksumAddress(acc):
            raise argparse.ArgumentTypeError('Some of accounts are not correct')
    return accounts


ap = argparse.ArgumentParser()

ap.add_argument('--accounts', '-a', type=ethereum_accounts,
                help='Accounts for multisig controll type like those: "<address1>,<address2>"',
                default=w3.eth.accounts[1:4])
ap.add_argument('--require', '-r', type=int, help='Minimum account confirmations needed to run Holder function',
                default=1)
ap.add_argument('--escrow', '-e', type=str, help="Escrow account for ICO's", default=w3.eth.accounts[1])

if __name__ == '__main__':
    args = vars(ap.parse_args())
    HOLDERS_ACCOUNTS = args.get('accounts')
    ESCROW_ADDRESS = args.get('escrow')
    REQUIRE = args.get('require')
    if REQUIRE > len(HOLDERS_ACCOUNTS):
        raise argparse.ArgumentTypeError('Require more than accounts')

    compiled_source = compile_files([
        "../contracts/Holder.sol",
        "../contracts/ICO_controller.sol",
        "../contracts/Token_holder.sol"], optimize=True)

    holder_interface = compiled_source['../contracts/Holder.sol:Holder']
    ico_controller_interface = compiled_source['../contracts/ICO_controller.sol:ICO_controller']
    token_holder_interface = compiled_source['../contracts/Token_holder.sol:TokenHolder']

    holder_contract = w3.eth.contract(
        abi=holder_interface['abi'],
        bytecode=holder_interface['bin'])
    ico_controller_contract = w3.eth.contract(
        abi=ico_controller_interface['abi'],
        bytecode=ico_controller_interface['bin'])
    token_holder_contract = w3.eth.contract(
        abi=token_holder_interface['abi'],
        bytecode=token_holder_interface['bin'])

    holder_tx_hash = holder_contract.deploy(
        transaction={'from': w3.eth.accounts[0]},
        args=(HOLDERS_ACCOUNTS,  # List of accounts that control holder account
              REQUIRE,  # Number of accounts needed to confirm changes
              ESCROW_ADDRESS)  # Escrow account
    )
    holder_receipt = wait_for_tx(holder_tx_hash,
                                 w3,
                                 wait_message="Wait for Holder contract to be deployed")

    holder_contract_address = holder_receipt['contractAddress']

    controller_tx_hash = ico_controller_contract.deploy(
        transaction={'from': w3.eth.accounts[0]},
        args=(holder_contract_address,
              ESCROW_ADDRESS)  # Escrow account
    )
    controller_receipt = wait_for_tx(controller_tx_hash,
                                     w3,
                                     wait_message="Wait for ICO controller contract to be deployed")
    controller_contract_address = controller_receipt['contractAddress']
    controller_instance = ico_controller_contract(controller_contract_address)
    token_contract_address = controller_instance.call().token()

    token_holder_tx_hash = token_holder_contract.deploy(
        transaction={'from': w3.eth.accounts[0]},
        args=(HOLDERS_ACCOUNTS,  # List of accounts that control holder account
              REQUIRE,
              token_contract_address)  # Number of accounts needed to confirm changes
    )
    token_holder_receipt = wait_for_tx(token_holder_tx_hash,
                                       w3,
                                       wait_message="Wait for Token holder contract to be deployed")
    token_holder_address = token_holder_receipt['contractAddress']
    tx_hash = controller_instance.transact(
        {'from': w3.eth.accounts[0]}
    ).setIncentiveProgram(token_holder_address)
    wait_for_tx(tx_hash,
                w3,
                wait_message="Wait for Token holder contract to be added to Controller")

    print("\n\nHolder contract address: {}\n Holder contract gas spent: {}".
          format(holder_contract_address, holder_receipt['gasUsed']))
    print("Controller contract address: {}\n Controller contract gas spent: {}".
          format(controller_contract_address, controller_receipt['gasUsed']))
    print("Token Holder address: {}\n Token Holder contract gas spent: {}".
          format(token_holder_address, token_holder_receipt['gasUsed']))

    print("Token contract address: {}".format(token_contract_address))

    with open('deploy_info.csv', 'wt') as text_file:
        spamwriter = csv.writer(text_file, quoting=csv.QUOTE_MINIMAL)
        spamwriter.writerows([["Contract", "Address"],
                              ['Holder', holder_contract_address],
                              ['Controller', controller_contract_address],
                              ['Token Holder', token_holder_address],
                              ['Token', token_contract_address]])
