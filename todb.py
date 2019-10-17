import pandas as pd 
import csv
import sqlite3
import sqlalchemy as db
import pymongo
#conn = sqlite3.connect('hurricanes.db')
#c = conn.cursor()
def hurricaneCat(ws):
    if ws < 74:
        return 0
    elif ws >= 74 and ws <= 95:
        return 1
    elif ws > 95 and ws <= 110:
        return 2   
    elif ws >= 110 and ws <= 129:
        return 3
    elif ws >= 129 and ws <= 156:
        return 4
    else:
        return 5    

client = pymongo.MongoClient("mongodb+srv://jgirlsdad:444jayla@cluster0-dgjk9.mongodb.net/test?retryWrites=true&w=majority")
mydb = client.hurricanes
mycol = mydb["tracks"]


#c.execute('''CREATE TABLE tracks
#             (name text, date text, type text, lat real, lon real, wind real, pressure real)''')

stormNumber=0
with open("hurdat2-1851-2018-051019.txt") as csvfile:
    reader = csv.reader(csvfile)
    Hurricane = ""
    hold = []
    currentYear = 1851
    year = currentYear
    for row in reader:
        temp = []

        if (row[0][0:2] == "AL"):
            
            if (Hurricane == "Y"):
                maxStrength = 0
                record = {}
                record['name'] = hold[0][0]
                record['maxWind'] = 0
                record['minPressure'] = 99999
                record['year'] = int(hold[0][1][0:4])
                record['month'] = int(hold[0][1][4:6])
                record['maxStrength'] = 0
                record['tracks'] = {}
                d2 = {}
                for arr in hold:
                 
                  d = {}
                  d['lat'] = arr[3]
                  d['lon'] = arr[4]
                  d['wind'] = arr[5]
                  d['pressure'] = arr[6]
                  d['type'] = arr[2]
                  d['strength'] = hurricaneCat(int(arr[5]))
                  if d['strength'] > record['maxStrength']:  record['maxStrength']=d['strength']
                  if d['pressure'] < record['minPressure']:  record['minPressure']=d['pressure']
                  if d['wind'] > record['maxWind']: record['maxWind']=d['wind']
                  d2[arr[1]] = d
                
                record['tracks'] = d2
              #  print (record)
                if year !=  currentYear:
                    stormNumber=0
                print(year,currentYear,name,stormNumber)
                stormNumber=stormNumber+1
                if (name == "UNNAMED"):
                    name = name + str(stormNumber)
               
               

                record['name'] = name
                xx = mycol.insert_one(record)
            hold = []
            currentYear = year
            Hurricane = "N"
            name = row[1].strip()
            nrec=1

        else:
            
            year = int(row[0][0:4])
           
               
            temp.append(name)
           
            
            date = str(row[0]) + str(row[1]).lstrip (" ")
    
            temp.append(date)
            temp[2:] = row[3:8]
            temp[3] = float(temp[3][0:-1])
            if (temp[4][-1] == "W"): 
                scale=-1
            else:
                scale=1
            temp[4] = float(temp[4][0:-1]) * scale
            
            temp[5] = float(temp[5]) * 1.15
            temp[5] = int(temp[5])
            
            temp[6] = float(temp[6])
            if ("HU" in temp[2] or "TS" in temp[2]):  Hurricane="Y"
            hold.append(temp)


