import pandas as pd 
import csv
import pymongo
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
app = Flask(__name__)
cors = CORS(app)


client = pymongo.MongoClient("mongodb+srv://jgirlsdad:444jayla@cluster0-dgjk9.mongodb.net/test?retryWrites=true&w=majority")
mydb = client.hurricanes
mycol = mydb["tracks"]

print ("finished connecting to MDB")
years = ['none']
retired = {}
with open("static/csv/retiredstorms2.csv") as fin:
    reader = csv.reader(fin)
    for row in reader:
        retired[row[0]] = row[1]
    print (retired)
#years = sorted(mycol.distinct("year"))
#print (years)


def getStorm(name):    
    year = retired[name]
    name=name.upper()
    myquery = {'name': name,'year':int(year)}
    print(myquery)
    mydoc = mycol.find(myquery)
    print ("getting storm info for ",name,year)
    print (mydoc)
    
    for x in mydoc:
        storm = {}
        storm['name'] = x['name'].strip()
        storm['year'] = x['year']
        storm['maxWind'] = x['maxWind']
        storm['minPressure'] = x['minPressure']
        storm['maxStrength'] = x['maxStrength']
        storm['month'] = x['month']
        tracks = []
        print ("STRORM ",storm)
        if 'tracks' in x:
            for date,info in x['tracks'].items():            
                obs = []
                obs.append(info['lat'])
                obs.append(info['lon'])
                obs.append(info['type'])
                obs.append(info['wind'])
                obs.append(info['pressure'])
                obs.append(info['strength'])
                obs.append(date)
                tracks.append(obs)
            storm['track'] = tracks
    storms=[]
    storms.append(storm)
    return storms



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
                obs.append(date)
                tracks.append(obs)
            storm['track'] = tracks
        storms.append(storm)
    return storms






def getStats():
    print ("getting stats")
    start=1851
    end=2018
    storms = getData([start,end],1)
    stats = {}
    stats[99] = {}
    stats[99]['count'] = 0
    stats[99]['HU'] = 0
    stats[99]['0'] = 0
    stats[99]['1'] = 0
    stats[99]['2'] = 0
    stats[99]['3'] = 0
    stats[99]['4'] = 0
    stats[99]['5'] = 0
    stats[99]['meanWind'] = 0
    for storm in storms:
        stats[99]['count'] +=1
        stats[99][str(storm['maxStrength'])]+=1
        if (storm['maxStrength'] > 0):  # count hurricanes
               stats[99]['HU'] +=1
               stats[99]['meanWind']+=storm['maxWind']
 
        if storm['year'] in stats:
             stats[storm['year']]['count'] +=1
             if (storm['maxStrength'] > 0):  # count hurricanes
               stats[storm['year']]['HU'] +=1
               stats[storm['year']]['meanWind']+=storm['maxWind']
 
             stats[storm['year']][str(storm['maxStrength'])]+=1
             if (storm['maxWind'] > stats[storm['year']]['maxWind']):
                 stats[storm['year']]['maxWind'] = storm['maxWind']
             if (storm['minPressure'] > 0 and  storm['minPressure'] < stats[storm['year']]['minPressure']):
                 stats[storm['year']]['minPressure'] = storm['minPressure']
        else:
            stats[storm['year']] = {}
            stats[storm['year']]['count'] = 1
            stats[storm['year']]['HU'] = 0
            stats[storm['year']]['0'] = 0
            stats[storm['year']]['1'] = 0
            stats[storm['year']]['2'] = 0
            stats[storm['year']]['3'] = 0
            stats[storm['year']]['4'] = 0
            stats[storm['year']]['5'] = 0
            stats[storm['year']][str(storm['maxStrength'])] = 1
            stats[storm['year']]['meanWind'] = 0
            stats[storm['year']]['maxWind'] = storm['maxWind']
            stats[storm['year']]['minPressure'] = 9999
            if (storm['maxStrength'] > 0):  # count hurricanes
               stats[storm['year']]['HU'] +=1
               stats[storm['year']]['meanWind']+=storm['maxWind']
    return stats



stats =  getStats()


@app.route("/getYear/<year>")
def getYear(year):
    print ("year",year)
    storms = getData([int(year)],0)
    return jsonify(storms)

@app.route("/retired/<name>")
def getRetired(name):
    print ("IN RETIRED",name)
    storm = getStorm(name)
    return jsonify(storm)




@app.route("/info")
def getInfo():
    statsarr = []
    for year in stats:
        stats[year]['year'] = year
        statsarr.append(stats[year])
 #       print (year,type(year))
 #       for key in stats[year]:
 #           print ("    ",key,type(key),stats[year][key],type(stats[year][key]))
 #   return jsonify(statsarr)
 #   print (statsarr)
    return jsonify(statsarr)



@app.route("/")
def home():
   
      return render_template("index.html")



@app.route('/result',methods = ['POST', 'GET'])
def result():
    hit=0
    if request.method == 'POST':
 #      result = request.form
       query_string = ""
       
#getInfo()

#getStorm("Irma")

if __name__ == "__main__":  
    app.run(debug=True)