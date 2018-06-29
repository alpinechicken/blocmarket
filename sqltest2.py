from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, ForeignKey
from sqlalchemy.sql import select
import pandas as pd

# in memory sql
engine = create_engine('sqlite:///:memory:', echo=True)

#Connect to external mysql database via pymysql
#engine_external = create_engine('mysql+pymysql://sql6136147:Nme3WVHrQ7@sql6.freesqldatabase.com/sql6136147')

conn = engine.connect()
#conn_external = engine_external.connect()

metadata = MetaData()

#Create some tables
users = Table('users', metadata, Column('id', Integer, primary_key = True), Column('name', String), Column('fullname', String))

addresses = Table('addresses', metadata,
   Column('id', Integer, primary_key=True),
   Column('user_id', None, ForeignKey('users.id')),
   Column('email_address', String, nullable=False)
)

metadata.create_all(engine)

#Create insert
ins = users.insert()
#Insert row
conn.execute(ins, id=2, name= 'wendy', fullname = 'Wendy Williamson')

#Create insert into external mysql db
ins = sqlalchemy.sql.expression.insert()

#Multiple insert
conn.execute(addresses.insert(), [
    {'user_id': 1, 'email_address' : 'jack@yahoo.com'},
    {'user_id': 1, 'email_address' : 'jack@msn.com'},
    {'user_id': 2, 'email_address' : 'www@www.org'},
    {'user_id': 2, 'email_address' : 'wendy@aol.com'},
 ])

#Select table
s = select([users])

result = conn.execute(s)

#Select parts of table
s = select([users.c.name, users.c.fullname])

#Import table as pandas dataframe (MOST USEFUL) ... can also give query
tmp = pd.read_sql_table('users', conn)

#Import sql query as pandas dataframe
tmp2 = pd.read_sql_query('select * from addresses where user_id = 1', conn)

#Create a local dataframe
df1 = pd.DataFrame(data={'traderId': ['haresh'], 'hashedPassword': ['abc'], 'apiKey': ['32a']})
df2 = pd.DataFrame(data={'traderId': ['zwif'], 'hashedPassword': ['def'], 'apiKey': ['z2a']})

#Push dataframe to sql as table 'df1'
df1.to_sql('df1', conn)
#Read back from sql
df1_copy = pd.read_sql_table('df1', conn)

#Import table from external db
pd.read_sql_table('matchedTrades', conn_external)

#Push data frame to sql as 'df1' (external)
df1.to_sql('df1', conn_external)
#Apppend df2 to table df1
df2.to_sql('df1', conn_external, if_exists='append')


#Test
#url = 'https://raw.github.com/pydata/pandas/master/pandas/tests/data/tips.csv'