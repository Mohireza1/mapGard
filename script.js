'use strict';

// Months array
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Query selectors
const form = document.querySelector('form');
const sidebarContainer = document.querySelector('.sidebar__container');

const inputName = document.querySelector('.form__input--name');
const inputType = document.querySelector('.form__input--type');
const inputBlogging = document.querySelector('.form__input--blogging');
const inputPrices = document.querySelector('.form__input--prices');
const inputSetting = document.querySelector('.form__input--setting');
const inputOverall = document.querySelector('.form__input--overall');

const submitBtn = document.querySelector('.form__submit');

// Leaflet
let geolocationName;
let latlng;
let lat;
let lng;

// Adding tiles
const map = L.map('map', { zoomControl: false }).setView([35.63, 51.31], 14);
const arial = L.bingLayer(
  'AkuKk12sw8JGj6r4KSfojUVwp4RcoDhZE6w5JLctsXrJHtjMRx_qCoV58I5Qxshh',
  { imagerySet: 'AerialWithLabelsOnDemand', culture: 'fa' }
).addTo(map);
const base = L.tileLayer(
  'https://c.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
  {
    attribution: '© OpenStreetMap',
    maxzoom: 19,
  }
).addTo(map);

const baseLayers = {
  Arial: arial,
  Base: base,
};

// Reverse geocoding
const geoOptions = {
  key: 'd58885eb469142e8916e0a40dffaf281',
  limit: 10,
  // proximity: '51.52255, -0.10249', // favour results near here
};

const geocoder = L.Control.OpenCageGeocoding.geocoder(geoOptions);

const overlays = {};

// Adding controls
// Zoom control
L.control.zoom({ position: 'bottomleft' }).addTo(map);

// Geocode search control
L.control
  .geocoder('pk.eab8c32f328f737622e52b89f8c77c2c', {
    placeholder: 'جست و جو',
    focus: true,
  })
  .addTo(map)
  .on('select', e => {
    inputName.value = e.feature.name;
  });

// Layers control
L.control.layers(baseLayers, overlays).addTo(map);

// Geolocation
navigator.geolocation.getCurrentPosition(
  p => {
    // const { latitude, longitude } = p.coords;
    // map.setView([latitude, longitude], 16);
  },
  () => {
    alert('موفق به دریافت مختصات شما نشدیم!');
  }
);

// Event Listeners

// Click on map reverse geocodes the area and finds the closes location
map.on('click', e => {
  // Set coords
  latlng = e.latlng;
  lat = latlng.lat;
  lng = latlng.lng;

  // Form stuff
  if (form.classList.contains('form--hidden')) {
    form.classList.remove('form--hidden');
  }
  // Reverse geocode
  const query = lat.toString() + ',' + lng.toString();
  geocoder.geocode(query, function (results) {
    const r = results[0];
    lat = r.center.lat;
    lng = r.center.lng;
    geolocationName = r.name.split(',')[0];
    inputName.value = geolocationName;
    inputName.focus();
  });
});

// Submitting the form adds a marker on the map and adds an activity to the list
form.addEventListener('submit', e => {
  e.preventDefault();
  // Add the marker to map with a customized popup window and the search coordinates
  const marker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
      })
    );
});
