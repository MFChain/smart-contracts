import time
import csv
import argparse
import urllib

from web3 import Web3, HTTPProvider
from solc import compile_files

from utils import wait_for_tx, get_csv_file_row, CSV_ROWS

stage_method_map = {
    'private_offer': 'startPrivateOffer',
    'presale': 'startPreSaleIco',
    'crowdsale': 'startCrowdsale'
}

stage_member_map = {
    'private_offer': 'privateOffer',
    'presale': 'preSale',
    'crowdsale': 'crowdsale'
}


def url_type(url):
    if urllib.parse.urlparse(url).scheme != "http":
        msg = "%r is not an url" % url
        raise argparse.ArgumentTypeError(msg)
    return url


ap = argparse.ArgumentParser()

ap.add_argument('--address', '-a', type=str, help='ICO controller address.', default='0')
ap.add_argument('--start_date', '-s', type=int, help='ICO start unix datetime', default=int(time.time() + 5))
ap.add_argument('--end_date', '-d', type=int, help='ICO end unit datetime delta', required=True)
ap.add_argument('--stage', '-t', type=str, help='ICO stage (private_offer, presale, crowdsale)',
                choices=['private_offer', 'presale', 'crowdsale'])

ap.add_argument('--provider', '-p', type=url_type, help='http url to provider', default='http://127.0.0.1:8545')

if __name__ == '__main__':
    args = vars(ap.parse_args())
    address = args['address']
    start_date = args.get('start_date')
    end_date = args.get('end_date')
    stage = args.get('stage')
    net_provider = args.get('provider')
    rate = args.get('rate')

    w3 = Web3(HTTPProvider(net_provider))
    w3.personal.unlockAccount(w3.eth.accounts[0], '1')

    if address == '0':
        with open('deploy_info.csv', 'rt') as text_file:
            address = get_csv_file_row(text_file, CSV_ROWS['controller'])[1]

    compiled_source = compile_files(["../contracts/ICO_controller.sol"])
    ico_controller_interface = compiled_source['../contracts/ICO_controller.sol:ICO_controller']

    ico_controller_contract = w3.eth.contract(
        abi=ico_controller_interface['abi'],
        bytecode=ico_controller_interface['bin'])
    ico_controller_instance = ico_controller_contract(address)
    contract_method = getattr(ico_controller_instance.transact({'from': w3.eth.accounts[0]}), stage_method_map[stage])

    tx_hash = contract_method(start_date, end_date)

    tx_receipt = wait_for_tx(tx_hash, w3, wait_message="Wait for ico start transaction to be confirmed")

    ico_address = getattr(ico_controller_instance.call(), stage_member_map[stage])()
    print("\n\n{} address: {}".format(stage, ico_address))
    with open('deploy_info.csv', 'at') as text_file:
        spamwriter = csv.writer(text_file, quoting=csv.QUOTE_MINIMAL)
        spamwriter.writerow((stage, ico_address))

    print("Gas used: {}".format(tx_receipt['gasUsed']))