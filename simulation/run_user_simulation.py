import time
import csv
from random import randint
from web3 import Web3, HTTPProvider
from solc import compile_files
from sqlalchemy.orm import sessionmaker
from utils import wait_for_tx, ACCOUNT_INDENT, CSV_ROWS, get_csv_file_row

from user_token import Account, engine, get_or_create


def get_expected_token_amount(wei_amount, rate):
    bonus_amount = 0
    basic_amount = wei_amount * rate
    if wei_amount < w3.toWei(10, 'ether'):
        pass
    elif wei_amount < w3.toWei(25, 'ether'):
        bonus_amount = basic_amount // 10
    elif wei_amount < w3.toWei(100, 'ether'):
        bonus_amount = (basic_amount * 15) // 100
    else:
        bonus_amount = basic_amount // 5
    return basic_amount + bonus_amount


NUMBER_OF_ACCOUNTS = 50

w3 = Web3(HTTPProvider('http://127.0.0.1:8545'))
w3.personal.unlockAccount(w3.eth.accounts[0], '1')
session = sessionmaker(bind=engine)()

compiled_source = compile_files(
    ["../contracts/ICO_controller.sol"],
    optimize=True)

ico_interface = compiled_source['../contracts/ICO_crowdsale.sol:WhitelistedCrowdsale']
ico_controller_interface = compiled_source['../contracts/ICO_controller.sol:ICO_controller']
ico_contract = w3.eth.contract(
    abi=ico_interface['abi'],
    bytecode=ico_interface['bin'])
ico_controller_contract = w3.eth.contract(
    abi=ico_controller_interface['abi'],
    bytecode=ico_controller_interface['bin']
)

with open('deploy_info.csv', 'rt') as text_file:
    _, ico_controller_address = get_csv_file_row(text_file, CSV_ROWS['controller'])

with open('deploy_info.csv', 'rt') as text_file:
    stage, ico_address = get_csv_file_row(text_file, CSV_ROWS['last_row'])

print("Simulate {} with address: {}".format(stage, ico_address))

ico_instance = ico_contract(ico_address)
ico_rate = ico_instance.call().rate()
print("Start time: %i" % ico_instance.call().startTime())
print("Current time: %i" % int(time.time()))
print("End time: %i" % ico_instance.call().endTime())
print("Wallet: %s" % ico_instance.call().wallet())

ico_controller_instance = ico_controller_contract(ico_controller_address)

for acc in w3.eth.accounts[ACCOUNT_INDENT:ACCOUNT_INDENT + NUMBER_OF_ACCOUNTS]:
    w3.personal.unlockAccount(acc, '1')

for acc in w3.eth.accounts[ACCOUNT_INDENT:ACCOUNT_INDENT + NUMBER_OF_ACCOUNTS]:
    if not ico_controller_instance.call().isAddressWhitelisted(acc):
        wait_for_tx(ico_controller_instance.transact(
            {'from': w3.eth.accounts[0]}
        ).addBuyerToWhitelist(acc),
                    w3, delay=3)

    value_eth = randint(1, 110)
    value = w3.toWei(value_eth, 'ether')
    wait_for_tx(w3.eth.sendTransaction({
        'from': acc,
        'to': ico_address,
        'value': value
    }), w3, delay=3)
    print("{} sends {} ETH".format(acc, value_eth))
    expected_amount = get_expected_token_amount(value, ico_rate)
    account_db = get_or_create(session, Account, address=acc)
    account_db.balance = str(int(account_db.balance) + expected_amount)
    session.commit()
