from invoke import task



@task
def run(ctx):
    ctx.run('uwsgi --socket 0.0.0.0:8181 --protocol=http -w endpoints:app')
