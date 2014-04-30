// ------------------------------------------
//  SETUP
// ------------------------------------------

var lx = false;
exports.init = function(SARAH){
  
  if (lx) return;
  
  var lifx = require('./lib');
  lifx.setDebug(false);
  
  lx = lifx.init();
  lx.on('bulbstate', function(b) {
    //console.log('Bulb state: ' + util.inspect(b));
  });
  
  lx.on('bulbonoff', function(b) {
    //console.log('Bulb on/off: ' + util.inspect(b));
  });
  
  lx.on('bulb', function(b) {
    console.log('New bulb found: ' + b.name);
  });
  
  lx.on('gateway', function(g) {
    console.log('New gateway found: ' + g.ipAddress.ip);
  });

  lx.on('packet', function(p) {
    // Show informational packets
    switch (p.packetTypeShortName) {
      case 'powerState':
      case 'wifiInfo':
      case 'wifiFirmwareState':
      case 'wifiState':
      case 'accessPoint':
      case 'bulbLabel':
      case 'tags':
      case 'tagLabels':
      //case 'lightStatus':
      case 'timeState':
      case 'resetSwitchState':
      case 'meshInfo':
      case 'meshFirmware':
      case 'versionState':
      case 'infoState':
      case 'mcuRailVoltage':
        console.log(p.packetTypeName + " - " + p.preamble.bulbAddress.toString('hex') + " - " + util.inspect(p.payload));
        break;
    }
  });
}

// ------------------------------------------
//  COLOR ALGORITHM
// ------------------------------------------

function hexStringToRgb(s) {
    return {
        r: parseInt(s.substring(0, 2), 16) / 255,
        g: parseInt(s.substring(2, 4), 16) / 255,
        b: parseInt(s.substring(4, 6), 16) / 255
    };
}

var rgbToHsl = function(r, g, b){
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = s = 0; // achromatic
  } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
  }
  return [h, s, l];
}

// ------------------------------------------
//  INTERFACE
// ------------------------------------------

var util = require('util');
var packet = require('./lib/packet');
var cycledColour = 0;
exports.action = function(data, callback, config, SARAH){
  
  var config = config.modules.lifx;
  if (false){
    return callback('tts', 'Configuration LIFX invalide');
  }
console.log(data);
  // Switch On / Off
console.log(data.bulbname);
if (typeof data.bulbname ==  "") {
	if (data.on == "true" ){
		console.log("Lights on");
		lx.lightsOn(); 
	} else if (data.on == "false"){ 
		console.log("Lights off");
		lx.lightsOff();  
	}
}
else
{
	if (data.on == "true" && data.bulbname){
		lx.lightsOn(lx.getBulbidByName(data.bulbname));
		console.log("Light on: "+data.bulbname);
	} else if (data.on == "false" && data.bulbname){
		lx.lightsOff(lx.getBulbidByName(data.bulbname));
		console.log("Lights off: "+data.bulbname);
	}
		
};
  // Dim Color: hue, sat, lum, whitecol, timing, (bulb)
  // Color: FFFFFF
  // Timing => optionnal 
  
  if (data.rgb && data.bulbname) {
    console.log("Bulb :" +data.bulbname+ " - Dim "+data.rgb+ " - Timing : "+data.timing+" s" );

    var rgb = hexStringToRgb(data.rgb);
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    console.log(rgb,' => ',hsl);
    
    data.hue = Math.round(hsl[0] * 65535);
    data.sat = Math.round(hsl[1] * 65535);
    data.bri = Math.round(hsl[2] * 65535);
    data.bri = Math.round(data.bri / 260 * 65535);
    
    var hue = '0x'+data.hue.toString(16);
    var sat = '0x'+data.sat.toString(16);
    var lum = '0x'+data.bri.toString(16);
    
    if (data.timing) {
	// TO DO => relation timing vs second ???
	var timing = data.timing * 2083332;
     } else {
	var timing = 0;
	}
    
	lx.lightsColour(hue, sat, lum, 0, timing, lx.getBulbidByName(data.bulbname));
  }
  
   // Reboot bulb
    if (data.reboot == "true" && data.bulbname) {
	lx.RebootBulb(lx.getBulbidByName(data.bulbname));
  };
  
  // Get Bulb FW Version
    if (data.fw_version && data.bulbname) {
	var fw = lx.BulbFirmware(lx.getBulbidByName(data.bulbname));
	console.log(fw);
	};
  
  return callback({}); 
  
  /*
  if (data.rgb == "red"){
    console.log("Dim red");
    lx.lightsColour(0x0000, 0xffff, 1000, 0, 0);
  }
  else if (data.rgb == "purple"){
    console.log("Dim purple");
  lx.lightsColour(0xcc15, 0xffff, 500, 0, 0);
  }
  else if (data.rgb == "white"){
    console.log("Dim purple");
    lx.lightsColour(0x0000, 0x0000, 0x8000, 0x0af0, 0x0513);
  }
  else if (data.rgb == "cycle"){
    cycledColour = (cycledColour+100) & 0xffff; console.log("Colour value is " + cycledColour);
    lx.lightsColour(cycledColour, 0xffff, 0x0200, 0x0000, 0x0000);
  }
  
  cycledColour = (cycledColour-100) & 0xffff; console.log("Colour value is " + cycledColour);
  lx.lightsColour(cycledColour, 0xffff, 0x0200, 0x0000, 0x0000);
  
  console.log("Enabling debug");
  lifx.setDebug(true);
  
  console.log("Requesting voltage");
  var message = packet.getMcuRailVoltage();
  lx.sendToAll(message);
  
  console.log("Requesting power state");
  var message = packet.getPowerState();
  lx.sendToAll(message);
  
  console.log("Requesting wifi info");
  var message = packet.getWifiInfo();
  lx.sendToAll(message);
  
  console.log("Requesting wifi firmware state");
  var message = packet.getWifiFirmwareState();
  lx.sendToAll(message);
  
  console.log("Requesting wifi state");
  var message = packet.getWifiState({'interface':2});
  lx.sendToAll(message);
  
  console.log("Requesting bulb label");
  var message = packet.getBulbLabel();
  lx.sendToAll(message);
  
  console.log("Requesting tags");
  var message = packet.getTags();
  lx.sendToAll(message);
  
  console.log("Requesting tag label for tag 1");
  var message = packet.getTagLabels({tags:new Buffer([1,0,0,0,0,0,0,0])});
  lx.sendToAll(message);
  
  console.log("Requesting time");
  var message = packet.getTime();
  lx.sendToAll(message);
  
  console.log("Requesting info");
  var message = packet.getInfo();
  lx.sendToAll(message);
  
  console.log("Requesting reset switch state");
  var message = packet.getResetSwitchState();
  lx.sendToAll(message);
  
  console.log("Requesting mesh info");
  var message = packet.getMeshInfo();
  lx.sendToAll(message);
  
  console.log("Requesting mesh firmware");
  var message = packet.getMeshFirmware();
  lx.sendToAll(message);
  */
}
