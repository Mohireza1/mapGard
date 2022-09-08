'use strict';

// Query selectors
const form = document.querySelector('form');
const sidebarContainer = document.querySelector('.workout-container');

const inputName = document.querySelector('.form__input--name');

const inputType = document.querySelector('.form__input--type');
const typeOptions = [...inputType.querySelectorAll('option')].map(o => o.value);
const inputBlogging = document.querySelector('.form__input--blogging');
const bloggingOptions = [...inputBlogging.querySelectorAll('option')].map(
  o => o.value
);
const inputPrices = document.querySelector('.form__input--prices');
const pricesOptions = [...inputPrices.querySelectorAll('option')].map(
  o => o.value
);
const inputFood = document.querySelector('.form__input--food');
const foodOptions = [...inputFood.querySelectorAll('option')].map(o => o.value);
const inputSetting = document.querySelector('.form__input--setting');
const settingOptions = [...inputSetting.querySelectorAll('option')].map(
  o => o.value
);
const inputOverall = document.querySelector('.form__input--overall');
const overallOptions = [...inputOverall.querySelectorAll('option')].map(
  o => o.value
);

const labelType = document.querySelector('.label--type');
const labelBlogging = document.querySelector('.label--blogging');
const labelFood = document.querySelector('.label--food');
const labelPrices = document.querySelector('.label--prices');
const labelSettings = document.querySelector('.label--settings');
const labelOverall = document.querySelector('.label--overall');

const submitBtn = document.querySelector('.form__submit');

const cafeValue = document.querySelector('.overview__value--cafe');
const restaurantValue = document.querySelector('.overview__value--restaurant');
const culturalValue = document.querySelector('.overview__value--cultural');
const entertainmentValue = document.querySelector(
  '.overview__value--entertainment'
);

// App class
class App {
  // Private properties
  #map;

  #latlng;
  #lat;
  #lng;

  #tempMarker;

  #geocoder;
  #geolocationName;

  #workouts = [];

  #markers = [];

  #typeConvert = new Map([
    ['کافه', 'cafe'],
    ['رستوران', 'restaurant'],
    ['فرهنگی', 'cultural'],
    ['تفریحی', 'entertainment'],
  ]);

  #cafes = 0;
  #restaurants = 0;
  #culturals = 0;
  #entertainments = 0;

  // Private methods
  #defInputSet() {
    labelBlogging.classList.add('hidden');
    labelSettings.classList.add('hidden');
    labelFood.classList.remove('hidden');
    labelPrices.classList.remove('hidden');
  }

  #numberToPersian(number) {
    const persian = {
      0: '۰',
      1: '۱',
      2: '۲',
      3: '۳',
      4: '۴',
      5: '۵',
      6: '۶',
      7: '۷',
      8: '۸',
      9: '۹',
    };
    number = number.toString().split('');
    let persianNumber = '';
    for (let i = 0; i < number.length; i++) {
      number[i] = persian[number[i]];
    }
    for (let i = 0; i < number.length; i++) {
      persianNumber += number[i];
    }
    return persianNumber;
  }

  constructor() {
    this.#loadMap();
    this.#getLocation();
    this.#setOverviews();

    // Event Listeners

    // Clicking on map reverse geocodes the area and finds the closes location
    this.#map.on('click', e => {
      this.#setLatlng(e);
      this.#placeTempMarker();
      this.#showForm();
      this.#findAddress();
    });

    // Changes the input fields based on the type of the place
    inputType.addEventListener('change', () => {
      this.#changeInput();
    });

    // Submitting the form adds a marker on the map and adds an activity to the list
    form.addEventListener('submit', e => {
      e.preventDefault();
      this.#submit();
    });

    // A method to move to the position of the workout on the map when you click on the workout object in the list
    sidebarContainer.addEventListener('click', this.#goToWorkout.bind(this));
  }

  #setOverviews() {
    cafeValue.textContent = this.#numberToPersian(this.#cafes);
    restaurantValue.textContent = this.#numberToPersian(this.#restaurants);
    culturalValue.textContent = this.#numberToPersian(this.#culturals);
    entertainmentValue.textContent = this.#numberToPersian(
      this.#entertainments
    );
  }

  #loadMap() {
    // Adding tiles
    this.#map = L.map('map', { zoomControl: false }).setView(
      [35.63, 51.31],
      14
    );
    const arial = L.bingLayer(
      'AkuKk12sw8JGj6r4KSfojUVwp4RcoDhZE6w5JLctsXrJHtjMRx_qCoV58I5Qxshh',
      { imagerySet: 'AerialWithLabelsOnDemand', culture: 'fa' }
    ).addTo(this.#map);
    const base = L.tileLayer(
      'https://c.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
      {
        attribution: '© OpenStreetMap',
        maxzoom: 19,
      }
    ).addTo(this.#map);

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

    this.#geocoder = L.Control.OpenCageGeocoding.geocoder(geoOptions);

    const overlays = {};

    // Adding controls
    // Zoom control
    L.control.zoom({ position: 'bottomleft' }).addTo(this.#map);

    // Geocode search control
    L.control
      .geocoder('pk.eab8c32f328f737622e52b89f8c77c2c', {
        placeholder: 'جست و جو',
        focus: true,
      })
      .addTo(this.#map)
      .on('select', e => {
        inputName.value = e.feature.name;
      });

    // Layers control
    L.control.layers(baseLayers, overlays).addTo(this.#map);
  }

  #getLocation() {
    // Geolocation
    navigator.geolocation.getCurrentPosition(
      p => {
        const { latitude, longitude } = p.coords;
        this.#map.setView([latitude, longitude], 16);
      },
      () => {
        alert('موفق به دریافت مختصات شما نشدیم!');
      }
    );
  }

  #setLatlng(e) {
    // Set coords
    this.#latlng = e.latlng;
    this.#lat = this.#latlng.lat;
    this.#lng = this.#latlng.lng;
  }

  #placeTempMarker() {
    // Removes the temporary marker
    if (this.#tempMarker) {
      this.#map.removeLayer(this.#tempMarker);
    }
    // Creates a temporary marker
    this.#tempMarker = L.marker(this.#latlng).addTo(this.#map);
  }

  #showForm() {
    // Show form
    if (form.classList.contains('form--hidden')) {
      form.classList.remove('form--hidden');
    }
  }

  #findAddress() {
    // Reverse geocode
    const query = this.#lat.toString() + ',' + this.#lng.toString();
    this.#geocoder.geocode(
      query,
      function (results) {
        const r = results[0];
        this.#lat = r.center.lat;
        this.#lng = r.center.lng;
        this.#geolocationName = r.name.split(',')[0];
        inputName.value = this.#geolocationName;
        this.#defInputSet();
        inputName.focus();
      }.bind(this)
    );
  }

  #changeInput() {
    labelBlogging.classList.add('hidden');
    if (
      inputType.value === typeOptions[3] ||
      inputType.value === typeOptions[4]
    ) {
      labelFood.classList.add('hidden');
      labelPrices.classList.add('hidden');
      labelBlogging.classList.remove('hidden');
      labelSettings.classList.remove('hidden');
    } else {
      this.#defInputSet();
    }
  }

  #submit() {
    // Removes the temporary marker
    this.#map.removeLayer(this.#tempMarker);

    // Get data from the form
    const name = inputName.value;
    const type = inputType.value;
    const overall = inputOverall.value;

    let prices;
    let food;
    let setting;
    let blogging;
    let date;

    let workout;

    let markerId;

    if (type === 'کافه' || type === 'رستوران') {
      prices = inputPrices.value;
      food = +inputFood.value;
      console.log(food);

      if (!prices || !food) {
        return alert('لطفا تمام گزینه ها را مشخص کنید');
      }
    }

    if (type === 'فرهنگی' || type === 'تفریحی') {
      setting = +inputSetting.value;
      blogging = inputBlogging.value;
      console.log(setting, this.#numberToPersian(setting));

      if (!setting || !blogging) {
        return alert('لطفا تمام گزینه ها را مشخص کنید');
      }
    }

    if (!type) {
      return alert('لطفا نوع مکان را انتخاب کنید');
    }

    if (!overall) {
      return alert('لطفا امتیاز کلی خود را انتخاب کنید');
    }

    // Create a new object with the provided data
    switch (type) {
      case 'کافه':
        workout = new Cafe(name, this.#latlng, type, overall, food, prices);
        markerId = workout.name;
        date = workout.date;
        this.#workouts.push(workout);
        this.#cafes++;
        cafeValue.textContent = this.#numberToPersian(this.#cafes);
        break;
      case 'رستوران':
        workout = new Restaurant(
          name,
          this.#latlng,
          type,
          overall,
          food,
          prices
        );
        markerId = workout.name;
        date = workout.date;
        this.#workouts.push(workout);
        this.#restaurants++;
        restaurantValue.textContent = this.#numberToPersian(this.#restaurants);
        break;
      case 'فرهنگی':
        workout = new Cultural(
          name,
          this.#latlng,
          type,
          overall,
          setting,
          blogging
        );
        markerId = workout.name;
        date = workout.date;
        this.#workouts.push(workout);
        this.#culturals++;
        culturalValue.textContent = this.#numberToPersian(this.#culturals);
        break;
      case 'تفریحی':
        workout = new Entertainment(
          name,
          this.#latlng,
          type,
          overall,
          setting,
          blogging
        );
        markerId = workout.id;
        date = workout.date;
        this.#workouts.push(workout);
        this.#entertainments;
        entertainmentValue.textContent = this.#numberToPersian(
          this.#entertainments
        );
        break;
    }
    console.log(this.#workouts);

    // Add the marker to map with a customized popup window and the search coordinates
    let markerLat;
    let markerLng;

    // Checks if the reverse geocoded location is the desired one. If the user changes the name then the coordinates change to the initially selected coordinates.
    if (this.#geolocationName === inputName.value) {
      markerLat = this.#lat;
      markerLng = this.#lng;
      workout.coords = [this.#lat, this.#lng];
    } else {
      markerLat = this.#latlng.lat;
      markerLng = this.#latlng.lng;
    }

    // Add the marker
    const marker = L.marker([markerLat, markerLng]).bindPopup(
      `${workout.name}`,
      {
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `popup--${this.#typeConvert.get(type)}`,
      }
    );
    marker._id = markerId;
    this.#markers.push(marker);
    marker.addTo(this.#map).openPopup();
    console.log(this.#markers);

    // Render new workout on the list

    switch (type) {
      case 'کافه':
        const cafeWorkout = `          <div class="activity activity--cafe" data-id='${
          workout.id
        }'>
            <p class="activity__text">${name}</p>
            <div class="activity__details-container">
              <div class="activity__details">
                <div class="activity__icon">☕</div>
                <div class="activity__value">${this.#numberToPersian(
                  food
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">💵</div>
                <div class="activity__value">${prices}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">⭐</div>
                <div class="activity__value">${this.#numberToPersian(
                  overall
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📅</div>
                <div class="activity__value">${date}</div>
              </div>
            </div>
          </div>`;
        console.log(food);
        sidebarContainer.insertAdjacentHTML('afterbegin', cafeWorkout);
        break;
      case 'رستوران':
        const restaurantWorkout = `          <div class="activity activity--restaurant" data-id='${
          workout.id
        }'>
            <p class="activity__text">${name}</p>
            <div class="activity__details-container">
              <div class="activity__details">
                <div class="activity__icon">🍴</div>
                <div class="activity__value">${this.#numberToPersian(
                  food
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">💵</div>
                <div class="activity__value">${prices}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">⭐</div>
                <div class="activity__value">${this.#numberToPersian(
                  overall
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📅</div>
                <div class="activity__value">${date}</div>
              </div>
            </div>
          </div>`;

        console.log(food);
        sidebarContainer.insertAdjacentHTML('afterbegin', restaurantWorkout);
        break;
      case 'فرهنگی':
        const culturalWorkout = `          <div class="activity activity--cultural" data-id='${
          workout.id
        }'>
            <p class="activity__text">${name}</p>
            <div class="activity__details-container">
              <div class="activity__details">
                <div class="activity__icon">🏛</div>
                <div class="activity__value">${this.#numberToPersian(
                  setting
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📷</div>
                <div class="activity__value">${blogging}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">⭐</div>
                <div class="activity__value">${this.#numberToPersian(
                  overall
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📅</div>
                <div class="activity__value">${date}</div>
              </div>
            </div>
          </div>`;
        sidebarContainer.insertAdjacentHTML('afterbegin', culturalWorkout);
        break;
      case 'تفریحی':
        const entertainmentWorkout = `          <div class="activity activity--entertainment" data-id='${
          workout.id
        }'>
            <p class="activity__text">${name}</p>
            <div class="activity__details-container">
              <div class="activity__details">
                <div class="activity__icon">🎡</div>
                <div class="activity__value">${this.#numberToPersian(
                  setting
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📷</div>
                <div class="activity__value">${blogging}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">⭐</div>
                <div class="activity__value">${this.#numberToPersian(
                  overall
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📅</div>
                <div class="activity__value">${date}</div>
              </div>
            </div>
          </div>`;

        sidebarContainer.insertAdjacentHTML('afterbegin', entertainmentWorkout);
        break;
    }

    // Clear and hide the form

    form.classList.add('form--hidden');

    inputName.value = '';

    inputType.value = typeOptions[0];
    inputBlogging.value = bloggingOptions[0];
    inputPrices.value = pricesOptions[0];
    inputSetting.value = settingOptions[0];
    inputOverall.value = overallOptions[0];
    inputFood.value = foodOptions[0];
  }

  #goToWorkout(e) {
    const target = e.target.closest('.activity');

    if (!target) return;

    console.log(target);

    const currentWorkout = this.#workouts.find(
      workout => workout.id === target.dataset.id
    );
    console.log(currentWorkout);

    this.#map.setView(currentWorkout.coords);
  }
}

const app = new App();

// Workout classes

class Workout {
  // Date
  date = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    day: 'numeric',
    month: 'numeric',
  }).format();
  id = (Date.now() + '').slice(-10);

  constructor(name, coords, type, overall) {
    this.name = name;
    this.coords = coords;
    this.type = type;
    this.overall = overall;
  }
}

class Cafe extends Workout {
  constructor(name, coords, type, overall, food, prices) {
    super(name, coords, type, overall);
    this.food = food;
    this.prices = prices;
  }
}

class Restaurant extends Workout {
  constructor(name, coords, type, overall, food, prices) {
    super(name, coords, type, overall);
    this.food = food;
    this.prices = prices;
  }
}

class Cultural extends Workout {
  constructor(name, coords, type, overall, setting, blogging) {
    super(name, coords, type, overall);
    this.setting = setting;
    this.blogging = blogging;
  }
}

class Entertainment extends Workout {
  constructor(name, coords, type, overall, setting, blogging) {
    super(name, coords, type, overall);
    this.setting = setting;
    this.blogging = blogging;
  }
}

const cafe = new Cafe([24, 32], 'cafe', 5, 2, 'ارزان');
const restaurant = new Restaurant([24, 32], 'cafe', 5, 2, 'ارزان');
const cultural = new Cultural(
  [24, 32],
  'cafe',
  5,
  'کاملا مناسب',
  'کاملا مناسب'
);
const entertainment = new Entertainment(
  [24, 32],
  'cafe',
  5,
  'کاملا مناسب',
  'کاملا مناسب'
);
