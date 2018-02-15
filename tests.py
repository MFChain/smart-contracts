import unittest
from web3 import Web3
import rlp
from ethereum.transactions import Transaction
from solc import compile_files
from random import randint

web3 = Web3(Web3.HTTPProvider("http://localhost:8545"))

accounts = web3.eth.accounts
res = compile_files(['contracts/4tests.sol'], optimize=True, optimize_runs=500)

controller = res['contracts/4tests.sol:ICO_controller']
crowdsale = res['contracts/4tests.sol:WhitelistedCrowdsale']
token = res['contracts/4tests.sol:MFC_Token']
erc223_receiver = res['contracts/4tests.sol:ERC223Receiver']
not_erc223_receiver = res['contracts/4tests.sol:StandardToken']

owner = web3.eth.account.create('password')
user = web3.eth.account.create('password1')
user2 = web3.eth.account.create('password1')
tx = {
    'from': accounts[randint(0,9)],
    'to': owner.address,
    'value': 10**18,
    'gas': 21001,
    'data': '0x'
    }
web3.eth.sendTransaction(tx)
tx = {
    'from': accounts[randint(0,9)],
    'to': user.address,
    'value': 10**18,
    'gas': 21001,
    'data': '0x'
    }
web3.eth.sendTransaction(tx)
tx = {
    'from': accounts[randint(0,9)],
    'to': user2.address,
    'value': 10**18,
    'gas': 21001,
    'data': '0x'
    }
web3.eth.sendTransaction(tx)
token_contract = web3.eth.contract(abi=token['abi'], bytecode=token['bin'])
tx = Transaction(
    nonce=web3.eth.getTransactionCount(owner.address),
    to=b'',
    gasprice=web3.eth.gasPrice,
    startgas=5000000,
    value=0,
    data=token_contract.bytecode,
    )
tx.sign(owner.privateKey)
raw_tx = rlp.encode(tx)
raw_tx_hex = web3.toHex(raw_tx)
tx_hash = web3.eth.sendRawTransaction(raw_tx_hex)
tx_receipt = web3.eth.getTransactionReceipt(tx_hash)
token_address = tx_receipt['contractAddress']
txo = {'from': owner.address}
txu = {'from': user.address}
txu2 = {'from': user2.address}
token = web3.eth.contract(abi=token['abi'], address=token_address)

# Create contract with ERC223_Receiver interface - another MFC_token
erc223_receiver_contract = web3.eth.contract(
    abi=erc223_receiver['abi'],
    bytecode=erc223_receiver['bin']
    )
tx = Transaction(
    nonce=web3.eth.getTransactionCount(owner.address),
    to=b'',
    gasprice=web3.eth.gasPrice,
    startgas=5000000,
    value=0,
    data=erc223_receiver_contract.bytecode,
    )
tx.sign(owner.privateKey)
raw_tx = rlp.encode(tx)
raw_tx_hex = web3.toHex(raw_tx)
tx_hash = web3.eth.sendRawTransaction(raw_tx_hex)
tx_receipt = web3.eth.getTransactionReceipt(tx_hash)
erc223_receiver_address = tx_receipt['contractAddress']

# Create contract without ERC223_Receiver interface
not_erc223_receiver_contract = web3.eth.contract(
    abi=not_erc223_receiver['abi'],
    bytecode=not_erc223_receiver['bin']
    )
tx = Transaction(
    nonce=web3.eth.getTransactionCount(owner.address),
    to=b'',
    gasprice=web3.eth.gasPrice,
    startgas=5000000,
    value=0,
    data=not_erc223_receiver_contract.bytecode,
    )
tx.sign(owner.privateKey)
raw_tx = rlp.encode(tx)
raw_tx_hex = web3.toHex(raw_tx)
tx_hash = web3.eth.sendRawTransaction(raw_tx_hex)
tx_receipt = web3.eth.getTransactionReceipt(tx_hash)
not_erc223_receiver_address = tx_receipt['contractAddress']


class MFCTokenTransferTestCase(unittest.TestCase):
    """
    Test the transfer method of MFC_token
    """
    err_mes = 'VM Exception while processing transaction: revert'

    def setUp(self):
        pass

    def test_transfer_to_address_with_success(self):
        """
        Test the transfer method in situation, when sender have enough
        tokens
        """
        previous_balance = token.call(
            txo
            ).balanceOf(user.address)
        tx = token.buildTransaction(txo).transfer(user.address, 1)
        tx['nonce'] = web3.eth.getTransactionCount(owner.address)
        signed = web3.eth.account.signTransaction(tx, owner.privateKey)
        web3.eth.sendRawTransaction(signed.rawTransaction)
        balance = token.call(txo).balanceOf(user.address)
        self.assertEqual(previous_balance, 0)
        self.assertEqual(balance, 1)

    def test_transfer_from_address_without_balance(self):
        """
        Test the transfer method in situation, when sender have not
        balance
        """
        previous_balance = token.call(
            txo
            ).balanceOf(owner.address)
        with self.assertRaisesRegex(ValueError, self.err_mes):
            tx = token.functions.transfer(owner.address, 1).buildTransaction(txu2)
            tx['nonce'] = web3.eth.getTransactionCount(user2.address)
            signed = web3.eth.account.signTransaction(tx, user2.privateKey)
            web3.eth.sendRawTransaction(signed.rawTransaction)
        balance = token.call(txo).balanceOf(owner.address)
        self.assertEqual(previous_balance, balance)

    def test_transfer_from_address_without_enough_tokens(self):
        """
        Test the transfer method in situation, when sender have not
        enough tokens
        """
        previous_balance = token.call(
            txo
            ).balanceOf(owner.address)
        with self.assertRaisesRegex(ValueError, self.err_mes):
            tx = token.buildTransaction(txu).transfer(user.address, 10)
            tx['nonce'] = web3.eth.getTransactionCount(user.address)
            signed = web3.eth.account.signTransaction(tx, user.privateKey)
            web3.eth.sendRawTransaction(signed.rawTransaction)
        balance = token.call(txo).balanceOf(owner.address)
        self.assertEqual(previous_balance, balance)

    def test_transfer_to_contract_with_ERC223_interface(self):
        """
        Test the transfer method to contract with ERC223_Receiver
        interface
        """
        previous_balance = token.call(
            txo
            ).balanceOf(erc223_receiver_address)
        tx = token.buildTransaction(txo).transfer(
            erc223_receiver_address,
            1
            )
        tx['nonce'] = web3.eth.getTransactionCount(owner.address)
        signed = web3.eth.account.signTransaction(tx, owner.privateKey)
        web3.eth.sendRawTransaction(signed.rawTransaction)
        balance = token.call(txo).balanceOf(erc223_receiver_address)
        self.assertEqual(previous_balance, 0)
        self.assertEqual(balance, 1)

    def test_transfer_to_contract_without_ERC223_interface(self):
        """
        Test the transfer method to contract without ERC223_Receiver
        interface
        """
        previous_balance = token.call(
            txo
            ).balanceOf(not_erc223_receiver_address)
        with self.assertRaisesRegex(ValueError, self.err_mes):
            tx = token.buildTransaction(txo).transfer(
                not_erc223_receiver_address,
                1
                )
            tx['nonce'] = web3.eth.getTransactionCount(owner.address)
            signed = web3.eth.account.signTransaction(tx, owner.privateKey)
            web3.eth.sendRawTransaction(signed.rawTransaction)
        balance = token.call(txo).balanceOf(not_erc223_receiver_address)
        self.assertEqual(previous_balance, balance)
