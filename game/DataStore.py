#

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, Table, Column, Integer, Boolean, String, Float, \
    VARCHAR, JSON, LargeBinary, BLOB, TIMESTAMP, MetaData, update, ForeignKey
from sqlalchemy.pool import NullPool
import os, platform
import datetime


class DStore:
    # Datastore for test agecon environment
    def __init__(self, sqlfilename = []):

        if sqlfilename == []:
            DATABASE_URL = 'sqlite:///agecondata.db'
        else:
            DATABASE_URL = 'sqlite:///' + sqlfilename + '.db'

        self.engine = create_engine(DATABASE_URL, poolclass=NullPool)
        self.engine.echo = False
        self.metadata = MetaData(self.engine)
        # State
        self.store = Table('store', self.metadata,
                               Column('object', VARCHAR),
                               Column('id', Integer),
                               Column('utc', Float),
                               Column('msg', VARCHAR),
                               Column('state', JSON)
        )


        # Create all tables
        self.metadata.create_all(self.engine)
        self.conn = self.engine.connect()

    def purge(self):
        """ Purge state """
        self.store.delete().execute()
        print("Store table deleted.")
