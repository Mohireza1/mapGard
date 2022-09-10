'use strict';

// Query selectors
const form = document.querySelector('form');
const sidebarContainer = document.querySelector('.workout-container');

const listContainer = document.querySelector('.sidebar__container--rtl');

const formClose = document.querySelector('.form__close');

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

    // Get stuff from local storage
    const data = JSON.parse(localStorage.getItem('workouts'));
    data.forEach(workout => {
      this.#renderWorkout(workout);
      this.#renderMarker(workout);
    });

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

    // Close the form when the user clicks on the close form button
    formClose.addEventListener('click', this.#closeForm.bind(this));

    // Delete form when the button is clicked
    listContainer.addEventListener('click', this.#removeActivity.bind(this));
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
        attribution: '© OpenStreetMap, © 2022 Mohireza',
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

  // Clear and hide the form and the temporary marker
  #closeForm() {
    form.classList.add('form--hidden');

    inputName.value = '';

    inputType.value = typeOptions[0];
    inputBlogging.value = bloggingOptions[0];
    inputPrices.value = pricesOptions[0];
    inputSetting.value = settingOptions[0];
    inputOverall.value = overallOptions[0];
    inputFood.value = foodOptions[0];

    if (this.#tempMarker) {
      this.#map.removeLayer(this.#tempMarker);
    }
  }

  #renderWorkout(workout) {
    switch (workout.type) {
      case 'کافه':
        const cafeWorkout = `          <div class="activity activity--cafe" data-id='${
          workout.id
        }'>
        <button class="activity__remove">✕</button>
            <p class="activity__text">${workout.name}</p>
            <div class="activity__details-container">
              <div class="activity__details">
                <div class="activity__icon">☕</div>
                <div class="activity__value">${this.#numberToPersian(
                  workout.food
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">💵</div>
                <div class="activity__value">${workout.prices}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">⭐</div>
                <div class="activity__value">${this.#numberToPersian(
                  workout.overall
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📅</div>
                <div class="activity__value">${workout.date}</div>
              </div>
            </div>
          </div>`;
        sidebarContainer.insertAdjacentHTML('afterbegin', cafeWorkout);
        this.#workouts.push(workout);
        this.#cafes++;
        cafeValue.textContent = this.#numberToPersian(this.#cafes);
        break;
      case 'رستوران':
        const restaurantWorkout = `          <div class="activity activity--restaurant" data-id='${
          workout.id
        }'>
        <button class="activity__remove">✕</button>
            <p class="activity__text">${workout.name}</p>
            <div class="activity__details-container">
              <div class="activity__details">
                <div class="activity__icon">🍴</div>
                <div class="activity__value">${this.#numberToPersian(
                  workout.food
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">💵</div>
                <div class="activity__value">${workout.prices}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">⭐</div>
                <div class="activity__value">${this.#numberToPersian(
                  workout.overall
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📅</div>
                <div class="activity__value">${workout.date}</div>
              </div>
            </div>
          </div>`;

        sidebarContainer.insertAdjacentHTML('afterbegin', restaurantWorkout);
        this.#workouts.push(workout);
        this.#restaurants++;
        restaurantValue.textContent = this.#numberToPersian(this.#restaurants);
        break;
      case 'فرهنگی':
        const culturalWorkout = `          <div class="activity activity--cultural" data-id='${
          workout.id
        }'>
        <button class="activity__remove">✕</button>
            <p class="activity__text">${workout.name}</p>
            <div class="activity__details-container">
              <div class="activity__details">
                <div class="activity__icon">🏛</div>
                <div class="activity__value">${this.#numberToPersian(
                  workout.setting
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📷</div>
                <div class="activity__value">${workout.blogging}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">⭐</div>
                <div class="activity__value">${this.#numberToPersian(
                  workout.overall
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📅</div>
                <div class="activity__value">${workout.date}</div>
              </div>
            </div>
          </div>`;
        sidebarContainer.insertAdjacentHTML('afterbegin', culturalWorkout);
        this.#workouts.push(workout);
        this.#culturals++;
        culturalValue.textContent = this.#numberToPersian(this.#culturals);
        break;
      case 'تفریحی':
        const entertainmentWorkout = `          <div class="activity activity--entertainment" data-id='${
          workout.id
        }'>
        <button class="activity__remove">✕</button>
            <p class="activity__text">${workout.name}</p>
            <div class="activity__details-container">
              <div class="activity__details">
                <div class="activity__icon">🎡</div>
                <div class="activity__value">${this.#numberToPersian(
                  workout.setting
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📷</div>
                <div class="activity__value">${workout.blogging}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">⭐</div>
                <div class="activity__value">${this.#numberToPersian(
                  workout.overall
                )}</div>
              </div>
              <div class="activity__details">
                <div class="activity__icon">📅</div>
                <div class="activity__value">${workout.date}</div>
              </div>
            </div>
          </div>`;

        sidebarContainer.insertAdjacentHTML('afterbegin', entertainmentWorkout);
        this.#workouts.push(workout);
        this.#entertainments++;
        entertainmentValue.textContent = this.#numberToPersian(
          this.#entertainments
        );
        break;
    }
  }

  #renderMarker(workout) {
    // Add the marker
    const marker = L.marker(workout.coords).bindPopup(`${workout.name}`, {
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: `popup--${this.#typeConvert.get(workout.type)}`,
    });
    marker._workoutKey = workout.id;
    this.#markers.push(marker);
    marker.addTo(this.#map).openPopup();
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

    let workout;

    if (type === 'کافه' || type === 'رستوران') {
      prices = inputPrices.value;
      food = +inputFood.value;

      if (!prices || !food) {
        return alert('لطفا تمام گزینه ها را مشخص کنید');
      }
    }

    if (type === 'فرهنگی' || type === 'تفریحی') {
      setting = +inputSetting.value;
      blogging = inputBlogging.value;

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
        break;
    }

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
    marker._workoutKey = workout.id;
    this.#markers.push(marker);
    marker.addTo(this.#map).openPopup();

    // Render new workout on the list
    this.#renderWorkout(workout);

    // Clear and hide the form
    this.#closeForm();

    // Local storage
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #goToWorkout(e) {
    if (e.target === document.querySelector('.activity__remove')) return;

    const target = e.target.closest('.activity');

    if (!target) return;

    const currentWorkout = this.#workouts.find(
      workout => workout.id === target.dataset.id
    );

    this.#map.setView(currentWorkout.coords);
  }

  #removeActivity(e) {
    const target = e.target.closest('.activity__remove');

    if (!target) return;

    // Get the activity and its data-id
    const parent = e.target.closest('.activity');
    const id = parent.dataset.id;

    // Find the object
    let object;
    let index;

    // Set the index and workout to the selected one
    this.#workouts.find((obj, i) => {
      if (obj.id === id) {
        object = obj;
        index = i;
      }
    });

    switch (object.type) {
      case 'کافه':
        this.#cafes--;
        cafeValue.textContent = this.#numberToPersian(this.#cafes);
        break;
      case 'رستوران':
        this.#restaurants--;
        restaurantValue.textContent = this.#numberToPersian(this.#restaurants);
        break;
      case 'فرهنگی':
        this.#culturals--;
        culturalValue.textContent = this.#numberToPersian(this.#culturals);
        break;
      case 'تفریحی':
        this.#entertainments--;
        entertainmentValue.textContent = this.#numberToPersian(
          this.#entertainments
        );
        break;
    }

    // Remove the workout from the list
    parent.remove();
    this.#workouts.splice(index, 1);

    // Remove the linked marker
    let selectedMarker = this.#markers.find(
      marker => marker._workoutKey === object.id
    );

    this.#map.removeLayer(selectedMarker);

    this.#markers.splice(this.#markers.indexOf(selectedMarker), 1);
    selectedMarker = null;
    // Local storage
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
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
  type = 'کافه';

  constructor(name, coords, type, overall, food, prices) {
    super(name, coords, type, overall);
    this.food = food;
    this.prices = prices;
  }
}

class Restaurant extends Workout {
  type = 'رستوران';

  constructor(name, coords, type, overall, food, prices) {
    super(name, coords, type, overall);
    this.food = food;
    this.prices = prices;
  }
}

class Cultural extends Workout {
  type = 'فرهنگی';

  constructor(name, coords, type, overall, setting, blogging) {
    super(name, coords, type, overall);
    this.setting = setting;
    this.blogging = blogging;
  }
}

class Entertainment extends Workout {
  type = 'تفریحی';

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
