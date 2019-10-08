var UI = require('ui');
var ajax = require('ajax');
var Wakeup = require('wakeup');

//All of these should be retrieved from Settings
var darkSkyApiKey = "";
var refreshFrequency = 30;

var uniquePinID = "83473842"

//debug flags
//Debug logging and behaviour
var debug = true;
//Prevent the app from creating wakeup events
var debug_disable_wakeup_creation = true;
//Override location acquisition
var debug_use_fixed_location = true;
var debug_fixed_lat = "52.916291";
var debug_fixed_lon = "-3.927604";

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

	console.log(debug_use_fixed_location);
	if (debug_use_fixed_location) {

		var pos = {}
		pos.coords = {}
		pos.coords.latitude = debug_fixed_lat;
		pos.coords.longitude = debug_fixed_lon;
		callback(pos)

	} else {

		navigator.geolocation.getCurrentPosition(callback, function() {
			debugLog("Could not get location", true);
		}, {
			enableHighAccuracy: false,
			maximumAge: 10000,
			timeout: 1000
		});

	}
}

function getWeatherData(pos) {
	debugLog("Request Weather Data", true);
	debugLog("dbg::pos::lat:" + pos.coords.latitude);
	debugLog("dbg::pos::lon:" + pos.coords.longitude);

	ajax({
		url: 'https://api.darksky.net/forecast/' + darkSkyApiKey + "/" + pos.coords.latitude + ',' + pos.coords.longitude + '?exclude=currently,minutely,daily,alerts,flags',
		 type: 'json'
	 }, getWeatherData_cb, getWeatherData_ecb);
}

function getWeatherData_cb(data) {
	debugLog("Parse Weather Data", true);
	debugLog("dbg::data:" + JSON.stringify(data));
	for (i = 0; i < data.hourly.data.length; i++) {
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
function getWeatherData_ecb(data) {
	//This is the error callback
	debugLog("Request Failed", true)
	debugLog("Failed Data: " + JSON.stringify(data))
}
function setWakeUpAlarm() {

	if (debug) {
		refreshFrequency = 1;
	}

	debugLog("Set Wakeup", true);

	if (debug_disable_wakeup_creation === false) {
		Wakeup.schedule(
	  	{
				// Set the wakeup event for refreshFrequency from now (or 1 min for debug)
	    	time: Date.now() / 1000 + (refreshFrequency * 60),
	    },
	  	function(e) {
	    	if (e.failed) {

	      	// Log the error reason
	      	debugLog('Wakeup set failed: ' + e.error);

	    	} else {

	      	console.log('Wakeup set! Event ID: ' + e.id);
					debugLog("Wakeup Set", true);
					debugLog("Close", true);

					if (debug) {

						//Don't actually close
						debugLog("Abort close (debug)", true);

					} else {

						card.hide();
						card.close();

					}

	    	}
	  	}
		);
	}
}

debugLog("start");

if (debug) {

	card = new UI.Card({
  	title: 'Rain Alert',
		color: "black",
		backgroundColor: "white",
		style: "small",
		status: false,
		scrollable: true,
		body: 'Start'

	});

	card.show();

} else {

	card = new UI.Card({
		title: 'Rain Alert - Powered by DarkSky',
		//color: "white",
		//backgroundColor: "black",
		status: false,
		style: "small"
	});

	if (typeof darkSkyApiKey !== 'undefined' && darkSkyApiKey !== "") { //Should we actually check if full process of quiering the API works?

		card.body("👍 You're all set! Pins should start appearing in your timeline when it's going to rain or snow.");

	}	else {

		card.body("😞 You're not set up just yet! Check settings on your phone!");

	}

	card.show();

}

getLatLon(getWeatherData);
