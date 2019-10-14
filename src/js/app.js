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

var blackStatusBar = {
	color: "white",
	backgroundColor: "black",
	separator: 'none'
};
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
		url: 'https://api.darksky.net/forecast/' + darkSkyApiKey + "/" + pos.coords.latitude + ',' + pos.coords.longitude + '?exclude=currently,daily,alerts,flags?units=auto',
		 type: 'json'
	 }, getWeatherData_cb, getWeatherData_ecb);
}

function getWeatherData_cb(data) {
	// console.log(JSON.stringify(data));
	debugLog("Parse Weather Data", true);
	debugLog("dbg::data:" + JSON.stringify(data));
	for (i = 0; i < data.hourly.data.length; i++) {
		debugLog("ICON: " + data.hourly.data[i].icon);
		debugLog("Index: " + ["rain","snow","sleet"].indexOf(data.hourly.data[i].icon));

		if (["rain","snow","sleet"].indexOf(data.hourly.data[i].icon) > -1) {

			startTime = new Date(data.hourly.data[i].time * 1000);
			icon = data.hourly.data[i].icon;
			summary = data.hourly.data[i].summary
			intensity = data.hourly.data[i].precipIntensity;
			probability = data.hourly.data[i].precipProbability;
			duration = 1;

			while (i < data.hourly.data.length - 1 && data.hourly.data[i+1].summary === summary) {
				i++;
				duration++;
				if (data.hourly.data[i].precipIntensity > intensity) {
					intensity = data.hourly.data[i].precipIntensity;
				}
				if (data.hourly.data[i].precipProbability > probability) {
					probability = data.hourly.data[i].precipProbability;
				}
			}

			endTime = new Date(startTime.getTime() + duration * 3600000);
			pebbleIcon = getPebbleIcon(icon, intensity);

			debugLog("Create Pin @ " + data.hourly.data[i].time, true);
			/*pin = {
				"id": "rainalert-" + uniquePinID + "-" + data.hourly.data[i].time,
				"time": startTime.toISOString(),
				"duration": duration * 60,
				"lastUpdated": new Date(Date.now()).toISOString(),
				"layout": {
					"type": "weatherPin",
					"title": data.hourly.data[i].summary,
					"locationName": "Until " + endTime.toLocaleTimeString().replace(":00:00", "").slice(0, -4),
					//"locationName": data.timezone.substring(data.timezone.indexOf("/") + 1).replace("_", " "), //todo: resolve lat/lon to friendly name?
					//"subtitle": Math.round(probability * 100) + "%", //If "%" doesn't appear, replace with "/100"
					"tinyIcon": pebbleIcon,
					"smallIcon": pebbleIcon,
					"largeIcon": pebbleIcon,
				}
			};*/

			// //fantasyFunction.timeline.push(pin);
			//console.log(JSON.stringify(pin));

		} else {
			//fantasyFunction.timeline.delete("wowfunhappy-will-it-rain-" + data.hourly.data[i].time);
			debugLog("Delete pin @ " + data.hourly.data[i].time);
		}
	}

	Wakeup.launch(function(e) {
		if (! e.wakeup) {
			displaySummary(data);
		}
	});

	setWakeUpAlarm();
}

function getPebbleIcon(darkSkyIcon, intensity) {
	if (darkSkyIcon === "rain") {
		if (intensity < 0.098) {
			return "system://images/TIMELINE_LIGHT_RAIN";
		}
		else {
			return "system://images/TIMELINE_HEAVY_RAIN"
		}
	} else if (darkSkyIcon === "snow") {
		return "system://images/TIMELINE_HEAVY_SNOW";
	} else if (darkSkyIcon === "sleet") {
		return "system://images/TIMELINE_RAINING_AND_SNOWING";
	} else {
		return "system://images/TIMELINE_WEATHER";
	}
}

function displaySummary(data) {
	card = new UI.Card({
		status: blackStatusBar,
		body: data.minutely.summary + " " + data.hourly.summary
	});
	card.show();
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
}
else if (typeof darkSkyApiKey === 'undefined' || darkSkyApiKey === "") { //Should we actually check if full process of quiering the API works?
	card = new UI.Card({
		status: blackStatusBar,
		style: "large",
		body: "😞 Rain Alert isn't ready just yet! Open settings on your phone."
	});

	card.show();
}

getLatLon(getWeatherData);
