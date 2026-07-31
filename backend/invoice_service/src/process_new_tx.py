import sys
import time
import pika
import asyncio
import pymysql

db_config = {
    "host": "db_invoice",
    "user": "root",
    "password": "kkfkffspassss",
    "db": "invoices_db",
    "autocommit": True
}

from nerva.wallet_rpc import WalletRPC

QUEUE_NAME = 'tx_notifications'

def atomicUnitsToDecimal(atomic_units:int):
    return float(atomic_units) / 1000000000000.0

def push_to_rabbit_mq(message:str):
    connection_params = pika.ConnectionParameters(host='rabbitmq', port=5672, credentials=pika.PlainCredentials('user', 'passwordkkjhgq')) # for docker
    connection = pika.BlockingConnection(connection_params)
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME)

    channel.basic_publish(exchange='', routing_key=QUEUE_NAME, body=message)

async def verify_tx(tx_id:str):
    # todo: it's not sustainable to search through the whole tx history each time - figure out how to query the wallet server by txid
    wallet = WalletRPC(host="127.0.0.1", port=28082) # localhost because this runs on the same host as the rpc server
    address_count = len((await wallet.get_address(account_index=0))['result']['addresses'])
    all_txs = await wallet.incoming_transfers(transfer_type="all", account_index=0, subaddr_indices=list(range(address_count)), verbose=True)
    print("all_txs", all_txs)
    txs_found = []
    for tx in all_txs['result']['transfers']:
        if tx['tx_hash'] == tx_id:
            txs_found.append((tx))

    if len(txs_found) == 1:
        recipient_address = (await wallet.get_address(account_index=0))['result']['addresses'][txs_found[0]['subaddr_index']['minor']]['address'] # this is a strange api...
        with pymysql.connect(**db_config) as sql_client:
            with sql_client.cursor(pymysql.cursors.DictCursor) as cur:
                cur.execute("SELECT * FROM invoices WHERE address = %s", (recipient_address))
                tx_invoice_rows = cur.fetchall()
                if not tx_invoice_rows:
                    return None, None, None
                if atomicUnitsToDecimal(int(txs_found[0]['amount'])) >= tx_invoice_rows[0]['amount']:
                    cur.execute("UPDATE invoices SET status='confirmed' WHERE address = %s", (recipient_address))
                    cur.execute("SELECT invoice_id FROM invoices WHERE address=%s", (recipient_address))
                    invoice_id = cur.fetchone()["invoice_id"]
                    return atomicUnitsToDecimal(int(txs_found[0]['amount'])), 1, invoice_id
                else:
                    print(f'tx amount {txs_found[0]["amount"]} < invoice amount {tx_invoice_rows[0]["amount"]}')
    return None, None, None

async def main():
    await asyncio.sleep(2)
    tx_id = sys.argv[1]
    print("process_new_tx", tx_id)
    tx_amount, confirmations, invoice_id = await verify_tx(tx_id)
    confirmations = confirmations if confirmations else 0
    if tx_amount:
        push_to_rabbit_mq(f'{tx_id},{tx_amount},{confirmations},{invoice_id}')
        print(f"Sent '{tx_id},{tx_amount},{confirmations},{invoice_id}'")

if __name__ == "__main__":
    asyncio.run(main())