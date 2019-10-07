var UI = require('ui');
var ajax = require('ajax');
var Wakeup = require('wakeup');

var darkSkyApiKey = ""
var uniquePinID = "83473842"

var debug = true;
card = {};

function debugLog(msg, onwatch) {
	if (debug) {
		console.log(msg);
		if (onwatch) {
			card.body(card.body() + "\n" + msg);
		}
	}
}

function getLatLon(callback) {
	debugLog("Get Location", true);

	navigator.geolocation.getCurrentPosition(callback, function() {
		debugLog("Could not get location");
	}, {
		enableHighAccuracy: true,
		maximumAge: 10000,
		timeout: 1000
	});
}

function getWeatherData(pos) {
	debugLog("Request Weather Data", true);
	debugLog("dbg::pos::lat:" + pos.coords.latitude);
	debugLog("dbg::pos::lon:" + pos.coords.longitude);

	ajax({
		url: 'https://api.darksky.net/forecast/' + darkSkyApiKey + "/" + pos.coords.latitude + ',' + pos.coords.longitude + '?exclude=currently,minutely,daily,alerts,flags',
		 type: 'json'
	 }, getWeatherData_cb);
}

function setWakeUpAlarm() {

	var wakeupOffset = 3600;

	if (debug) {
		wakeupOffset = 60;
	}

	debugLog("Set Wakeup", true);
	Wakeup.schedule(
	  {
			// Set the wakeup event for one hour from now (or 1 min for debug)
	    time: Date.now() / 1000 + wakeupOffset,
	    // Pass data for the app on launch
	    data: { hello: 'world' }
	  },
	  function(e) {
	    if (e.failed) {
	      // Log the error reason
	      console.log('Wakeup set failed: ' + e.error);
	    } else {
	      console.log('Wakeup set! Event ID: ' + e.id);
				debugLog("Wakeup Set", true);
				debugLog("Close", true);

				if (debug) {
					debugLog("Abort close (debug)", true);
				} else {
					card.hide();
					card.close();
				}

	    }
	  }
	);
}

function getWeatherData_cb(data) {
	debugLog("Parse Weather Data", true);
	debugLog("dbg::data:" + JSON.stringify(data));
	for (i = 0; i < data.hourly.data.length; i++) {
		//if (data.hourly.data[i].icon === "rain" || data.hourly.data[i].icon === "snow" || data.hourly.data[i].icon === "sleet") {
		debugLog("ICON: " + data.hourly.data[i].icon);
		debugLog("Index: " + ["rain","snow","sleet"].indexOf(data.hourly.data[i].icon));

		if (["rain","snow","sleet"].indexOf(data.hourly.data[i].icon) > -1) {

			icon = data.hourly.data[i].icon;
			duration = 60;

			while (data.hourly.data[i+1].icon === icon) {
				i++;
				duration = duration + 60;
			}

			if (icon === "rain") {
				tinyIcon = "system://images/TIMELINE_HEAVY_RAIN";
				smallIcon = "system://images/TIMELINE_HEAVY_RAIN";
				largeIcon = "system://images/TIMELINE_HEAVY_RAIN";
			}	else if (icon === "snow") {
				tinyIcon = "system://images/TIMELINE_HEAVY_SNOW";
				smallIcon = "system://images/TIMELINE_HEAVY_SNOW";
				largeIcon = "system://images/TIMELINE_HEAVY_SNOW";
			}	else if (icon === "sleet") {
				tinyIcon = "system://images/TIMELINE_RAINING_AND_SNOWING";
				smallIcon = "system://images/TIMELINE_RAINING_AND_SNOWING";
				largeIcon = "system://images/TIMELINE_RAINING_AND_SNOWING";
			}

			debugLog("Create Pin @ " + data.hourly.data[i].time, true);
			// pin = {
			// 	"id": "rainalert-" + uniquePinID + "-" + data.hourly.data[i].time,
			// 	"time": new Date(data.hourly.data[i].time * 1000).toISOString(),
			// 	"duration": duration,
			// 	"lastUpdated": new Date(Date.now()).toISOString(),
			// 	"layout": {
			// 		"type": "weatherPin",
			// 		"title": data.hourly.data[i].summary,
			// 		"locationName": data.timezone, //todo: resolve lat/lon to friendly name?
			// 		"subtitle": data.temperature + "°";
			// 		"tinyIcon": tinyIcon,
			// 		"smallIcon": smallIcon,
			// 		"largeIcon": largeIcon,
			// 	}
			// };

			// //fantasyFunction.timeline.push(pin);
			// console.log(JSON.stringify(pin));
		}	else {
			//fantasyFunction.timeline.delete("wowfunhappy-will-it-rain-" + data.hourly.data[i].time);
			debugLog("Delete pin @ " + data.hourly.data[i].time);
		}
	}

	setWakeUpAlarm();
}

//start
debugLog("start");

if (debug) {
	card = new UI.Card({
  	title: 'Rain Alert',
		color: "white",
		backgroundColor: "black",
		style: "small",
		fullscreen: true,
		scrollable: true,
		body: 'Start'
	});

	card.show();

} else {

	card = new UI.Card({
		title: 'Rain Alert',
		color: "white",
		backgroundColor: "black",
		style: "large",
		subtitle: "Syncing",
		fullscreen: true,
		scrollable: false
	});

	card.show();

}


getLatLon(getWeatherData);
