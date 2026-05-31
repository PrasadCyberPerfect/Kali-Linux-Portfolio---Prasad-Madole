// ======================================
// NAVIGATION & WIDGETS
// Top panel, weather, clock, etc.
// ======================================

const fetchWeather = async () => {
    if (!systemState.networkOnline) {
        systemState.weather = { main: { temp: "--" }, weather: [{ main: 'Offline Mode', icon: '' }], name: 'Offline' };
        renderWeatherWidget();
        return;
    }
    if (systemState.privacy && !systemState.privacy.api) {
        systemState.weather = { main: { temp: "--" }, weather: [{ main: 'API Disabled', icon: '' }], name: 'No Access' };
        renderWeatherWidget();
        return;
    }
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=${CONFIG.weatherApiKey}&units=metric`);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        systemState.weather = data;
        renderWeatherWidget();
    } catch (e) {
        console.warn('Weather API failed (using mock data)');
        systemState.weather = { main: { temp: 28 }, weather: [{ main: 'Clear', icon: '01d' }], name: 'Mumbai' };
        renderWeatherWidget();
    }
};

const renderWeatherWidget = () => {
    const widget = document.getElementById('weather-widget');
    if (!widget) return;
    const temp = Math.round(systemState.weather.main.temp);
    widget.querySelector('span').textContent = `${temp}°C`;
    widget.title = `${systemState.weather.name}: ${systemState.weather.weather[0].main}`;

    widget.onclick = () => createWindow('weather', 'Weather', renderWeatherApp);
};

const renderWeatherApp = (body) => {
    const isApiDisabled = systemState.privacy && !systemState.privacy.api;
    body.innerHTML = `
        <div style="padding: 25px; text-align: center; color: var(--accent-blue); background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%); height: 100%; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 10px;">Current Weather</div>
            <h2 style="font-size: 28px; margin: 0; color: #fff;">${systemState.weather.name || 'Unknown'}</h2>
            <div style="font-size: 64px; margin: 20px 0; font-weight: bold; color: var(--accent-green); text-shadow: 0 0 20px rgba(0,255,65,0.3);">
                ${systemState.weather.main.temp}${systemState.weather.main.temp !== '--' ? '°C' : ''}
            </div>
            <p style="font-size: 18px; color: #aaa; margin: 0;">${systemState.weather.weather[0].main}</p>

            <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; font-size: 13px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <div>
                    <div style="color: #555; margin-bottom: 4px;">Humidity</div>
                    <div style="color: #eee;">${systemState.weather.main.humidity || 0}%</div>
                </div>
                <div>
                    <div style="color: #555; margin-bottom: 4px;">Wind Speed</div>
                    <div style="color: #eee;">${systemState.weather.wind?.speed || 0} m/s</div>
                </div>
                <div>
                    <div style="color: #555; margin-bottom: 4px;">Pressure</div>
                    <div style="color: #eee;">${systemState.weather.main.pressure || 0} hPa</div>
                </div>
                <div>
                    <div style="color: #555; margin-bottom: 4px;">Visibility</div>
                    <div style="color: #eee;">${(systemState.weather.visibility / 1000) || 0} km</div>
                </div>
            </div>
            ${isApiDisabled ? `
                <div style="margin-top: 20px; font-size: 11px; color: #ff5f56; background: rgba(255,95,86,0.1); padding: 8px; border-radius: 4px;">
                    <i class="fas fa-exclamation-triangle"></i> API Access is disabled in Privacy Settings
                </div>
            ` : ''}
        </div>
    `;
};
