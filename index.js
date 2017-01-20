// imports of spark and toggle functionality
var spark       = require("spark"),
    TogglClient = require("toggl-api");

// instatiate global toggle api client and particle.
var toggl       = new TogglClient({apiToken: "9c6752b7992e7d41f0b72f03c0951b35"}),
	  currentParticle;

const MY_PARTICLE_NAME = "TogglBitch"

initParticle();

// utility print function to save us some typing.
function p(msg) { console.log(msg) }

// guard variable to avoid calling Toggle twice on double click.
var amSpeakingWithToggle = false
function onToggleGetCurrentTime ( err, currentEntry) {
          if (currentEntry) {
            console.log(currentEntry.description + " is running");

            toggl.stopTimeEntry(currentEntry.id, function(err, stoppedEntry) {
              console.log(stoppedEntry.description + " was stopped");
		amSpeakingWithToggle = false

              currentParticle.callFunction("ledTrigger", "OFF", function(result) {
                console.log("LED should be off");
              });
            });
          } else {
            var currentDate = new Date(),
                yesterday = new Date();

            yesterday.setDate(currentDate.getDate() - 1);
            
            toggl.getTimeEntries(yesterday.toISOString(), currentDate.toISOString(), function(err, data) {
              if (!err) {
		p(JSON.stringify( data ))
                var lastEntry = data[data.length - 1];
console.log("!!!!!!!!!!!!!!!!!!")
                console.log(typeof lastEntry);
console.log("!!!!!!!!!!!!!!!!!!")

                toggl.startTimeEntry({
                  description: lastEntry.description,
                  pid: lastEntry.pid,
                  wid: lastEntry.wid
                }, function(err, timeEntry) {
                  console.log("Entry started");
			amSpeakingWithToggle = false
                  currentParticle.callFunction("ledTrigger", "ON", function(result) {
                    console.log("LED should be on");
                  });
                });
              }
            });
          }
        }

function onSparkButtonPressed () {
  p("Button was pressed!");
  if (amSpeakingWithToggle) {
    p("ignoring")
    return
  }

  amSpeakingWithToggle = true
  toggle.getCurrentTimeEntry( onToggleGetCurrentTime )
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

function initParticle() {
  spark.on("login", onSparkLogin);

  spark.login({
    accessToken: "9ab9ba7bcddbaf84ff559ef0820a7c05ae9c46ff"
  }, (err, body) => {
    if (!err) {
      p(`API login complete! ${JSON.stringify(body)}`)
    } else {
      p("login failed: "+err)
    }
  }) // end spark.login
}
