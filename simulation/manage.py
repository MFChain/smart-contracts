import csv
import argparse
import time
from datetime import datetime

from web3 import Web3, HTTPProvider
from solc import compile_files


def get_token_instance(compiled_source):
    with open('deploy_info.csv', 'rt') as text_file:
        spamreader = csv.reader(text_file, quoting=csv.QUOTE_MINIMAL)
        next(spamreader)
        next(spamreader)
        next(spamreader)
        token_address = next(spamreader)[1]

    token_interface = compiled_source['../contracts/MFC_coin.sol:MFC_Token']
    token_contract = w3.eth.contract(
        abi=token_interface['abi'],
        bytecode=token_interface['bin'])
    token_instance = token_contract(token_address)
    return token_instance


def get_controller_instance(compiled_source):
    with open('deploy_info.csv', 'rt') as text_file:
        spamreader = csv.reader(text_file, quoting=csv.QUOTE_MINIMAL)
        next(spamreader)
        next(spamreader)
        address = next(spamreader)[1]

    ico_controller_interface = compiled_source['../contracts/ICO_controller.sol:ICO_controller']

    ico_controller_contract = w3.eth.contract(
        abi=ico_controller_interface['abi'],
        bytecode=ico_controller_interface['bin'])
    ico_controller_instance = ico_controller_contract(address)
    return ico_controller_instance


def get_ico_instance(address, compiled_source):
    ico_interface = compiled_source['../contracts/ICO_crowdsale.sol:WhitelistedCrowdsale']
    ico_contract = w3.eth.contract(
        abi=ico_interface['abi'],
        bytecode=ico_interface['bin'])
    ico_instance = ico_contract(address)
    return ico_instance


def add_address_to_whitelist(address, controller_instance):
    tx_hash = controller_instance.transact(
        {'from': w3.eth.accounts[0]}
    ).addBuyerToWhitelist(address)
    while True:
        try:
            w3.eth.getTransactionReceipt(tx_hash)
            break
        except Exception as e:
            print("Wait for account to be added to whitelist")
            time.sleep(5)
            continue

    print("\n\n{} successfully added to whitelist".format(address))


def print_address_balance(address, token_instance):
    addr_balance = token_instance.call().balanceOf(address)
    print("{} balance: {}".format(address, addr_balance))


def print_stage_info():
    with open('deploy_info.csv', 'rt') as text_file:
        spamreader = csv.reader(text_file, quoting=csv.QUOTE_MINIMAL)
        next(spamreader)
        next(spamreader)
        next(spamreader)
        next(spamreader)
        ico_array = []
        for name, address in spamreader:
            ico_array.append((name, get_ico_instance(address, compiled_source)))

    if not ico_array:
        print("No stage was activated")

    print("Current date: {}\n".format(
        datetime.utcfromtimestamp(time.time()).strftime('%Y-%m-%dT%H:%M:%SZ'))
    )
    for name, ico_instance in ico_array:
        print("Stage: {}\n  Address: {}\n  Has ended: {}\n  Start date: {}\n  End date: {}".format(
            name, ico_instance.address, ico_instance.call().hasEnded(),
            datetime.utcfromtimestamp(ico_instance.call().startTime()).strftime('%Y-%m-%dT%H:%M:%SZ'),
            datetime.utcfromtimestamp(ico_instance.call().endTime()).strftime('%Y-%m-%dT%H:%M:%SZ'),
        ))
        print("  Wei raised: {}\n".format(ico_instance.call().getWeiRaised()))


ap = argparse.ArgumentParser()

ap.add_argument('--address', '-a', type=str, help='ICO controller address.')
ap.add_argument('command', type=str, choices=['balance', 'whitelist', 'stage_info'],
                help='Command to do')

if __name__ == '__main__':
    args = vars(ap.parse_args())
    address = args['address']
    command = args['command']

    w3 = Web3(HTTPProvider('http://127.0.0.1:8545'))
    w3.personal.unlockAccount(w3.eth.accounts[0], '1')

    compiled_source = compile_files(["../contracts/ICO_controller.sol"])

    token_instance = get_token_instance(compiled_source)
    controller_instance = get_controller_instance(compiled_source)

    if command == 'balance':
        print_address_balance(address, token_instance)
    elif command == 'whitelist':
        add_address_to_whitelist(address, controller_instance)
    elif command == 'stage_info':
        print_stage_info()
