from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String
from sqlalchemy import create_engine

engine = create_engine('sqlite:///account_data.db', echo=False)
Base = declarative_base()


def get_or_create(session, model, **kwargs):
    instance = session.query(model).filter_by(**kwargs).first()
    if instance:
        return instance
    else:
        instance = model(**kwargs)
        session.add(instance)
        session.commit()
        return instance


class Account(Base):
    __tablename__ = 'accounts'

    id = Column(Integer, primary_key=True)
    address = Column(String, unique=True)
    balance = Column(String, default='0')


Base.metadata.create_all(engine)

if __name__ == "__main__":
    pass