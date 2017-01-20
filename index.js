// imports of spark and toggle functionality
var spark       = require("spark"),
    TogglClient = require("toggl-api");


// TOGGL configuration
const TOGGL_DEFAULT_WID    = 991369
const TOGGL_DEFAULT_PID    = 29460565
const TOGGL_DEFAULT_DESC   = "Keine Schablone vorhanden"
const TOGGL_TIMEFRAME      = 2 // number of days to look for a template entry
const TOGGL_API_KEY        = "9c6752b7992e7d41f0b72f03c0951b35"
const TOGGL_QUERY_INTERVAL = 1000

// SPARK / Particle config
const MY_PARTICLE_NAME   = "TogglBitch"
const SPARK_ACCESS_TOKEN = "9ab9ba7bcddbaf84ff559ef0820a7c05ae9c46ff"


// instatiate global toggle api client and particle.
var toggl       = new TogglClient({apiToken: TOGGL_API_KEY}),
	  currentParticle;


// utility print function to save us some typing.
function p(msg) { console.log(msg) }

// utility function to turn led on or off.
function led(onOff) {
  currentParticle.callFunction("ledTrigger", onOff ? "ON" : "OFF", (result) => {
    p(`LED should be ${ onOff ? "on" : "off"}`);
  });
}

////////////////////////////////////////////////////////////////////////
// Actual callbacks
////////////////////////////////////////////////////////////////////////

// guard variable to avoid calling Toggle twice on double click.
var amSpeakingWithToggle = false

// get time entries retrieves the last few days worth of entries,
// to use them as a template for a new entry. In case no previous entries
// can be found, use default values ...
function onTogglGetTimeEntries (err, entries) {
  if (err) {
    p(`could not retrieve template entries ${err}`)
    amSpeakingWithToggle = false
    return
  }
	
  p(JSON.stringify( entries ))
  var lastEntry = entries[entries.length - 1];

  var timeEntry = {
     description: TOGGL_DEFAULT_DESC
    ,pid:         TOGGL_DEFAULT_PID
    ,wid:         TOGGL_DEFAULT_WID
  }
  
  // if we found an entry, use it as a template.
  if (typeof lastEntry !== "undefined") {
    timeEntry.description = lastEntry.description
    timeEntry.pid         = lastEntry.pid
    timeEntry.wid         = lastEntry.wid
  }    

  toggl.startTimeEntry( timeEntry , (err, newEntry) => {
    p("Entry started");
    // clear the guard condition, we're done talking to 
    // Toggl, and are free to call the API again.
    amSpeakingWithToggle = false
    led(true)
  });
}

// checks whether a current toggl entry is accessible. If so,
// stop the timer.
function onToggleGetCurrentTimeEntry ( err, currentEntry) {
  if (err) {
    p(`An error occured talking to Toggl: ${err}`)
    amSpeakingWithToggle = false
    return
  }
  if (currentEntry) {
    p(currentEntry.description + " is running. Will stop it.");

    toggl.stopTimeEntry( currentEntry.id, (err, stoppedEntry) => {
      if (err) {
        p(`could not stop current entry: ${err}`)
        return
      }
      p(stoppedEntry.description + " was stopped");
      amSpeakingWithToggle = false
      led(false)
    });
  } else {
    // construct a new task.
    var currentDate = new Date(),
        yesterday   = new Date()
        
    yesterday.setDate(currentDate.getDate() - TOGGL_TIMEFRAME);
  
    p( `Trying to retrieve a template entry from between ${yesterday} and ${currentDate}`)
    toggl.getTimeEntries(yesterday.toISOString(), currentDate.toISOString(), onTogglGetTimeEntries) // getTimeEntries
  } // else
} // onToggleGetCurrentTimeEntry

function onSparkButtonPressed () {
  p("Button was pressed!");
  // Communication with toggle is already taking place,
  // wait until it's completed to start new communication.
  if (amSpeakingWithToggle) {
    p("ignoring")
    return
  }

  amSpeakingWithToggle = true
  toggl.getCurrentTimeEntry( onToggleGetCurrentTimeEntry )
}

function onSparkLogin (err, body) {
  p("Particle device login successful: ", body)
  
  var deviceListPromise = spark.listDevices();
  // find my toggl Particle button ...
  deviceListPromise.then( (devices) => {
    for (var i = 0; i!=devices.length; ++i) {
      if (devices[i].name === MY_PARTICLE_NAME) {
        currentParticle = devices[i]

        p("Particle was found: ", currentParticle);
        // register to handle buttonPressEvents from Particle
        currentParticle.onEvent("buttonPressed", onSparkButtonPressed);
        break
      } // if
    } // for
  } /* TODO write a reject procedure for unsuccessful listDevices calls.*/);
			
}

function initTogglQuery () {
  toggl.getCurrentTimeEntry( (err, entry) => {
    if (err) {
      p(`error trying to query toggl: ${err}`)
      return
    }
    p(entry)
    if (entry) { led(true) } else { led(false) }
    setTimeout(initTogglQuery, TOGGL_QUERY_INTERVAL)
  } )

}
function initParticle() {
  spark.on("login", onSparkLogin);

  spark.login({
    accessToken: SPARK_ACCESS_TOKEN 
  }, (err, body) => {
    if (!err) {
      p(`API login complete! ${JSON.stringify(body)}`)
      initTogglQuery()
    } else {
      p("login failed: "+err)
    }
  }) // end spark.login
}


initParticle();
