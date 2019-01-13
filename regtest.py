import re

def Main():
    line = "I think I understand regular expressions"
    
    matchResult = re.match('think', line, re.M|re.I)
    if matchResult:
        print("Match Found: " +mathResult.group())
    else:
        print("No match was found")
        
    searchResult = re.search('think', line, re.M|re.I)
    if searchResult:
        print("Search Found:" +searchResult.group())
    else:
        print("Nothing found in search")
        

        


        