from sqlalchemy import create_engine, Table, Column, Integer, String, Float, Date, MetaData, ForeignKey, update
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import select
import pandas as pd
import numpy as np


class dbtestobj(object):
    #'Market object class'

    def __init__(self):
        self.engine = create_engine('sqlite:///:memory:', echo=True)
        self.engine.echo = False
        self.metadata = MetaData(self.engine)
        #Create session bound to engine
        Session = sessionmaker(bind=self.engine)
        self.session = Session()

        # Declare table
        self.userTable = Table('userTable', self.metadata,
                               Column('traderInd', Integer, primary_key=True),
                               Column('traderId', String(40)),
                               Column('hashedPassword', String(40)),
                               Column('apiKey', String(40)),
                               )


        self.openMarketData = Table('openMarketData', self.metadata,
                      Column('marketId', Integer, primary_key=True),
                      Column('marketMin', Float),
                      Column('marketMax', Float),
                      Column('expiry', String),
                      Column('outcome', Float),
                      Column('underlying', String),
                      Column('traderId', String),
                        )
        self.metadata.create_all(self.engine)
        self.conn = self.engine.connect()


dbobj = dbtestobj()

# Basic insert

traderId = 'haresh'
hashedPassword = 'hp'
apiKey = '123'

newUsr = {'traderInd': int(1), 'traderId': traderId, 'hashedPassword': hashedPassword, 'apiKey': apiKey}

dbobj.conn.execute(dbobj.userTable.insert(), [newUsr,])

 # Basic read
obTmp = pd.read_sql_query("SELECT * FROM userTable WHERE traderInd = %d" % (1), dbobj.conn)

print(obTmp)

# Basic update

update(dbobj.userTable).where(dbobj.userTable.c.traderId == 'haresh').values(traderId='zwif').execute()


# Update market outcome (wan't working in main class)

newMarket = {'marketId': 1, 'marketMin': 0, 'marketMax': 1, 'expiry': '2017-01-01',
             'outcome': np.nan, 'underlying': 'broncos', 'traderId': 'haresh'}

dbobj.conn.execute(dbobj.openMarketData.insert(), [newMarket, ])


marketId = 1
outcome = 1
update(dbobj.openMarketData).where(dbobj.openMarketData.c.marketId == marketId).values(outcome=outcome).execute()

omdTmp = pd.read_sql_table ('openMarketData', dbobj.conn)

print(omdTmp)




# Basic delete

dbobj.userTable.delete(dbobj.userTable.c.traderId == 'zwiffer').execute()


obTmp = pd.read_sql_query("SELECT * FROM userTable WHERE traderInd = %d" % (1), dbobj.conn)


print(obTmp)


# self.conn.execute(self.matchedTrades.insert(), [newLongTrade, newShortTrade ])

