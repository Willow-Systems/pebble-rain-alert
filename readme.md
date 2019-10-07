# Rain Alert
Creates timeline pins just as the rain is about to pour

![](https://img.shields.io/badge/Release_Status-No_preview-cc4444.svg)

## About
Rain alert runs once an hour and checks the rain for the rest of the day. If it's due to rain later Rain Alert will create a timeline pin at that point

## Pre-Alpha implementation checklist

- [x] Get location of pebble
- [x] Get weather information from darkSkyApi
- [x] Parse weather to work out when pins are needed
- [x] Create a wakeup event an hour later to check again
- [ ] Actually create the timeline pin (This will be done last to avoid spamming pins)
- [ ] Programatically create the timeline pin id per-user (based on pebble serial and time)
- [ ] Make the UI nicer
- [ ] Implement settings page (for API Key and location override)
- [ ] Only run the weather-pin-check when the app is started from a wakeup event
- [ ] Add toggle when the app is opened from the app menu

## Authors

Idea by @Wowfunhappy
Code by @Wowfunhappy & @Will0
