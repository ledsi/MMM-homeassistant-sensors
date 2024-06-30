"use strict";

Module.register("MMM-homeassistant-sensors", {
  result: {},
  defaults: {
    prettyName: true,
    stripName: true,
    title: "Home Assistant",
    host: "hassio.local",
    port: "8321",
    https: false,
    token: "",
    apipassword: "",
    updateInterval: 1 * 60 * 1000,
    displaySymbol: true,
    debuglogging: false,
    values: [],
  },

  getStyles: function() {
    return [
      "modules/MMM-homeassistant-sensors/MaterialDesign-Webfont-master/css/materialdesignicons.min.css",
      "modules/MMM-homeassistant-sensors/hassio.css"
    ];
  },

  start: function() {
    this.getStats();
    this.scheduleUpdate();
  },
  isEmpty: function(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  },
  getDom: function() {
    var wrapper = document.createElement("ticker");
    wrapper.className = "dimmed small";
    var data = this.result;
    var statElement = document.createElement("header");
    var title = this.config.title;
    statElement.innerHTML = title;
    wrapper.appendChild(statElement);

    if (data && !this.isEmpty(data)) {
      var tableElement = document.createElement("table");
      var values = this.config.values;
      if (values.length > 0) {
        for (var i = 0; i < values.length; i++) {
          var icons = values[i]?.icons?.length ? values[i].icons[0] : [];
          var labels = values[i]?.labels?.length ? values[i].labels[0] : [];
          var sensor = values[i].sensor;
          var attributes = values[i].attributes;
          var val = this.getValue(data, sensor, attributes);
          var name = this.getName(data, values[i]);
          var unit = this.getUnit(data, sensor);
          var climatePreset = this.getPreset(data, sensor, attributes);
          var alertThreshold = values[i].alertThreshold;
          if(sensor.startsWith('climate.'))  {
            unit = '°C';
          }
          
          if (val) {
            tableElement.appendChild(
              this.addValue(name, val, unit, icons, labels, climatePreset, alertThreshold)
            );
          }
        }
      } else {
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            tableElement.appendChild(
              this.addValue(key, data[key], "", "", false)
            );
          }
        }
      }
      wrapper.appendChild(tableElement);
    } else {
      var error = document.createElement("span");
      error.innerHTML = "Error fetching stats.";
      wrapper.appendChild(error);
    }
    return wrapper;
  },
  getValue: function(data, value, attributes=[]) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].entity_id == value) {
        if( value.startsWith('climate.') ) {
          // console.warn(value);
          // console.warn(data[i]);
          return String(data[i].attributes.current_temperature);
        }
        if(attributes.length==0) {
          return data[i].state;
        }
        var returnString = ' | ';
        for(var j=0; j<attributes.length; j++) {
          if(attributes[j] == 'state') {
            returnString += data[i].state + ' | ';
          } else {
            if(data[i]['attributes'][attributes[j]] !== undefined) {
              returnString += data[i]['attributes'][attributes[j]] + ' | ';
            }
          }
        }
        return returnString.slice(0, -3);
      }
    }
    return null;
  },
  getPreset: function(data, value, attributes=[]) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].entity_id == value) {
        if( value.startsWith('climate.') ) {
          // console.warn("preset_mode",data[i].attributes.preset_mode);
          return String(data[i].attributes.preset_mode);
        }
      }
    }
    return null;
  },
  getUnit: function(data, value) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].entity_id == value) {
        if (typeof data[i].attributes.unit_of_measurement !== "undefined") {
          return data[i].attributes.unit_of_measurement;
        }
        return "";
      }
    }
    return "";
  },
  getName: function(data, value) {
    //use the name from config if set
    if (value.name && value.name !== "")
      return value.name;

    //find the sensor by entity_id and get it's friendly_name
    for (var i = 0; i < data.length; i++) {
      if (data[i].entity_id === value.sensor) {
        return data[i].attributes.friendly_name;
      }
    }
    return null;
  },
  addValue: function(name, value, unit, icons, labels, climatePreset, alertThreshold) {
    var newrow, newText, newCell;
    newrow = document.createElement("tr");
    newrow.className =  "value-" + value.toLowerCase() + " " + (climatePreset ? "climate-" + climatePreset : "");
    if (!isNaN(alertThreshold)) {
      console.log("alertThreshold is a number");
      if (alertThreshold < value) {
        console.log("Threshold exceeded - blink it");
        newrow.className += "blink";
      }
    }
    if (this.config.stripName) {
      var split = name.split(".");
      name = split[split.length - 1];
    }
    if (this.config.prettyName) {
      name = name.replace(/([A-Z])/g, function($1) {
        return "_" + $1.toLowerCase();
      });
      name = name.split("_").join(" ");
      name = name.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    }
    // icons
    newCell = newrow.insertCell(0);
    newCell.className = "align-left";
    if (this.config.displaySymbol) {
      if (typeof icons === "object") {
        var iconsinline;
        //Change icons based on HA status
        if (value == "on" && typeof icons.state_on === "string") {
          iconsinline = document.createElement("i");
          iconsinline.className = "mdi mdi-" + icons.state_on;
          newCell.appendChild(iconsinline);
        } else if (value == "off" && typeof icons.state_off === "string") {
          iconsinline = document.createElement("i");
          iconsinline.className = "mdi mdi-" + icons.state_off;
          newCell.appendChild(iconsinline);
        } else if (value == "open" && typeof icons.state_open === "string") {
          iconsinline = document.createElement("i");
          iconsinline.className = "mdi mdi-" + icons.state_open;
          newCell.appendChild(iconsinline);
        } else if (value == "unavailable" && typeof icons.state_unavailable === "string") {
          iconsinline = document.createElement("i");
          iconsinline.className = "mdi mdi-" + icons.state_unavailable;
          newCell.appendChild(iconsinline);
        } else if ( value == "closed" && typeof icons.state_closed === "string" ) {
          iconsinline = document.createElement("i");
          iconsinline.className = "mdi mdi-" + icons.state_closed;
          newCell.appendChild(iconsinline);
        } else {
          if (typeof icons.default === "string") {
            iconsinline = document.createElement("i");
            iconsinline.className = "mdi mdi-" + icons.default;
            newCell.appendChild(iconsinline);
          }
        }
      }
    }
    // Name
    newCell = newrow.insertCell(1);
    newText = document.createTextNode(name);
    newCell.appendChild(newText);
    // Value
    newCell = newrow.insertCell(2);
    newCell.className = "align-right value-" + value.toLowerCase();

    // overwrite labels
    var label = value;
    if (typeof labels === "object") {
      if (value == "on" && typeof labels.state_on === "string") {
        label = labels.state_on;
      } 
      else if (value == "off" && typeof labels.state_off === "string") {
        label = labels.state_off;
      }
      else if (value == "open" && typeof labels.state_open === "string") {
        label = labels.state_open;
      }
      else if (value == "closed" && typeof labels.state_closed === "string") {
        label = labels.state_closed;
      }
      else if (value == "unavailable" && typeof labels.state_unavailable === "string") {
        label = labels.state_unavailable;
      }
    }
    newText = document.createTextNode(label);
    // newText = document.createTextNode(value != "unavailable" ? value : "");
    newCell.appendChild(newText);
    // Unit
    newCell = newrow.insertCell(3);
    newCell.className = "align-left";
    newText = document.createTextNode(unit);
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
  getStats: function() {
    this.sendSocketNotification("GET_STATS", this.config);
  },
  socketNotificationReceived: function(notification, payload) {
    if (notification === "STATS_RESULT") {
      this.result = payload;
      var fade = 500;
      this.updateDom(fade);
    }
  }
});
