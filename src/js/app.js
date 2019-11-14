var UI = require('ui');
var ajax = require('ajax');
var Wakeup = require('wakeup');
var Settings = require('settings');
var Vector2 = require('vector2');
var Feature = require('platform/feature');



//All of these should be retrieved from Settings
var darkSkyApiKey = "";
var refreshFrequency = 30;

//Generate this programatically in the future
var uniquePinID = "83473842"

//Pre-prod endpoint
var URL_settings = "https://willow.systems/preprod/pebble-rainalert/config/"

var syncIntervals = ["1 hour", "3 hours","8 hours", "12 hours", "24 hours"];

//debug flags
//Debug logging and behaviour
var debug = true;
//Prevent the app from creating wakeup events
var debug_disable_wakeup_creation = true;
//Force the app to always behave as though it was started via a wakeup event:
var debug_force_wakeup_behaviour = false;
//Override location acquisition
var debug_use_fixed_location = true;
var debug_fixed_lat = "52.9162";
var debug_fixed_lon = "-3.9276";

pinCache = [];

card = {};

menu = null;
reload = null;

function loadPinCacheToMemory() {
	//Load the pin cache and delete any old pins (from cache, we let rws clean them up from tl, duh.)
	pinCache = Settings.data('pinCache');

	debugLog("Pincache: " + JSON.stringify(pinCache));


	//Get midnight
	var n = new Date();
	n.setHours(0,0,0,0);

	//Clear any pins older than midnight
	if (pinCache != null) {
		newCache = [];
		for (var i = 0; i < pinCache.length; i++) {
			debugLog("Cleanup::is " + pinCache[i].time + " > " + n.getTime());
			if (pinCache[i].time > n.getTime()) {
				debugLog("Cleanup::yes::addToNewCacheObj")
				newCache.push(pinCache[i]);
			} else {
				debugLog("Cleanup::no::excludeFromNewCacheObj")
			}
		}

		pinCache = newCache

		newCache = null;
		Settings.data('pinCache', pinCache);
	}

}
function wipePinCache() {
	debugLog("Wiping PinCache")
	Settings.data('pinCache', null);
}

function debugLog(msg, onwatch) {
	if (debug) {
		console.log(msg);
		if (onwatch) {
			card.body(card.body() + "\n" + msg);
		}
	}
}
function boolToEnabled(bool) {
	if (bool) {
		return "Enabled"
	} else {
		return "Disabled"
	}
}
function intToSyncInterval(i) {
	if (i > -1 && i < syncIntervals.length) {
		return syncIntervals[i].toString();
	} else {
		return "Something Broke"
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

	// ajax({
	// 	url: 'https://api.darksky.net/forecast/' + darkSkyApiKey + "/" + pos.coords.latitude + ',' + pos.coords.longitude + '?exclude=currently,minutely,daily,alerts,flags',
	// 	 type: 'json'
	//  }, getWeatherData_cb, getWeatherData_ecb);
	getWeatherData_cb(JSON.parse('{"latitude":52.9162,"longitude":-3.9276,"timezone":"Europe/London","hourly":{"summary":"Rain until tomorrow afternoon.","icon":"rain","data":[{"time":1573506000,"summary":"Possible Light Rain","icon":"rain","precipIntensity":0.0303,"precipProbability":0.47,"precipType":"rain","temperature":39.05,"apparentTemperature":31.05,"dewPoint":38.17,"humidity":0.97,"pressure":1001.2,"windSpeed":13.7,"windGust":32.19,"windBearing":286,"cloudCover":0.49,"uvIndex":0,"visibility":10,"ozone":356.7},{"time":1573509600,"summary":"Possible Light Rain","icon":"rain","precipIntensity":0.0326,"precipProbability":0.49,"precipType":"rain","temperature":38.87,"apparentTemperature":30.79,"dewPoint":37.78,"humidity":0.96,"pressure":1001.1,"windSpeed":13.79,"windGust":32.26,"windBearing":288,"cloudCover":0.48,"uvIndex":0,"visibility":10,"ozone":360.9},{"time":1573513200,"summary":"Possible Light Rain","icon":"rain","precipIntensity":0.0345,"precipProbability":0.5,"precipType":"rain","temperature":38.79,"apparentTemperature":30.66,"dewPoint":37.38,"humidity":0.95,"pressure":1001,"windSpeed":13.83,"windGust":32.2,"windBearing":290,"cloudCover":0.52,"uvIndex":0,"visibility":10,"ozone":365.6},{"time":1573516800,"summary":"Possible Light Rain","icon":"rain","precipIntensity":0.0348,"precipProbability":0.49,"precipType":"rain","temperature":38.88,"apparentTemperature":30.73,"dewPoint":37.04,"humidity":0.93,"pressure":1000.8,"windSpeed":13.99,"windGust":32.16,"windBearing":291,"cloudCover":0.58,"uvIndex":0,"visibility":9.882,"ozone":368.8},{"time":1573520400,"summary":"Possible Light Rain","icon":"rain","precipIntensity":0.0327,"precipProbability":0.47,"precipType":"rain","temperature":38.96,"apparentTemperature":30.71,"dewPoint":36.67,"humidity":0.91,"pressure":1000.5,"windSpeed":14.35,"windGust":32.05,"windBearing":290,"cloudCover":0.7,"uvIndex":0,"visibility":10,"ozone":370.2},{"time":1573524000,"summary":"Possible Light Rain","icon":"rain","precipIntensity":0.0291,"precipProbability":0.44,"precipType":"rain","temperature":39.03,"apparentTemperature":30.63,"dewPoint":36.2,"humidity":0.89,"pressure":1000.2,"windSpeed":14.86,"windGust":31.96,"windBearing":288,"cloudCover":0.85,"uvIndex":0,"visibility":10,"ozone":370.3},{"time":1573527600,"summary":"Possible Light Rain","icon":"rain","precipIntensity":0.0251,"precipProbability":0.4,"precipType":"rain","temperature":39.18,"apparentTemperature":30.62,"dewPoint":35.84,"humidity":0.88,"pressure":999.8,"windSpeed":15.51,"windGust":32.26,"windBearing":287,"cloudCover":0.96,"uvIndex":0,"visibility":10,"ozone":368.9},{"time":1573531200,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0185,"precipProbability":0.34,"precipType":"rain","temperature":39.45,"apparentTemperature":30.71,"dewPoint":35.79,"humidity":0.87,"pressure":999.3,"windSpeed":16.41,"windGust":33.24,"windBearing":295,"cloudCover":0.98,"uvIndex":0,"visibility":10,"ozone":365.3},{"time":1573534800,"summary":"Overcast","icon":"cloudy","precipIntensity":0.014,"precipProbability":0.29,"precipType":"rain","temperature":39.77,"apparentTemperature":30.83,"dewPoint":36.17,"humidity":0.87,"pressure":998.7,"windSpeed":17.48,"windGust":34.63,"windBearing":272,"cloudCover":0.95,"uvIndex":0,"visibility":10,"ozone":360.3},{"time":1573538400,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0168,"precipProbability":0.29,"precipType":"rain","temperature":40.23,"apparentTemperature":31.17,"dewPoint":36.68,"humidity":0.87,"pressure":998.2,"windSpeed":18.41,"windGust":36.08,"windBearing":278,"cloudCover":0.92,"uvIndex":0,"visibility":10,"ozone":356.3},{"time":1573542000,"summary":"Possible Light Rain","icon":"rain","precipIntensity":0.0349,"precipProbability":0.45,"precipType":"rain","temperature":40.55,"apparentTemperature":31.35,"dewPoint":37.31,"humidity":0.88,"pressure":997.7,"windSpeed":19.37,"windGust":38.02,"windBearing":273,"cloudCover":0.91,"uvIndex":0,"visibility":9.371,"ozone":354.5},{"time":1573545600,"summary":"Possible Light Rain and Windy","icon":"rain","precipIntensity":0.0741,"precipProbability":0.64,"precipType":"rain","temperature":40.94,"apparentTemperature":31.66,"dewPoint":38.15,"humidity":0.9,"pressure":997.2,"windSpeed":20.21,"windGust":40,"windBearing":297,"cloudCover":0.91,"uvIndex":0,"visibility":6.962,"ozone":353.8},{"time":1573549200,"summary":"Rain and Windy","icon":"rain","precipIntensity":0.1083,"precipProbability":0.72,"precipType":"rain","temperature":41.45,"apparentTemperature":32.36,"dewPoint":39.84,"humidity":0.94,"pressure":997,"windSpeed":20.12,"windGust":40.36,"windBearing":292,"cloudCover":0.91,"uvIndex":0,"visibility":5.824,"ozone":352.8},{"time":1573552800,"summary":"Rain","icon":"rain","precipIntensity":0.108,"precipProbability":0.71,"precipType":"rain","temperature":42.05,"apparentTemperature":33.59,"dewPoint":41.35,"humidity":0.97,"pressure":997.2,"windSpeed":18.23,"windGust":37.53,"windBearing":296,"cloudCover":0.92,"uvIndex":0,"visibility":7.156,"ozone":350.9},{"time":1573556400,"summary":"Possible Light Rain","icon":"rain","precipIntensity":0.0891,"precipProbability":0.67,"precipType":"rain","temperature":43.22,"apparentTemperature":35.84,"dewPoint":42.65,"humidity":0.98,"pressure":997.7,"windSpeed":15.43,"windGust":33.04,"windBearing":302,"cloudCover":0.94,"uvIndex":1,"visibility":9.762,"ozone":348.6},{"time":1573560000,"summary":"Possible Light Rain","icon":"rain","precipIntensity":0.0672,"precipProbability":0.6,"precipType":"rain","temperature":44.83,"apparentTemperature":38.46,"dewPoint":44.19,"humidity":0.98,"pressure":998.2,"windSpeed":13.45,"windGust":29.78,"windBearing":308,"cloudCover":0.96,"uvIndex":1,"visibility":10,"ozone":346.8},{"time":1573563600,"summary":"Possible Light Rain","icon":"rain","precipIntensity":0.0429,"precipProbability":0.48,"precipType":"rain","temperature":46.04,"apparentTemperature":40.1,"dewPoint":44.71,"humidity":0.95,"pressure":998.7,"windSpeed":13.11,"windGust":29.14,"windBearing":311,"cloudCover":0.97,"uvIndex":1,"visibility":10,"ozone":345.6},{"time":1573567200,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0214,"precipProbability":0.36,"precipType":"rain","temperature":46.63,"apparentTemperature":40.72,"dewPoint":44.5,"humidity":0.92,"pressure":999.2,"windSpeed":13.56,"windGust":29.73,"windBearing":312,"cloudCover":0.98,"uvIndex":0,"visibility":10,"ozone":344.7},{"time":1573570800,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0107,"precipProbability":0.28,"precipType":"rain","temperature":46.19,"apparentTemperature":40.11,"dewPoint":44.11,"humidity":0.92,"pressure":999.8,"windSpeed":13.73,"windGust":30.14,"windBearing":311,"cloudCover":0.99,"uvIndex":0,"visibility":10,"ozone":344.4},{"time":1573574400,"summary":"Overcast","icon":"cloudy","precipIntensity":0.008,"precipProbability":0.21,"precipType":"rain","temperature":45.1,"apparentTemperature":38.87,"dewPoint":43.43,"humidity":0.94,"pressure":1000.5,"windSpeed":13.22,"windGust":29.97,"windBearing":312,"cloudCover":0.99,"uvIndex":0,"visibility":10,"ozone":345},{"time":1573578000,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0078,"precipProbability":0.21,"precipType":"rain","temperature":43.8,"apparentTemperature":37.49,"dewPoint":42.52,"humidity":0.95,"pressure":1001.3,"windSpeed":12.4,"windGust":29.68,"windBearing":312,"cloudCover":0.99,"uvIndex":0,"visibility":10,"ozone":346.2},{"time":1573581600,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0069,"precipProbability":0.23,"precipType":"rain","temperature":42.99,"apparentTemperature":36.8,"dewPoint":41.73,"humidity":0.95,"pressure":1002,"windSpeed":11.42,"windGust":29.26,"windBearing":312,"cloudCover":0.97,"uvIndex":0,"visibility":10,"ozone":346.8},{"time":1573585200,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0037,"precipProbability":0.2,"precipType":"rain","temperature":42.26,"apparentTemperature":36.37,"dewPoint":41.06,"humidity":0.96,"pressure":1002.5,"windSpeed":10.18,"windGust":28.79,"windBearing":314,"cloudCover":0.84,"uvIndex":0,"visibility":10,"ozone":346.4},{"time":1573588800,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0011,"precipProbability":0.11,"precipType":"rain","temperature":41.78,"apparentTemperature":36.37,"dewPoint":40.45,"humidity":0.95,"pressure":1002.8,"windSpeed":8.81,"windGust":28.25,"windBearing":315,"cloudCover":0.66,"uvIndex":0,"visibility":10,"ozone":345.4},{"time":1573592400,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0004,"precipProbability":0.05,"precipType":"rain","temperature":41.38,"apparentTemperature":36.41,"dewPoint":39.85,"humidity":0.94,"pressure":1003.1,"windSpeed":7.72,"windGust":27.48,"windBearing":317,"cloudCover":0.53,"uvIndex":0,"visibility":10,"ozone":344.6},{"time":1573596000,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0003,"precipProbability":0.05,"precipType":"rain","temperature":40.97,"apparentTemperature":36.19,"dewPoint":39.25,"humidity":0.94,"pressure":1003.4,"windSpeed":7.21,"windGust":26.4,"windBearing":318,"cloudCover":0.48,"uvIndex":0,"visibility":10,"ozone":344},{"time":1573599600,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0006,"precipProbability":0.07,"precipType":"rain","temperature":40.78,"apparentTemperature":36.09,"dewPoint":38.67,"humidity":0.92,"pressure":1003.5,"windSpeed":6.98,"windGust":25.07,"windBearing":318,"cloudCover":0.47,"uvIndex":0,"visibility":10,"ozone":343.4},{"time":1573603200,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0011,"precipProbability":0.08,"precipType":"rain","temperature":40.53,"apparentTemperature":35.97,"dewPoint":37.98,"humidity":0.91,"pressure":1003.6,"windSpeed":6.67,"windGust":23.63,"windBearing":316,"cloudCover":0.46,"uvIndex":0,"visibility":10,"ozone":343.2},{"time":1573606800,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0014,"precipProbability":0.08,"precipType":"rain","temperature":40.35,"apparentTemperature":36.09,"dewPoint":37.2,"humidity":0.88,"pressure":1003.4,"windSpeed":6.13,"windGust":22.26,"windBearing":301,"cloudCover":0.42,"uvIndex":0,"visibility":10,"ozone":343.6},{"time":1573610400,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0022,"precipProbability":0.1,"precipType":"rain","temperature":39.88,"apparentTemperature":35.95,"dewPoint":36.32,"humidity":0.87,"pressure":1003.3,"windSpeed":5.51,"windGust":20.76,"windBearing":288,"cloudCover":0.38,"uvIndex":0,"visibility":10,"ozone":344.3},{"time":1573614000,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0029,"precipProbability":0.1,"precipType":"rain","temperature":39.51,"apparentTemperature":35.87,"dewPoint":35.6,"humidity":0.86,"pressure":1003,"windSpeed":5.03,"windGust":18.74,"windBearing":296,"cloudCover":0.38,"uvIndex":0,"visibility":10,"ozone":344.5},{"time":1573617600,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0024,"precipProbability":0.1,"precipType":"rain","temperature":39.32,"apparentTemperature":35.87,"dewPoint":35.34,"humidity":0.86,"pressure":1002.7,"windSpeed":4.75,"windGust":15.39,"windBearing":353,"cloudCover":0.44,"uvIndex":0,"visibility":10,"ozone":343.5},{"time":1573621200,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0016,"precipProbability":0.08,"precipType":"rain","temperature":39.38,"apparentTemperature":36.09,"dewPoint":35.69,"humidity":0.87,"pressure":1002.3,"windSpeed":4.57,"windGust":11.49,"windBearing":197,"cloudCover":0.55,"uvIndex":0,"visibility":10,"ozone":342},{"time":1573624800,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0014,"precipProbability":0.07,"precipType":"rain","temperature":39.47,"apparentTemperature":36.29,"dewPoint":35.98,"humidity":0.87,"pressure":1001.9,"windSpeed":4.47,"windGust":9.08,"windBearing":266,"cloudCover":0.66,"uvIndex":0,"visibility":10,"ozone":341.2},{"time":1573628400,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0.0015,"precipProbability":0.08,"precipType":"rain","temperature":39.79,"apparentTemperature":36.74,"dewPoint":36.23,"humidity":0.87,"pressure":1001.5,"windSpeed":4.38,"windGust":9.44,"windBearing":305,"cloudCover":0.78,"uvIndex":0,"visibility":10,"ozone":341.6},{"time":1573632000,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0021,"precipProbability":0.11,"precipType":"rain","temperature":40.42,"apparentTemperature":37.47,"dewPoint":37.1,"humidity":0.88,"pressure":1001.1,"windSpeed":4.38,"windGust":11.28,"windBearing":225,"cloudCover":0.9,"uvIndex":0,"visibility":10,"ozone":342.8},{"time":1573635600,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0028,"precipProbability":0.14,"precipType":"rain","temperature":41.14,"apparentTemperature":38.16,"dewPoint":38.11,"humidity":0.89,"pressure":1000.4,"windSpeed":4.55,"windGust":12.66,"windBearing":242,"cloudCover":0.99,"uvIndex":0,"visibility":10,"ozone":344.5},{"time":1573639200,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0031,"precipProbability":0.12,"precipType":"rain","temperature":42.31,"apparentTemperature":39.14,"dewPoint":38.68,"humidity":0.87,"pressure":999.4,"windSpeed":5.07,"windGust":12.66,"windBearing":238,"cloudCover":1,"uvIndex":0,"visibility":10,"ozone":346.9},{"time":1573642800,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0032,"precipProbability":0.09,"precipType":"rain","temperature":43.17,"apparentTemperature":39.65,"dewPoint":38.92,"humidity":0.85,"pressure":998.3,"windSpeed":5.82,"windGust":12.22,"windBearing":219,"cloudCover":1,"uvIndex":1,"visibility":10,"ozone":349.7},{"time":1573646400,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0031,"precipProbability":0.08,"precipType":"rain","temperature":43.88,"apparentTemperature":40.17,"dewPoint":39.03,"humidity":0.83,"pressure":997.1,"windSpeed":6.36,"windGust":12.23,"windBearing":200,"cloudCover":0.99,"uvIndex":1,"visibility":10,"ozone":353},{"time":1573650000,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0019,"precipProbability":0.08,"precipType":"rain","temperature":43.58,"apparentTemperature":39.73,"dewPoint":39.27,"humidity":0.85,"pressure":995.7,"windSpeed":6.49,"windGust":13.06,"windBearing":177,"cloudCover":1,"uvIndex":1,"visibility":10,"ozone":356.8},{"time":1573653600,"summary":"Overcast","icon":"cloudy","precipIntensity":0.001,"precipProbability":0.09,"precipType":"rain","temperature":42.64,"apparentTemperature":38.65,"dewPoint":39.5,"humidity":0.89,"pressure":994.3,"windSpeed":6.43,"windGust":14.34,"windBearing":153,"cloudCover":1,"uvIndex":0,"visibility":10,"ozone":361},{"time":1573657200,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0011,"precipProbability":0.12,"precipType":"rain","temperature":41.26,"apparentTemperature":36.92,"dewPoint":39.72,"humidity":0.94,"pressure":993.1,"windSpeed":6.55,"windGust":15.92,"windBearing":133,"cloudCover":1,"uvIndex":0,"visibility":10,"ozone":364.6},{"time":1573660800,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0027,"precipProbability":0.17,"precipType":"rain","temperature":40.27,"apparentTemperature":35.49,"dewPoint":39.03,"humidity":0.95,"pressure":992.2,"windSpeed":6.96,"windGust":17.95,"windBearing":121,"cloudCover":1,"uvIndex":0,"visibility":8.882,"ozone":367},{"time":1573664400,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0089,"precipProbability":0.33,"precipType":"rain","temperature":39.47,"apparentTemperature":34.2,"dewPoint":38.08,"humidity":0.95,"pressure":991.5,"windSpeed":7.54,"windGust":20.28,"windBearing":113,"cloudCover":1,"uvIndex":0,"visibility":4.132,"ozone":368.9},{"time":1573668000,"summary":"Possible Drizzle","icon":"rain","precipIntensity":0.0153,"precipProbability":0.48,"precipType":"rain","temperature":39.3,"apparentTemperature":33.62,"dewPoint":37.73,"humidity":0.94,"pressure":990.9,"windSpeed":8.21,"windGust":22.48,"windBearing":107,"cloudCover":1,"uvIndex":0,"visibility":1.487,"ozone":371.2},{"time":1573671600,"summary":"Possible Drizzle","icon":"rain","precipIntensity":0.0136,"precipProbability":0.43,"precipType":"rain","temperature":39.23,"apparentTemperature":33.1,"dewPoint":37.37,"humidity":0.93,"pressure":990.6,"windSpeed":9.1,"windGust":24.51,"windBearing":103,"cloudCover":1,"uvIndex":0,"visibility":3.311,"ozone":374.8},{"time":1573675200,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0096,"precipProbability":0.31,"precipType":"rain","temperature":39.32,"apparentTemperature":32.74,"dewPoint":37.02,"humidity":0.91,"pressure":990.5,"windSpeed":10.11,"windGust":26.38,"windBearing":100,"cloudCover":1,"uvIndex":0,"visibility":7.239,"ozone":378.8},{"time":1573678800,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0092,"precipProbability":0.24,"precipType":"rain","temperature":39.23,"apparentTemperature":32.32,"dewPoint":36.62,"humidity":0.9,"pressure":990.7,"windSpeed":10.88,"windGust":27.71,"windBearing":96,"cloudCover":1,"uvIndex":0,"visibility":9.285,"ozone":380.9}]},"offset":0}'))
}

function deletePin(slot) {
	//This function checks against our local cache of pins to see if the pin exists, this prevents us spamming RWS with deletes for non existant options
	if (pinCache != null) {

		for (var i = 0; i < pinCache.length; i++) {
			if (pinCache[i].time == slot) {
				//There is (or was) a pin sent to RWS for this slot. Delete it.
				debugLog("Pin in cache. Sent deletion for " + slot)
			} else {
				debugLog("Pin not in cache. Not sending to RWS");
			}
		}

	}
}
function createPin(epoch, weather) {
	//This functin creates a pin but, importantly, also caches the timestamp. To see why, check deletepin()

}

function getWeatherData_cb(data) {
	debugLog("Parse Weather Data", true);
	debugLog("dbg::data:" + JSON.stringify(data));
	for (i = 0; i < data.hourly.data.length; i++) {

		debugLog("Loop. i:" + i)

		debugLog("Weather: " + data.hourly.data[i].icon);
		debugLog("Is wet: " + ["rain","snow","sleet"].indexOf(data.hourly.data[i].icon));

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

			debugLog("Rain start @ " + data.hourly.data[i].time, true);
			var d = new Date(0);
			d.setUTCSeconds(parseInt(data.hourly.data[i].time));
			debugLog("Friendly time:" + d.toString());
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
			debugLog("Delete pin @ " + data.hourly.data[i].time);
			deletePin(data.hourly.data[i].time);
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

function santiseSettings() {
	if (Settings.data("syncEnabled") == null) {
		Settings.data("syncEnabled", true);
	}

	if (Settings.option("syncInterval") == null) {
		Settings.option("syncInterval", 0);
	}

}
function renderSyncScreen() {
	var wind = new UI.Window({
		scrollable: false,
		status: false,
		backgroundColor: "white"
	});

	var cloud = new UI.Image({
		position: Feature.rectangle(new Vector2(32,44),new Vector2(50,59)),
		size: new Vector2(80,80),
		backgroundColor: "white",
		image: "IMAGE_LIGHTHOUSE"
	});

	var appTitle = new UI.Text({
		size: new Vector2(130,30),
		position: Feature.rectangle(new Vector2(28,1),new Vector2(46,20)),
		text: "Rain Alert",
		color: "black",
		font: 'gothic-28',
		textAlight: "left",
		textOverflow: "fill",
		backgroundColor: "white"
	});

	var subtitle = new UI.Text({
		size: new Vector2(50,30),
		position: Feature.rectangle(new Vector2(50,133),new Vector2(68,144)),
		text: "Syncing",
		color: "black",
		font: 'gothic-14',
		textAlight: "left",
		textOverflow: "fill",
		backgroundColor: "white"
	});

	wind.add(cloud);
	wind.add(appTitle);
	wind.add(subtitle);
	wind.show();

}

function renderAppMenu(oldmenu, activeitem) {

	// if (menu != null) {
	// 	menu.hide();
	// }

	menu = new UI.Menu({
		backgroundColor: 'white',
		textColor: 'black',
		highlightBackgroundColor: Feature.color("Electric Blue","black"),
		highlightTextColor: Feature.color("black","white")
	});

	menu.sections([{
		title: 'Rain Alert',
		items: [{
			title: 'Syncing',
			subtitle: boolToEnabled(Settings.data("syncEnabled")),
			icon: 'IMAGE_SYNC'
		}, {
			title: 'Sync Interval',
			subtitle: intToSyncInterval(Settings.option("syncInterval")),
			icon: "IMAGE_INTERVAL"
		}, {
			title: 'About',
			icon: "IMAGE_ABOUT"
		}]
	}]);

	menu.on('select', function(e) {

		if (e.itemIndex == 0) {

			//Sync toggle
			console.log("Setting::update::syncEnabled")

			var se = Settings.data("syncEnabled");
			se = !se;
			Settings.data("syncEnabled", se);

			console.log("Setting::syncEnabled:" + se)
			renderAppMenu(menu,e.itemIndex);

		} else if (e.itemIndex == 1) {

			//Sync interval
			console.log("Setting::update::syncInterval")

			var si = Settings.option("syncInterval");

			si += 1;
			if (si > syncIntervals.length - 1) {
				si = 0;
			}

			console.log("Setting::syncInterval:" + si)

			Settings.option("syncInterval", si);
			renderAppMenu(menu,e.itemIndex);

		} else if (e.itemIndex == 2) {

			//About
			var about = new UI.Card({
  			title: ' Rain Alert',
				subtitle: 'V0.1',
				body: 'Authors:\n@Will0\n@Wowfunhappy',
				subtitlecolor: Feature.color('Electric Blue', 'black'),
				style: "small",
				icon: "IMAGE_ICON"
			});
			about.show();

		} else {
			//How on earth did we get here?
			console.log("How did we get here?");
		}

	});

	menu.show();

	if (oldmenu != null) {
		oldmenu.hide();
	}
	if (activeitem != null) {
		menu.selection(0, activeitem);
	}

}

//;
//
// if (debug) {
//
// 	card = new UI.Card({
//   	title: 'Rain Alert',
// 		color: "black",
// 		backgroundColor: "white",
// 		style: "small",
// 		status: false,
// 		scrollable: true,
// 		body: 'Start'
//
// 	});
//
// 	card.show();
//
// } else {
//
// 	card = new UI.Card({
// 		title: 'Rain Alert - Powered by DarkSky',
// 		//color: "white",
// 		//backgroundColor: "black",
// 		status: false,
// 		style: "small"
// 	});
//
// 	if (typeof darkSkyApiKey !== 'undefined' && darkSkyApiKey !== "") { //Should we actually check if full process of quiering the API works?
//
// 		card.body("👍 You're all set! Pins should start appearing in your timeline when it's going to rain or snow.");
//
// 	}	else {
//
// 		card.body("😞 You're not set up just yet! Check settings on your phone!");
//
// 	}
//
// 	card.show();
//
// }
//

Wakeup.launch(function(e) {

	debugLog("start");
	santiseSettings();

  if (e.wakeup || debug_force_wakeup_behaviour) {

    //We were started by a wakeup, sync weather
		//Create the holding screen
		renderSyncScreen();
		//Load the pin cache from localstorage
		loadPinCacheToMemory();
		//Get the location, and pass to getWeatherData()
		getLatLon(getWeatherData);

  } else {

		//The app was launched normally, show the basic settings screen
		renderAppMenu();

  }
});

Settings.config(
  { url: URL_settings },
  function(e) {
    console.log('closed configurable');

		if (menu != null) {
			renderAppMenu(menu,0);
		} else {
			renderAppMenu();
		}

    // Show the parsed response
    console.log(JSON.stringify(e.options));

    // Show the raw response if parsing failed
    if (e.failed) {
      console.log(e.response);
    }
  }
);
