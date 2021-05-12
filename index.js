const express = require("express");
const app = express();
const port = Number(process.env.PORT) || 3001;

var avg = [] // Where the aeverages for each survey are stored
var ids = [] // Where all the unique ids are stored 

// The Box-Muller transform converts two independent uniform variates on (0, 1) into two standard Gaussian variates (mean 0, variance 1)
function randn_bm() {
  var u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

const SURVEY_DURATIONS_IN_MINUTES = (process.env.SURVEY_DURATIONS || '12,5,3,6,20,7').split(',').map(Number);

app.get("/survey-completed-event", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const index = Math.floor(Math.random() * SURVEY_DURATIONS_IN_MINUTES.length);
  const durationInMinutes = SURVEY_DURATIONS_IN_MINUTES[index];
  // Variance is around half of the duration. Ie longer surveys have a bigger variance
  const sampledDuration = durationInMinutes * 60000 + 30000 * durationInMinutes * randn_bm();
  res.end(
    getData(JSON.stringify({
      startTime: new Date(
        new Date().getTime() - Math.max(0, sampledDuration)
      ).toISOString(),
      endTime: new Date().toISOString(),
      surveyId: index,
    })
    )
  );
});

// This function taeks the JSON information and calculates the averages time
//It then triggers the function to calculate the amount of unique IDS
function getData(data) {
  var info = JSON.parse(data) //Json Data
  var t1 = new Date(info.startTime) //Start Time
  var t2 = new Date(info.endTime) // End Time
  var surveyId = info.surveyId // Id
  var timediff = new Date(t2.valueOf() - t1.valueOf()) // Time Difference 
  timediff = timediff.toISOString()
  avg.push({ surveyId, timediff }) //Adds average time to Array 
  getId(data)
}

// This function finds all the unique IDs and adds them to the array 'ids'
//it works by makeing a loop around avg and adds all the IDs it has not seen before
function getId(data) {
  var info = JSON.parse(data) // Json data
  var i
  var flag = false // Used as a way to detect seen IDs
  //This is the inital add to 'ids' in order to have a for loop 'ids' size need to be greater then 0
  if (ids.length == 0) {
    ids.push(info.surveyId)
  } else {
    if (flag == false) {
      //scans through 'ids'
      for (i = 0; i < ids.length; i++) {
        // if the id is not unique set the flag to ture 
        if (ids[i] == info.surveyId) {
          flag = true
        }
      }
      // if the id is unique (flag did not go off) add the id to the list
      if (flag == false) {
        ids.push(info.surveyId)
      }
    }
  }
}

//Here we calulate the average time for all available surveys and displays the results to the console
app.get("/get-results", (req, res) => {
  var data = avg
  var results = [] // end results will be stored here
  var temp = [] // disposable array
  var i
  var o
  //this loop will go through all of the unique ids and calculate the average of each
  for (i = 0; i < ids.length; i++) {

    var id = ids[i]
    // this loop will put each value of a unique id into a temporary array
    for (o = 0; o < data.length; o++) {
      if (data[o].surveyId == ids[i]) {
        var diffCheck = new Date(data[o].timediff)
        //This if statement check to see if the survey was completed in 0 secounds if so ignores it
        if (diffCheck.getMinutes() == 0 && diffCheck.getSeconds() == 0) {
          console.log(data[o])
          console.log("Can not complete a survey in 0 secounds")
        } else {
          temp.push(data[o])
        }
      }
    }
    console.log(temp)//Print out each group 
    var tempCal = 0 // creates the inital variable to perform calculations
    var tempAvg // average time will be stored here
    //adds up all of the times together
    for (o = 0; o < temp.length; o++) {
      var tempTime = new Date(temp[o].timediff)
      tempCal = tempCal + tempTime.valueOf()
    }
    //diviveds total time by amount
    tempCal = tempCal / temp.length
    tempAvg = new Date(tempCal) //sets calculation as a time
    tempAvg = tempAvg.toISOString() //puts calculation into format given
    results.push({ id, tempAvg })//sends a specifc ids average time to complete to final results
    //resets data ready for the next id
    tempCal = 0
    temp = []
  }
  //sends results to console
  console.log(results)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
