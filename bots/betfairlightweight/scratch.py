from . import betfairlightweight

app_key = 'iw8UsiHCP1GSs213'
trading = betfairlightweight.APIClient('alpinechicken', 'ee', app_key=app_key)

trading.login_interactive()

trading.betting.cancel_orders(instructions={'betId': '179426859485', 'sizeReduction': 'null'}]

a=1

