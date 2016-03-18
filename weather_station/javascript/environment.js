'use strict'

/*  BLE Configuration Service
    deviceNameCharacteristicUUID - write/write without response - max 10 byte - ascii string
    advertisingParamCharacteristicUUID - write/write without response - 3 bytes - uint16_t adv interval in ms - uint8_t adv timeout in s
    appearanceCharacteristicUUID - write/write without response - 2 bytes - uint16_t appearance
    connectionParamCharacteristicUUID - write/write without response - 8 bytes - uint16_t min conn interval - uint16_t max conn interval - uint16_t slave latency - uint16_t supervision timeout
*/
var configurationServiceUUID = 'ef680001-9b35-4933-9b10-52ffa9740042';
var deviceNameCharacteristicUUID = 'ef680002-9b35-4933-9b10-52ffa9740042';
var advertisingParamCharacteristicUUID = 'ef680003-9b35-4933-9b10-52ffa9740042';
var appearanceCharacteristicUUID = 'ef680004-9b35-4933-9b10-52ffa9740042';
var connectionParamCharacteristicUUID = 'ef680005-9b35-4933-9b10-52ffa9740042';

/*  Weather Station Service
    temperatureCharacteristicUUID - notify/read - 2 bytes - uint8_t integer - uint8_t decimal
    pressureCharacteristicUUID - notify/read - 5 bytes - int32_t integer - uint8_t decimal
    humidityCharacteristicUUID - notify/read - 1 byte - uint8_t
    configurationCharacteristicUUID - write/write without response - 7 bytes - uint16_t temp interval in ms - uint16_t pressure interval in ms - uint16_t humidity interval in ms - uint8_t pressure mode (0=barometer, 1=altimeter)
*/
var weatherStationServiceUUID = '20080001-e36f-4648-91c6-9e86ead38764';
var temperatureCharacteristicUUID = '20080002-e36f-4648-91c6-9e86ead38764';
var pressureCharacteristicUUID = '20080003-e36f-4648-91c6-9e86ead38764';
var humidityCharacteristicUUID = '20080004-e36f-4648-91c6-9e86ead38764';
var gasCharacteristicUUID = '20080005-e36f-4648-91c6-9e86ead38764';
var colorCharacteristicUUID = '20080006-e36f-4648-91c6-9e86ead38764';
var configurationCharacteristicUUID = '20080007-e36f-4648-91c6-9e86ead38764';

/*  User Interface Service
    ledCharacteristicUUID - write/read - 4 bytes - uint32_t - LED ID - Red - Green - Blue (LSB)
    buttonCharacteristicUUID - write/read - 2 bytes - uint16_t - Button 2 state - Button 1 state (LSB)
*/
var userInterfaceServiceUUID = 'C7AE0001-3266-4A5C-859F-0F4799146BB5';
var ledCharacteristicUUID = 'C7AE0002-3266-4A5C-859F-0F4799146BB5';
var buttonCharacteristicUUID = 'C7AE0003-3266-4A5C-859F-0F4799146BB5';

var bleDevice;
var bleServer;
var bleService;
var tempBleService;
var gasChar;
var temperatureChar;
var pressureChar;
var humidityChar;
var colorChar;

window.onload = function(){
  document.querySelector('#connect').addEventListener('click', getAll);
  document.querySelector('#disconnect').addEventListener('click', stopAll);
};

function log(text) {
    document.querySelector('#log').textContent += text + '\n';
    console.log(text);
}

function getAll() {
  if (!navigator.bluetooth) {
      log('Web Bluetooth API is not available.\n' +
          'Please make sure the Web Bluetooth flag is enabled.');
      return;
  }
  log('Requesting Bluetooth Device...');
  navigator.bluetooth.requestDevice({filters: [
    {services: [configurationServiceUUID]},
    {services: [weatherStationServiceUUID]}
    ]
  })
  .then(device => device.connectGATT())
  .then(server => {
    bleServer = server;
    log('Got bleServer');
    return server.getPrimaryService(weatherStationServiceUUID);
  })
  .then(service => {
    log('Got bleService');
    bleService = service;
    return Promise.all([
      service.getCharacteristic(temperatureCharacteristicUUID)
      .then(handleTemperature),
      service.getCharacteristic(humidityCharacteristicUUID)
      .then(handleHumidity),
      service.getCharacteristic(pressureCharacteristicUUID)
      .then(handlePressure),
      service.getCharacteristic(gasCharacteristicUUID)
      .then(handleGas),
      service.getCharacteristic(colorCharacteristicUUID)
      .then(handleColor)
    ])
  })
  .catch(error => {
    log('> getAll() ' + error);
  });
}

function handlePressure(characteristic){
  log('> handlePressure()');
  pressureChar = characteristic;
  //characteristic.addEventListener('characteristicvaluechanged',handleNotifyPressure);
  //return characteristic.startNotifications();
}

function handleTemperature(characteristic){
  log('> handleTemperature()');
  temperatureChar = characteristic;
  //temperatureChar.addEventListener('characteristicvaluechanged',handleNotifyTemperature);
  //return temperatureChar.startNotifications();
}

function handleHumidity(characteristic){
  log('> handleHumidity()');
  humidityChar = characteristic;
  //characteristic.addEventListener('characteristicvaluechanged',handleNotifyHumidity);
  //return characteristic.startNotifications();
}

function handleGas(characteristic){
  log('> handleGas()');
  gasChar = characteristic;
  //gasChar.addEventListener('characteristicvaluechanged',handleNotifyGas);
  //return gasChar.startNotifications();
}

function handleColor(characteristic){
  log('> handleColor()');
  colorChar = characteristic;
  colorChar.addEventListener('characteristicvaluechanged',handleNotifyColor);
  return colorChar.startNotifications();
}

function stopAll() {
    log('> stopAll()')
    gasChar.stopNotifications().then(() => {
        log('> Gas notification stopped');
        gasChar.removeEventListener('characteristicvaluechanged',handleNotifyGas)
        log('> Gas notification handler removed');
    })
    .then(disconnect)
    .catch(error => {
      log('> stopAll() ' + error);
    });
    disconnect();
}

function disconnect() {
    log('Disconnecting from Bluetooth Device...');
    if (bleServer.connected)
    {
      bleServer.disconnect();
      log('Bluetooth Device connected: ' + bleServer.connected);
    }
    else
    {
      log('Bluetooth Device is already disconnected');
    }
}

function handleNotifyColor(event) {
  let value = event.target.value;
  value = value.buffer ? value : new DataView(value);

  let r = (value.getUint8(1) << 8) + value.getUint8(0) ;
  //log('red: ' + red);
  let g = (value.getUint8(3) << 8) + value.getUint8(2) ;
  //log('green: ' + green);
  let b = (value.getUint8(5) << 8) + value.getUint8(4) ;
  //log('blue: ' + blue);
  let c = (value.getUint8(7) << 8) + value.getUint8(6) ;
  //log('clear: ' + clear);
  
  let r_ratio = r / (r+g+b)
  let g_ratio = g / (r+g+b)
  let b_ratio = b / (r+g+b)
  
  let r_8 = r_ratio * 256.0
  let g_8 = g_ratio * 256.0
  let b_8 = b_ratio * 256.0
  let rgb_str = "rgb("+r_8.toFixed(0)+","+g_8.toFixed(0)+","+b_8.toFixed(0)+")";
  log('r ' + r_8 + ' - g ' + g_8 + ' - b ' + b_8 + ' - ' + rgb_str);

  document.getElementById("rgbc_reading").style.color = rgb_str;
  document.getElementById("rgbc_reading").innerHTML = 'RGBC';
}

function handleNotifyGas(event) {
  let value = event.target.value;
  value = value.buffer ? value : new DataView(value);
  let eco2_ppm = (value.getUint8(1) << 8) + value.getUint8(0) ;
  log('eCO2 is ' + eco2_ppm + 'ppm');
  document.getElementById("eco2_reading").innerHTML = eco2_ppm + 'ppm';

  let tvoc_ppb = (value.getUint8(3) << 8) + value.getUint8(2);
  log('TVOC is ' + tvoc_ppb + 'ppb');
  document.getElementById("tvoc_reading").innerHTML = tvoc_ppb + 'ppb';
}

function handleNotifyTemperature(event) {
  let value = event.target.value;
  value = value.buffer ? value : new DataView(value);
  let temperature_int = value.getUint8(0);
  let temperature_dec = value.getUint8(1);
  log('Temperature is ' + temperature_int + '.' + temperature_dec + 'C');
  //document.getElementById("temperature_reading").innerHTML = temperature_int + '.' + temperature_dec + '&deg;C';
}

function handleNotifyHumidity(event) {
  let value = event.target.value;
  value = value.buffer ? value : new DataView(value);
  let humidity_int = value.getUint8(0);
  log('Humidity is ' + humidity_int + '%');
  //document.getElementById("humidity_reading").innerHTML = humidity_int +"%";
}

function handleNotifyPressure(event) {
  let value = event.target.value;
  value = value.buffer ? value : new DataView(value);
  let pressure_integer = value.getInt32(0, true);
  let pressure_decimal = value.getUint8(4);
  let pressure_pascal = pressure_integer + pressure_decimal / 1000;
  let pressure_hpascal = pressure_pascal / 100;
  log('Pressure is ' + pressure_hpascal + 'hPa');
  //document.getElementById("pressure_reading").innerHTML = pressure_hpascal.toFixed(3) + 'hPa';
}
