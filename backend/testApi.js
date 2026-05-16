require('dotenv').config();
const { fetchRealWeather } = require('./utils/weatherApi');

async function test() {
    try {
        const data = await fetchRealWeather(37.498, 127.027);
        console.log("SUCCESS:", data);
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}
test();
