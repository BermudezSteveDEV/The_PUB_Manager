/* ==========================================
   STOCK TICKER (TradingView ticker tape widget)
   ========================================== */

(function () {
  const container = document.getElementById('stockTicker');
  if (!container) return;

  const widget = document.createElement('div');
  widget.className = 'tradingview-widget-container__widget';

  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
  script.async = true;
  // TradingView reads its config from the script tag's text.
  script.textContent = JSON.stringify({
    symbols: [
      { proName: 'AMEX:SPY', title: 'SPY' },
      { proName: 'NASDAQ:QQQ', title: 'QQQ' },
      { proName: 'AMEX:DIA', title: 'DIA' },
      { proName: 'NASDAQ:AAPL', title: 'AAPL' },
      { proName: 'NASDAQ:MSFT', title: 'MSFT' },
      { proName: 'NASDAQ:NVDA', title: 'NVDA' },
      { proName: 'NASDAQ:GOOGL', title: 'GOOGL' },
      { proName: 'NASDAQ:AMZN', title: 'AMZN' },
      { proName: 'NASDAQ:META', title: 'META' },
      { proName: 'NASDAQ:TSLA', title: 'TSLA' },
      { proName: 'NASDAQ:CMCSA', title: 'CMCSA' }
    ],
    showSymbolLogo: true,
    isTransparent: true,
    displayMode: 'adaptive',
    colorTheme: 'dark',
    locale: 'en'
  });

  container.classList.add('tradingview-widget-container');
  container.append(widget, script);
  container.hidden = false;
})();

/* ==========================================
   WEATHER TICKER (Open-Meteo)
   ========================================== */

(function () {
  const container = document.getElementById('weatherTicker');
  if (!container) return;

  const CITIES = [
    { name: 'Philadelphia', lat: 39.9526, lon: -75.1652 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
    { name: 'Miami', lat: 25.7617, lon: -80.1918 },
    { name: 'Dallas', lat: 32.7767, lon: -96.7970 }
  ];

  const WEATHER_CODES = {
    0: ['Clear', '☀️'], 1: ['Mostly Clear', '🌤️'], 2: ['Partly Cloudy', '⛅'], 3: ['Cloudy', '☁️'],
    45: ['Fog', '🌫️'], 48: ['Fog', '🌫️'],
    51: ['Drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Drizzle', '🌧️'],
    61: ['Rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy Rain', '⛈️'],
    66: ['Freezing Rain', '🌧️'], 67: ['Freezing Rain', '🌧️'],
    71: ['Snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy Snow', '❄️'], 77: ['Snow Grains', '❄️'],
    80: ['Rain Showers', '🌦️'], 81: ['Rain Showers', '🌧️'], 82: ['Heavy Showers', '⛈️'],
    85: ['Snow Showers', '🌨️'], 86: ['Snow Showers', '❄️'],
    95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm', '⛈️'], 99: ['Thunderstorm', '⛈️']
  };

  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${CITIES.map((c) => c.lat).join(',')}`
    + `&longitude=${CITIES.map((c) => c.lon).join(',')}`
    + '&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto';

  function buildItem(city, text, icon) {
    const item = document.createElement('span');
    item.className = 'weather-ticker-item';
    const iconEl = document.createElement('span');
    iconEl.textContent = icon;
    const cityEl = document.createElement('span');
    cityEl.className = 'weather-ticker-city';
    cityEl.textContent = city;
    const tempEl = document.createElement('span');
    tempEl.className = 'weather-ticker-temp';
    tempEl.textContent = text;
    item.append(iconEl, cityEl, tempEl);
    return item;
  }

  function render(items) {
    const track = document.createElement('div');
    track.className = 'weather-ticker-track';
    // Render the list twice so the -50% scroll loops seamlessly.
    for (let i = 0; i < 2; i++) {
      items.forEach(({ city, text, icon }) => track.appendChild(buildItem(city, text, icon)));
    }
    container.replaceChildren(track);
  }

  async function update() {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Weather request failed with status ${response.status}`);
      const data = await response.json();
      const results = Array.isArray(data) ? data : [data];

      render(CITIES.map((city, i) => {
        const current = results[i]?.current;
        if (!current || typeof current.temperature_2m !== 'number') {
          return { city: city.name, text: 'Unavailable', icon: '🌥️' };
        }
        const [label, icon] = WEATHER_CODES[current.weather_code] || ['Weather', '⛅'];
        return { city: city.name, text: `${Math.round(current.temperature_2m)}°F ${label}`, icon };
      }));
    } catch (error) {
      console.error('Error loading weather ticker:', error);
      render(CITIES.map((c) => ({ city: c.name, text: 'Unavailable', icon: '🌥️' })));
    }
  }

  render(CITIES.map((c) => ({ city: c.name, text: 'Loading...', icon: '⛅' })));
  update();
  window.setInterval(update, 600000);
})();
