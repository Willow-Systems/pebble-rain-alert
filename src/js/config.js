module.exports = [
	{ 
		"type": "section", 
		"items": [
			{
				"type": "input",
				"label": "Dark Sky API Key:",
				"appKey": "darkSkyApiKey"
			},
			/*{
				"type": "slider",
				"appKey": "refreshFrequency",
				"defaultValue": "30",
				"min": 15,
				"max": 60,
				"step": 5,
				"label": "Refresh Frequency",
				"description": "How often to check for updated weather information (in minutes). Lower numbers might result in slightly more up-to-date timeline information, at the cost of battery usage." //Is there a susinct, user-friendly way to explain that Darksky only updates once per hour, but _when_ in that hour is unpredictable?
			},*/
			{
				"type": "submit",
				"defaultValue": "Save"
			},

		]
	}, {
		//This is legally required.
		"type": "text",
		"defaultValue": "<a href='https://darksky.net/poweredby/' style='text-decoration: none; float: right; margin-right:4px;'>Powered by Dark Sky</a>"
	}
]