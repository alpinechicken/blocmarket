{\rtf1\ansi\ansicpg1252\cocoartf1671\cocoasubrtf100
{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww10800\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 ---\
title: API Reference\
\
language_tabs: # must be one of https://git.io/vQNgJ\
  - shell\
  - ruby\
  - python\
  - javascript\
\
toc_footers:\
  - <a href='#'>Sign Up for a Developer Key</a>\
  - <a href='https://github.com/lord/slate'>Documentation Powered by Slate</a>\
\
includes:\
  - errors\
\
search: true\
---\
\
# Introduction\
\
Welcome to the Bloc API! You can use our API to access Bloc API endpoints, which will improve your life and maybe save the universe.\
\
We have language bindings in Shell, Python, and Matlab! You can view code examples in the dark area to the right, and you can switch the programming language of the examples with the tabs in the top right.\
\
A version of the server is running on [blocmarket](https://blocmarket.heroku.com/). Feel free to go break things there.\
\
# Authentication\
\
\
Authentication is handled through signatures on markets and trades. The server will only accept correctly signed markets and orders using a registered verify key. There is no need to authenticate.\
\
<aside class="notice">\
Signatures are obtained through the <code>createUser</code> endpoint.\
</aside>\
\
# Creators\
\
## Create user\
\
\
```python\
import requests\
import json\
url = 'https://blocmarket.herokuapp.com/createUser'\
headers = \{'content-type': 'application/json'\}\
content = \{\}\
response = requests.post(url, data=json.dumps(content), headers=headers)\
\
```\
\
```shell\
curl --header "Content-Type: application/json" -X POST http://blocmarket.herokuapp.com/createUser\
\
```\
\
\
> The above command returns JSON structured like this:\
\
```json\
\
  \{'signingKey_hex': 'ece2efc138c8298d43caba1315ceda614e20644c74d46fed37871c47ea19afdf',\
 'traderId': '1',\
 'verifyKey_hex': '9690a2e12971ae452d68bf3d08405090d45791533cf80740fd186aea4b6773fc'\}\
\
```\
\
This endpoint creates a new user and registers the `verifyKey_hex` with the server.\
\
### HTTP Request\
\
`GET https://blocmarket.herokuapp.com/createUser`\
\
### Query Parameters\
\
Parameter | Default | Description\
--------- | ------- | -----------\
None | none | none\
\
\
<aside class="success">\
The verify key is registered with the server so messages can be verified as belonging to that trader. The signing key is not stored.\
</aside>\
\
<aside class="warning">\
The signing key is not stored on the server. If you lose it you are screwed.\
</aside>\
\
## Create market\
\
> Create a new market change bounds on an existing market:\
\
```python\
\
import requests\
import json\
sk = 'ece2efc138c8298d43caba1315ceda614e20644c74d46fed37871c47ea19afdf'\
vk = '9690a2e12971ae452d68bf3d08405090d45791533cf80740fd186aea4b6773fc'\
tId = 2\
\
url = 'https://blocmarket.herokuapp.com/createMarket'\
headers = \{'content-type': 'application/json'\}\
content_makemarket = \{"signingKey": sk,\
                    "traderId": tId, \
                    "verifyKey": vk,\
                    "marketRootId": 1, \
                    "marketBranchId": 1, \
                    "marketMin": 0,\
                    "marketMax":1\}\
response = requests.post(url, data=json.dumps(content), headers=headers)\
\
```\
\
```shell\
curl --data '\{"signingKey": "ece2efc138c8298d43caba1315ceda614e20644c74d46fed37871c47ea19afdf",\
"traderId": 1, \
"verifyKey": "9690a2e12971ae452d68bf3d08405090d45791533cf80740fd186aea4b6773fc",\
"marketRootId": 1, \
"marketBranchId": 5, \
"marketMin": 0, \
"marketMax": 1\}' \
--header "Content-Type: application/json" -X POST http://blocmarket.herokuapp.com/createMarket\
\
\
```\
\
\
> The above command returns JSON structured like this:\
\
```json\
\
\{'allChecks': \
     "\{'marketId': '1', 'marketRangeChk': True,\
     'sigChk': True, 'chainChk': True, \
     'ownerChk': True, 'timeChk': True\}",\
 'checks': 'False',\
 'marketBranchId': 1,\
 'marketId': 1,\
 'marketMax': 0,\
 'marketMin': 1,\
 'marketRootId': 1,\
 'traderId': 2\}\
\
```\
\
If the market exists, this will update the maximum/minimum within the bounds of the existing range.\
\
\
### HTTP Request\
\
`GET https://blocmarket.herokuapp.com/createMarket`\
\
### Query Parameters\
\
Parameter | Default | Description\
--------- | ------- | -----------\
`signingKey` | none | Private signature key\
`verifyKey` | none | Pubic signature key\
`traderId` | none | Trader Id\
`marketRootId` | none | Market root Id\
`marketBranchId` | none | Market branch Id\
`marketMin` | none | Minimum settlement value\
`marketMax` | none | Maximum settlement value\
\
\
## Create trade\
\
> Create a new trade (open order)\
\
```python\
sk = '0cca0a3739eba76cc78823d9f6e898379014d8c53172f5e45c171a3c54a9f477'\
vk = 'cdcfb59431b2579a681cee65656cbed6f8d578d5cc30d3e759e86c1d3e3529ef'\
tId = 2\
\
url = 'https://blocmarket.herokuapp.com/createTrade'\
headers = \{'content-type': 'application/json'\}\
content_maketrade = \{"signingKey": sk,\
                     "traderId": int(tId),\
                     "verifyKey": vk,\
                     "marketId": mkId,\
                     "price": 0.55,\
                     "quantity":1\}\
response = requests.post(url, data=json.dumps(content_maketrade), headers=headers)\
```\
\
```shell\
curl --data '\{"signingKey": "ece2efc138c8298d43caba1315ceda614e20644c74d46fed37871c47ea19afdf",\
"traderId": 1, \
"verifyKey": "9690a2e12971ae452d68bf3d08405090d45791533cf80740fd186aea4b6773fc",\
"marketRootId": 1, \
"marketBranchId": 5, \
"marketMin": 0, \
"marketMax": 1\}' \
--header "Content-Type: application/json" -X POST http://blocmarket.herokuapp.com/createMarket\
\
\
```\
\
\
> The above command returns JSON structured like this:\
\
```json\
\
\{'allChecks': "\{'marketChk': True, 'sigChk': True, 'chainChk': True, 'timeChk': True, 'colChk': True\}",\
 'checks': 'True',\
 'marketId': 1,\
 'price': 0.55,\
 'quantity': 1,\
 'traderId': 1\}\
\
```\
\
Signed trade is added the signature is valid\
\
\
\
### HTTP Request\
\
`GET https://blocmarket.herokuapp.com/createTrade`\
\
### Query Parameters\
\
Parameter | Default | Description\
--------- | ------- | -----------\
`signingKey_hex` | none | Private signature key\
`verifyKey_hex` | none | Pubic signature key\
`traderId` | none | Trader Id\
`marketId` | none | Market Id\
`price` | none | price\
`quantity` | none | quantity\
\
\
<aside class="success">\
The verify key is registered with the server so messages can be verified as belonging to that trader. The signing key is not stored.\
</aside>\
\
\
\
}
