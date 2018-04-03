from invoke import task



@task
def run(ctx):
    ctx.run('yes | geth --datadir blchain removedb')
    ctx.run('geth --datadir blchain init blchain/genesis.json')
    ctx.run('geth --datadir blchain --rpc --nodiscover --mine --minerthreads=1 --rpcaddr "127.0.0.1" --rpccorsdomain "*" --rpcapi "db,eth,net,web3,personal" --networkid 12')

@task
def run_rinkeby(ctx):
    ctx.run('geth --syncmode "light" --cache 512 --datadir "blchain_rinkeby" --rpcaddr "127.0.0.1" --rpc --rpccorsdomain "*" --rpcapi "db,eth,net,web3,personal" --rinkeby')

@task
def run_mainnet(ctx):
    ctx.run('geth --syncmode "light" --cache 512 --datadir "blchain_mainnet" --rpcaddr "127.0.0.1" --rpc --rpccorsdomain "*" --rpcapi "db,eth,net,web3,personal"')
