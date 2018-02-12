import json
import web3

from web3 import Web3, HTTPProvider
from solc import compile_source
from web3.contract import ConciseContract

# web3.py instance
w3 = Web3(HTTPProvider('http://127.0.0.1:8545'))

with open('../contracts/4tests.sol', 'r') as contracts_file:
    controller_source_code = contracts_file.read()

with open('../contracts/4tests_Holder.sol', 'r') as contracts_file:
    holder_source_code = contracts_file.read()

compiled_controller = compile_source(controller_source_code)
compiled_holder = compile_source(holder_source_code)

holder_interface = compiled_holder['<stdin>:Holder']
ico_controller_interface = compiled_controller['<stdin>:ICO_controller']

holder_contract = w3.eth.contract(
    abi=holder_interface['abi'],
    bytecode=holder_interface['bin'])
ico_controller_contract = w3.eth.contract(
    abi=ico_controller_interface['abi'],
    bytecode=ico_controller_interface['bin'])

holder_tx_hash = holder_contract.deploy(
    transaction={'from': w3.eth.accounts[0]},
    args=(['0x0000000000000000000000000000000000000000'],
    1,
    '0x0000000000000000000000000000000000000000')
)
holder_receipt = w3.eth.getTransactionReceipt(holder_tx_hash)
holder_contract_address = holder_receipt['contractAddress']

controller_tx_hash = ico_controller_contract.deploy(
    transaction={'from': w3.eth.accounts[0]},
    args=(holder_contract_address,
    '0x0000000000000000000000000000000000000000')
)
controller_receipt = w3.eth.getTransactionReceipt(controller_tx_hash)
controller_contract_address = controller_receipt['contractAddress']

print("Holder contract address: {}\n Holder contract gas spent: {}".
      format(holder_contract_address, holder_receipt['gasUsed']))
print("Controller contract address: {}\n Controller contract gas spent: {}".
      format(controller_contract_address, controller_receipt['gasUsed']))

print("Token contract address: {}".format(ico_controller_contract(controller_contract_address).call().token()))