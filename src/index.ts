import "./style.scss"
import 'htmx.org'
import {defineExtension} from 'htmx.org'
import {getCountryData} from 'countries-list'

console.log("Made with 🤎 by Akshay Raj Gollahalli (https://gollahalli.com)")

defineExtension('json-response', {
    onEvent: function (name, evt) {
        if (name === "htmx:afterRequest") {
            const xhr = evt.detail.xhr;
            const target = evt.detail.target;
            // console.log(xhr, target)
            // Assuming the response is JSON and has an 'ip' key
            console.log(xhr.getResponseHeader("Content-Type"))
            if (xhr.getResponseHeader("Content-Type").includes("application/json")) {
                try {
                    const jsonResponse = JSON.parse(xhr.responseText);
                    // Now, update the target element directly
                    // This assumes your JSON response has an 'ip' attribute
                    console.log(jsonResponse)
                    target.innerHTML = jsonResponse["ip"]["cf-connecting-ip"] ? jsonResponse["ip"]["cf-connecting-ip"] : "Unable to get IP";
                    target.innerHTML+= jsonResponse["ip"]["cf-ipcountry"] ? `<p>${getCountryData(jsonResponse["ip"]["cf-ipcountry"]).name}</p>` : "<p>Unable to get country</p>";
                } catch (error) {
                    console.error('Error parsing JSON response:', error);
                    target.innerHTML = 'Error loading content';
                }
                // Prevent HTMX from further processing the response
                evt.stopPropagation();
            }
        }
    }
});