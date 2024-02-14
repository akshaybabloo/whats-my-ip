import "./style.scss"
import 'htmx.org'
import {defineExtension} from 'htmx.org'

console.log("Made with 🤎 by Akshay Raj Gollahalli (https://gollahalli.com)")

defineExtension('json-response', {
    onEvent: function (name, evt) {
        if (name === "htmx:afterRequest") {
            var xhr = evt.detail.xhr;
            var target = evt.detail.target;
            // console.log(xhr, target)
            // Assuming the response is JSON and has an 'ip' key
            console.log(xhr.getResponseHeader("Content-Type"))
            if (xhr.getResponseHeader("Content-Type").includes("application/json")) {
                try {
                    var jsonResponse = JSON.parse(xhr.responseText);
                    // Now, update the target element directly
                    // This assumes your JSON response has an 'ip' attribute
                    console.log(jsonResponse)
                    target.innerHTML = JSON.stringify(jsonResponse["ip"]["cf-connecting-ip"])
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