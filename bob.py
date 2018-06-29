from sqlalchemy import *
from sqlalchemy.orm import mapper, sessionmaker
import os
import pandas as pd


engine = create_engine('sqlite:///bobloblaw_.db', echo=True)
metadata = MetaData(engine)

sample = Table(
    'sample', metadata,
    Column('id', Integer, primary_key=True),
    Column('lob', LargeBinary),
    Column('law', String),
)


metadata.create_all(engine)

conn = engine.connect()

# Creating new object
blob = os.urandom(10)

tmpRow = {'id':15, 'lob': blob, 'law': 'law'}

t = pd.DataFrame(tmpRow, index=[0])

t.to_sql(name='sample',  con=conn, if_exists="append", index=False)


conn.execute(sample.insert(), [t, ])

conn.execute(sample.insert().values(tmpRow2))

