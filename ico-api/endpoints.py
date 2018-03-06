from flask import Flask, jsonify, request, abort, session
from web3 import Web3
from solc import compile_files
import csv
from uuid import uuid4
from math import ceil
import sys

sys.path.insert(0, '../simulation')
sys.path.insert(0, '../ico-api')

from utils import wait_for_tx, get_csv_file_row, CSV_ROWS

web3 = Web3(Web3.HTTPProvider('http://simulation_ganache_server_1:8545'))

app = Flask(__name__)

app.secret_key = uuid4().bytes

admins = {}

MAX_ADDRESSES_IN_TX = 125


def login_and_form_required(fn):
    def wrapper():
        print(request.files)
        username = session.get('username')
        token = session.get('login_token')
        if (not username or not token or admins[username][1] != token
           or not request.form):
            abort(404)
        return fn()
    wrapper.__name__ = fn.__name__
    return wrapper


def get_addresses(request):
    data = list(dict(request.form).keys())[0]
    if '\r' in data:
        addresses = data.split('\r\n')
    else:
        addresses = data.split('\n')
    if not addresses[-1]:
        addresses = addresses[:-1]
    return addresses


with open('api_admins.csv', 'r') as api_admins_file:
    reader = csv.reader(api_admins_file, quoting=csv.QUOTE_MINIMAL)
    for row in reader:
        admins[row[0]] = [row[1], None]

tx = {'from': web3.eth.accounts[0]}

with open('../simulation/deploy_info.csv', 'r') as deploy_info:
    controller_address = get_csv_file_row(
        deploy_info,
        CSV_ROWS['controller']
        )[1]
    token_address = get_csv_file_row(deploy_info, 0)[1]

compiled_source = compile_files(["../contracts/ICO_controller.sol"])
controller_interface = compiled_source[
    '../contracts/ICO_controller.sol:ICO_controller'
    ]
stage_interface = compiled_source[
    '../contracts/ICO_crowdsale.sol:WhitelistedCrowdsale'
    ]
token_interface = compiled_source[
    '../contracts/MFC_coin.sol:MFC_Token'
    ]

controller_contract = web3.eth.contract(
    abi=controller_interface['abi'],
    bytecode=controller_interface['bin']
    )
controller_instance = controller_contract(controller_address)

token_contract = web3.eth.contract(
    abi=token_interface['abi'],
    bytecode=token_interface['bin'])
token_instance = token_contract(token_address)

stage_contract = web3.eth.contract(
    abi=stage_interface['abi'],
    bytecode=stage_interface['bin']
    )


def get_stage(address):
    return stage_contract(address)


def add_addresses(method_name):
    addresses = get_addresses(request)
    for i in range(ceil(len(addresses)/MAX_ADDRESSES_IN_TX)):
        method = getattr(controller_instance.functions, method_name)
        tx_hash = method(
            addresses[MAX_ADDRESSES_IN_TX*i:MAX_ADDRESSES_IN_TX*(i+1)]
        ).transact(tx)
        tx_receipt = wait_for_tx(tx_hash, web3)
        if tx_receipt['status'] != 1:
            return jsonify({'success': False})
    return jsonify({'success': True})


@app.route('/api/v1/stage_info/', methods=['GET'])
def stage_info():
    private_offer_address = controller_instance.functions.privateOffer(
        ).call(tx)
    maxSold = 27200
    weiRaised = 0
    currentSold = 0
    last_stage_name = None
    stage_end_time = None
    stage = None
    if int(private_offer_address, 16):
        stage = get_stage(private_offer_address)
        weiRaised += stage.functions.weiRaised().call(tx)
        presale_address = controller_instance.functions.preSale().call(tx)
        if int(presale_address, 16):
            stage = get_stage(presale_address)
            weiRaised += stage.functions.weiRaised().call(tx)
            crowdsale_address = controller_instance.functions.crowdsale(
                ).call(tx)
            if int(crowdsale_address, 16):
                stage = get_stage(crowdsale_address)
                weiRaised += stage.functions.weiRaised().call(tx)
                last_stage_name = 'Crowdsale'
            else:
                last_stage_name = 'Presale'
        else:
            last_stage_name = 'Private Offer'
    if stage and not stage.functions.hasEnded().call(tx):
        stage_end_time = stage.functions.endTime().call(tx)
    if weiRaised:
        currentSold = weiRaised/10 ** 18
    return jsonify({
        'stage_name': last_stage_name,
        'stage_end_time': stage_end_time,
        'max_sold': maxSold,
        'current_sold': currentSold
        })


@app.route('/api/v1/wallet_info/', methods=['GET'])
def wallet_info():
    wallet_address = request.args.get('address')
    if not wallet_address:
        abort(404)
    return jsonify({
        'token_balance': token_instance.functions.balanceOf(
            wallet_address
            ).call(tx),
        'balance': web3.eth.getBalance(wallet_address),
        'whitelisted': controller_instance.functions.isAddressWhitelisted(
            wallet_address
            ).call(tx)
        })


@app.route('/api/v1/login/', methods=['POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username and admins[username][0] == password:
            token = uuid4().bytes
            session['username'] = username
            session['login_token'] = token
            admins[username][1] = token
            return jsonify({'success': True})
    abort(404)


@app.route('/api/v1/logout/', methods=['GET'])
def logout():
    session.pop('login_token', None)
    username = session.pop('username', None)
    admins[username][1] = None
    return jsonify({'success': True})


@app.route('/api/v1/add_buyers/', methods=['POST'])
@login_and_form_required
def add_buyers():
    return add_addresses('addBuyers')


@app.route('/api/v1/add_airdropers/', methods=['POST'])
@login_and_form_required
def add_airdropers():
    return add_addresses('addAirdrop')


if __name__ == "__main__":
    app.run()