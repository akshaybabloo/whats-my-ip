import "./style.css"
import axios from "axios";
import {getCountryData} from 'countries-list'

console.log("Made with 🤎 by Akshay Raj Gollahalli (https://gollahalli.com)")

window.addEventListener('load', async () => {
    const ipAddressElement = document.getElementById('ip-address');
    if (ipAddressElement) {
        try {
            const response = await axios.get('/api/ip');
            const jsonResponse = response.data;
            ipAddressElement.innerHTML = jsonResponse["ip"]["cf-connecting-ip"] ? jsonResponse["ip"]["cf-connecting-ip"] : "Unable to get IP";
            ipAddressElement.innerHTML += jsonResponse["ip"]["cf-ipcountry"] ? `<p>${getCountryData(jsonResponse["ip"]["cf-ipcountry"]).name}</p>` : "<p>Unable to get country</p>";
        } catch (error) {
            console.error('Error fetching IP:', error);
            ipAddressElement.innerHTML = 'Error loading content';
        }
    }
});
