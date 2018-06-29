import hashlib as hl
import pandas as pd
import DateTime as dt
import numpy as np
import itertools

#Sql imports
from sqlalchemy import create_engine, Table, Column, Integer, String, Float, Date, MetaData, ForeignKey
from sqlalchemy.sql import select


#TODO could combine some select/apply combos with grouping funcitons

class Thing(object):
    #'Test class

    def __init__(self):
        self.engine = create_engine('sqlite:///thing4.db')
        self.engine.echo = True
        self.metadata = MetaData(self.engine)

        self.userTable = Table('userTable', self.metadata,
                      Column('traderInd', Integer, primary_key=True),
                      Column('traderId', String(40)),
                      Column('hashedPassword', String(40)),
                      Column('apiKey', String(40)),
                      )

        self.metadata.create_all(self.engine)
        self.conn = self.engine.connect()

    def createUser(self, traderId, password):
        hashedPassword = hl.md5(password.encode('utf-8')).hexdigest()
        apiKey = hl.md5(hashedPassword.encode('utf-8')).hexdigest()
        userTable = pd.read_sql_table('userTable', self.conn)
        if any(userTable.traderId == traderId):
            print('Username already exists, sorry buddy.')
        else:
            newUsr = {'traderId': traderId, 'hashedPassword': hashedPassword, 'apiKey': apiKey}
            self.userTable.insert().execute(newUsr)


t = Thing()
t.createUser('haresh', 'hareshpass')
tmp = pd.read_sql_table('userTable', t.conn)
print(tmp)

