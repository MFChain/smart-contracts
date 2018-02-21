from invoke import task



@task
def run(ctx):
    ctx.run('geth --datadir "blchain" init blchain/genesis.json')
    ctx.run('geth --datadir "blchain" --rpc --nodiscover --mine --minerthreads=1 --rpccorsdomain "*" --rpcapi "db,eth,net,web3,personal" --networkid 12')
