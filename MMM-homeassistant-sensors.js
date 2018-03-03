'use strict';

Module.register("MMM-homeassistant-sensors", {
	result: {},
	defaults: {
		prettyName: true,
		stripName: true,
		title: 'Home Assistant',
		url: '',
		updateInterval: 3000,
		displaySymbol: true,
		values: []
	},
	
	getStyles: function() {
		return ["modules/MMM-homeassistant-sensors/MaterialDesign-Webfont-master/css/materialdesignicons.min.css"];
	},
	
	start: function() {
		this.getStats();
		this.scheduleUpdate();
	},
	isEmpty: function(obj) {
		for(var key in obj) {
			if(obj.hasOwnProperty(key)) {
				return false;
			}
		}
		return true;
	},
	getDom: function() {
		var wrapper = document.createElement("ticker");
		wrapper.className = 'dimmed small';
		var data = this.result;
		var statElement =  document.createElement("header");
		var title = this.config.title;
		statElement.innerHTML = title;
		wrapper.appendChild(statElement);
	   
		if (data && !this.isEmpty(data)) {
			var tableElement = document.createElement("table");
			var values = this.config.values;
			if (values.length > 0) {
				for (var i = 0; i < values.length; i++) {
					var symbol = values[i].symbol;
					var sensor = values[i].sensor;
					var val = this.getValue(data, sensor);
					var name = this.getName(data, sensor);
					var unit = this.getUnit(data, sensor);
					if (val) {
						tableElement.appendChild(this.addValue(name, val, unit, symbol));
					}
				}
			}
			else {
				for (var key in data) {
					if (data.hasOwnProperty(key)) {
						tableElement.appendChild(this.addValue(key, data[key], "", ""));
					}
				}
			}
			wrapper.appendChild(tableElement);
		} 
		else {
			var error = document.createElement("span");
			error.innerHTML = "Error fetching stats.";
			wrapper.appendChild(error);
		}
		return wrapper;
	},
	getValue: function(data, value) {
		for(var i=0; i<data.length;i++){
			if (data[i].entity_id == value){
				return data[i].state;
		   }
		}
		return null;
	},
	getUnit: function(data, value) {
		for(var i=0; i<data.length;i++){
			if (data[i].entity_id == value){
				if (typeof data[i].attributes.unit_of_measurement !== "undefined") {
					return data[i].attributes.unit_of_measurement;
				}
				return "";
		   }
		}
		return "";
	},
	getName: function(data, value) {
		for(var i=0; i<data.length;i++){
			if (data[i].entity_id == value){
				return data[i].attributes.friendly_name;
			}
		}
		return null;
	},
	addValue: function(name, value, unit, symbol) {
		var newrow, newText, newCell;
		newrow = document.createElement("tr");
		if (this.config.stripName) {
			var split = name.split(".");
			name = split[split.length - 1];
		}
		if (this.config.prettyName) {
			name = name.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
			name = name.split("_").join(" ");
			name = name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		}
		// Symbol
		newCell = newrow.insertCell(0);
		newCell.className = "align-left";		
		if (this.config.displaySymbol) {	
			if(typeof symbol === "string") {
				var symbolinline = document.createElement("i");
				symbolinline.className = "mdi mdi-"+symbol;
				newCell.appendChild(symbolinline);
			}
		}
		// Name
		newCell = newrow.insertCell(1);
		newText  = document.createTextNode(name);
		newCell.appendChild(newText);
		// Value
		newCell = newrow.insertCell(2);
		newCell.className = "align-right"
		newText  = document.createTextNode(value);
		newCell.appendChild(newText);
		// Unit
		newCell = newrow.insertCell(3);
		newCell.className = "align-left"
		newText  = document.createTextNode(unit);
		newCell.appendChild(newText);
		return newrow;
	},
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		var self = this;
		setInterval(function() {
			self.getStats();
		}, nextLoad);
		},
	getStats: function () {
		this.sendSocketNotification('GET_STATS', this.config.url);
	},
	socketNotificationReceived: function(notification, payload) {
		if (notification === "STATS_RESULT") {
			this.result = payload;
			var fade = 500;
			this.updateDom(fade);
		}
	},
});