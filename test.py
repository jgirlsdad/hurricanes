import pandas as pd 
import csv
import pymongo
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
#app = Flask(__name__)
#cors = CORS(app)

client = pymongo.MongoClient("mongodb+srv://jgirlsdad:444jayla@cluster0-dgjk9.mongodb.net/test?retryWrites=true&w=majority")
mydb = client.hurricanes
mycol = mydb["tracks"]

print ("finished connecting to MDB")
years = ['none']

#years = sorted(mycol.distinct("year"))
print (years)
def getData(years,flag):
    if (len(years) > 1):
        start = years[0]
        end   = years[1]
        if (flag == 0):  # get date range
          mydoc = mycol.find({'year': { '$gte': start, '$lte': end }},{'year':1,'name':1,'maxStrength':1,'month':1,'minPressure':1,'maxWind':1,})
        else:  # get all years >= first year in array
          mydoc = mycol.find({'year': { '$gte': start}},{'year':1,'name':1,'maxStrength':1,'month':1,'minPressure':1,'maxWind':1,})

    else:
        start = years[0]
        myquery = {"year":start}
        mydoc = mycol.find(myquery)
    #mydoc = mycol.find()
    storms = []
    for x in mydoc:
        storm = {}
        storm['name'] = x['name'].strip()
        storm['year'] = x['year']
        storm['maxWind'] = x['maxWind']
        storm['minPressure'] = x['minPressure']
        storm['maxStrength'] = x['maxStrength']
        storm['month'] = x['month']
        tracks = []
        if 'tracks' in x:
            for date,info in x['tracks'].items():            
                obs = []
                obs.append(info['lat'])
                obs.append(info['lon'])
                obs.append(info['type'])
                obs.append(info['wind'])
                obs.append(info['pressure'])
                obs.append(info['strength'])
                tracks.append(obs)
            storm['track'] = tracks
        storms.append(storm)
    return storms

#@app.route("/getYear/<year>")
def getYear(year):
    print ("year",year)
    storms = getData([int(year)],0)
    return jsonify(storms)

#@app.route("/info")
def getInfo(start,end):
    storms = getData([start,end],1)
    stats = {}
    stats['annual'] = {}
    stats['annual']['count'] = 0
    stats['annual']['HU'] = 0
    stats['annual'][0] = 0
    stats['annual'][1] = 0
    stats['annual'][2] = 0
    stats['annual'][3] = 0
    stats['annual'][4] = 0
    stats['annual'][5] = 0
    stats['annual']['meanWind'] = 0
    for storm in storms:
        stats['annual']['count'] +=1
        stats['annual'][storm['maxStrength']]+=1
        if (storm['maxStrength'] > 0):  # count hurricanes
               stats['annual']['HU'] +=1
               stats['annual']['meanWind']+=storm['maxWind']
 
        if storm['year'] in stats:
             stats[storm['year']]['count'] +=1
             if (storm['maxStrength'] > 0):  # count hurricanes
               stats[storm['year']]['HU'] +=1
               stats[storm['year']]['meanWind']+=storm['maxWind']
 
             stats[storm['year']][storm['maxStrength']]+=1
             if (storm['maxWind'] > stats[storm['year']]['maxWind']):
                 stats[storm['year']]['maxWind'] = storm['maxWind']
             if (storm['minPressure'] < stats[storm['year']]['minPressure']):
                 stats[storm['year']]['minPressure'] = storm['minPressure']
        else:
            stats[storm['year']] = {}
            stats[storm['year']]['count'] = 1
            stats[storm['year']]['HU'] = 0
            stats[storm['year']][0] = 0
            stats[storm['year']][1] = 0
            stats[storm['year']][2] = 0
            stats[storm['year']][3] = 0
            stats[storm['year']][4] = 0
            stats[storm['year']][5] = 0
            stats[storm['year']][storm['maxStrength']] = 1
            stats[storm['year']]['meanWind'] = 0
            stats[storm['year']]['maxWind'] = storm['maxWind']
            stats[storm['year']]['minPressure'] = storm['minPressure']
            if (storm['maxStrength'] > 0):  # count hurricanes
               stats[storm['year']]['HU'] +=1
               stats[storm['year']]['meanWind']+=storm['maxWind']
               
            print (storm['year'])
    for year in stats:
        print (year,stats[year]['count'])
        if (stats[year]['HU'] > 0):
            stats[year]['meanWind']/=stats[year]['HU']  
            for key in stats[year]:
                print ("    ",key,stats[year][key])  
    return stats



#@app.route("/")
def home():
   
      return render_template("index.html")



#@app.route('/result',methods = ['POST', 'GET'])
def result():
    hit=0
    if request.method == 'POST':
 #      result = request.form
       query_string = ""
       
data = getInfo(1980,2017)

#if __name__ == "__main__":
#    app.run(debug=True)