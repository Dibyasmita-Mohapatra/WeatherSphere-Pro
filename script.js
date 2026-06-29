/* ==========================================
   OpenWeather API Key
========================================== */

const API_KEY = "YOUR_API_KEY_HERE";

/* ==========================================
   Application State
========================================== */

const state = {
    currentCity: "",
    recentCities: JSON.parse(localStorage.getItem("recentCities")) || [],
    weatherCache: {},
    isLoading: false
};

/* ==========================================
   DOM Elements
========================================== */

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const weatherCard = document.getElementById("weatherCard");
const forecastGrid = document.getElementById("forecast");

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");

const recentContainer = document.getElementById("recent");

/* ==========================================
   Initialize App
========================================== */

window.addEventListener("DOMContentLoaded", () => {

    displayRecentCities();

    getCurrentLocationWeather();

});

/* ==========================================
   Event Listeners
========================================== */

searchBtn.addEventListener("click", handleSearch);

cityInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        handleSearch();
    }

});

/* ==========================================
   Search Handler
========================================== */

function handleSearch() {

    hideError();

    const city = cityInput.value.trim();

    if (!city) {

        showError("Please enter a city name.");

        return;

    }

    fetchWeather(city);

}

/* ==========================================
   Fetch Current Weather
========================================== */

async function fetchWeather(city) {

    const cachedData = getFromCache(city);

    if (cachedData) {

        renderCurrentWeather(cachedData);

        fetchForecast(city);

        return;

    }

    try {

        showLoading();

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
            throw new Error("City not found");
        }

        const data = await response.json();

        saveToCache(city, data);

        state.currentCity = city;

        saveRecentCity(city);

        renderCurrentWeather(data);

        fetchForecast(city);

    }

    catch (error) {

        showError(error.message);

    }

    finally {

        hideLoading();

    }

}

/* ==========================================
   Current Location Weather
========================================== */

function getCurrentLocationWeather() {

    if (!navigator.geolocation) {

        return;

    }

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            try {

                const { latitude, longitude } = position.coords;

                const response = await fetch(

                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`

                );

                const data = await response.json();

                renderCurrentWeather(data);

                fetchForecast(data.name);

            }

            catch (error) {

                console.error(error);

            }

        },

        () => {

            console.log("Location permission denied.");

        }

    );

}

/* ==========================================
   Render Current Weather
========================================== */

function renderCurrentWeather(data) {

    hideError();

    weatherCard.classList.remove("hidden");

    document.getElementById("cityName").textContent = data.name;

    document.getElementById("description").textContent =
        data.weather[0].description;

    document.getElementById("temp").textContent =
        `${Math.round(data.main.temp)}°C`;

    document.getElementById("humidity").textContent =
        `${data.main.humidity}%`;

    document.getElementById("wind").textContent =
        `${Math.round(data.wind.speed * 3.6)} km/h`;

    document.getElementById("weatherIcon").src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    /* ---------- EXTRA DETAILS ---------- */

    document.getElementById("feelsLike").textContent =
        `${Math.round(data.main.feels_like)}°C`;

    document.getElementById("pressure").textContent =
        `${data.main.pressure} hPa`;

    document.getElementById("visibility").textContent =
        `${(data.visibility / 1000).toFixed(1)} km`;

    document.getElementById("country").textContent =
        data.sys.country;

    document.getElementById("sunrise").textContent =
        formatTime(data.sys.sunrise);

    document.getElementById("sunset").textContent =
        formatTime(data.sys.sunset);

}

/* ==========================================
   Fetch 5-Day Forecast
========================================== */

async function fetchForecast(city) {

    try {

        const response = await fetch(

            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`

        );

        if (!response.ok) {

            throw new Error("Unable to fetch forecast.");

        }

        const data = await response.json();

        renderForecast(data);

    }

    catch (error) {

        console.error(error);

    }

}

/* ==========================================
   Render Forecast
========================================== */

function renderForecast(data) {

    forecastGrid.innerHTML = "";

    // Pick one forecast around 12:00 PM for each day
    const dailyForecast = data.list.filter(item =>
        item.dt_txt.includes("12:00:00")
    );

    dailyForecast.forEach(day => {

        const date = new Date(day.dt_txt);

        const card = document.createElement("div");

        card.className = "forecast-card";

        card.innerHTML = `

            <h3>${date.toLocaleDateString("en-US", {
                weekday: "short"
            })}</h3>

            <img
                src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png"
                alt="Weather">

            <p><strong>${Math.round(day.main.temp)}°C</strong></p>

            <p>${day.weather[0].main}</p>

        `;

        forecastGrid.appendChild(card);

    });

}

/* ==========================================
   Recent Searches
========================================== */

function saveRecentCity(city) {

    city = city.trim();

    // Remove duplicate
    state.recentCities = state.recentCities.filter(

        item => item.toLowerCase() !== city.toLowerCase()

    );

    // Add newest first
    state.recentCities.unshift(city);

    // Keep only last 5
    state.recentCities = state.recentCities.slice(0, 5);

    localStorage.setItem(

        "recentCities",

        JSON.stringify(state.recentCities)

    );

    displayRecentCities();

}

/* ==========================================
   Display Recent Searches
========================================== */

function displayRecentCities() {

    recentContainer.innerHTML = "";

    state.recentCities.forEach(city => {

        const button = document.createElement("button");

        button.textContent = city;

        button.addEventListener("click", () => {

            cityInput.value = city;

            fetchWeather(city);

        });

        recentContainer.appendChild(button);

    });

}

/* ==========================================
   Loading
========================================== */

function showLoading() {

    state.isLoading = true;

    loading.classList.remove("hidden");

    weatherCard.classList.add("hidden");

}

function hideLoading() {

    state.isLoading = false;

    loading.classList.add("hidden");

}

/* ==========================================
   Error Handling
========================================== */

function showError(message) {

    errorBox.textContent = message;

    errorBox.classList.remove("hidden");

}

function hideError() {

    errorBox.classList.add("hidden");

}

/* ==========================================
   Cache Helpers
========================================== */

function saveToCache(city, data) {

    state.weatherCache[city.toLowerCase()] = {

        data,

        time: Date.now()

    };

}

function getFromCache(city) {

    const cache = state.weatherCache[city.toLowerCase()];

    if (!cache) return null;

    const age = Date.now() - cache.time;

    // Cache valid for 10 minutes
    if (age > 10 * 60 * 1000) {

        delete state.weatherCache[city.toLowerCase()];

        return null;

    }

    return cache.data;

}

/* ==========================================
   Format Unix Time
========================================== */

function formatTime(unixTime){

    const date = new Date(unixTime * 1000);

    return date.toLocaleTimeString([],{

        hour:"2-digit",
        minute:"2-digit"

    });

}