var spark = require("spark"),
	TogglClient = require("toggl-api"),
	toggl = new TogglClient({apiToken: "9c6752b7992e7d41f0b72f03c0951b35"}),
	_ = require("underscore"),
	currentParticle;

initParticle();
function p(msg) { console.log(msg) }
var amSpeakingWithToggle = false
function initParticle() {
	spark.on("login", function(err, body) {
		console.log("Particle device login successful: ", body);
		var deviceList = spark.listDevices();

		deviceList.then(function(devices) {
			var currentParticle = _.find(devices, function(device) {
				return device.name == "TogglBitch";
			});
			
			console.log("TogglBitch was found: ", currentParticle);

			currentParticle.onEvent("buttonPressed", function() {
				console.log("Button was pressed!");
				if (amSpeakingWithToggle) {
					p("ignoring")
					return
				}
				amSpeakingWithToggle = true

        toggl.getCurrentTimeEntry(function(err, currentEntry) {
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
        });
			});
		});
	});

	spark.login({
		accessToken: "9ab9ba7bcddbaf84ff559ef0820a7c05ae9c46ff"
	}, function(err, body) {
		if (!err) console.log("API login complete!");
	});
}
