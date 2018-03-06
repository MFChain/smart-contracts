import csv
import os

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
except:
    pass

ESCROW_ADDRESS = w3.eth.accounts[1]
HOLDERS_ACCOUNTS = w3.eth.accounts[1:4]

compiled_source = compile_files([
    "../contracts/Holder.sol",
    "../contracts/ICO_controller.sol"], optimize=True)

holder_interface = compiled_source['../contracts/Holder.sol:Holder']
ico_controller_interface = compiled_source['../contracts/ICO_controller.sol:ICO_controller']

holder_contract = w3.eth.contract(
    abi=holder_interface['abi'],
    bytecode=holder_interface['bin'])
ico_controller_contract = w3.eth.contract(
    abi=ico_controller_interface['abi'],
    bytecode=ico_controller_interface['bin'])

holder_tx_hash = holder_contract.deploy(
    transaction={'from': w3.eth.accounts[0]},
    args=(HOLDERS_ACCOUNTS,  # List of accounts that control holder account
          1,  # Number of accounts needed to confirm changes
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
token_contract_address = ico_controller_contract(controller_contract_address).call().token()

print("\n\nHolder contract address: {}\n Holder contract gas spent: {}".
      format(holder_contract_address, holder_receipt['gasUsed']))
print("Controller contract address: {}\n Controller contract gas spent: {}".
      format(controller_contract_address, controller_receipt['gasUsed']))

print("Token contract address: {}".format(token_contract_address))

with open('deploy_info.csv', 'wt') as text_file:
    spamwriter = csv.writer(text_file, quoting=csv.QUOTE_MINIMAL)
    spamwriter.writerows([["Contract", "Address"],
                          ['Holder', holder_contract_address],
                          ['Controller', controller_contract_address],
                          ['Token', token_contract_address]])
