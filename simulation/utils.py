import time
import csv

ACCOUNT_INDENT = 4


def wait_for_tx(tx_hash, web3, delay=5, wait_message=None):
    while True:
        try:
            reciept = web3.eth.getTransactionReceipt(tx_hash)
            if reciept == None: raise Exception()
            break
        except:
            if wait_message:
                print(wait_message)
            time.sleep(delay)
            continue
    return reciept


CSV_ROWS = {'holder': 1,
            'controller': 2,
            'token_holder':3,
            'token': 4,
            'private_offer': 5,
            'presale': 6,
            'crowdsale': 7,
            'last_row': 'last_row'}


def get_csv_file_row(file, row_index):
    spamreader = csv.reader(file, quoting=csv.QUOTE_MINIMAL)
    if row_index == 'last_row':
        row = None
        for row in spamreader: pass
        return row

    for i in range(row_index):
        next(spamreader)

    return next(spamreader)
