/* eslint-disable node/file-extension-in-import */
/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
/* eslint-disable @typescript-eslint/interface-name-prefix */
import { calResourceFromURL, DEFAULT_CALENDAR_URL, DEFAULT_COUNTRY_CODE } from "./ics2tbricks"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function init(formEL: HTMLElement, url: HTMLElement, countryCode: HTMLElement): void {
    /* const formEL = document.getElementById("ics2calResource")
    const url = document.getElementById("icsURL")
    const countryCode = document.getElementById("countryCode") */
    if (formEL instanceof HTMLElement) {
        formEL.addEventListener("submit", function(evt) {
            evt.preventDefault()
            const urlString = url?.nodeValue ?? DEFAULT_CALENDAR_URL
            const countryCodeString = countryCode?.nodeValue ?? DEFAULT_COUNTRY_CODE
            retrieveAndProcess(urlString, countryCodeString)
        })
    }
}

function retrieveAndProcess(url: string, countryCode: string): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    calResourceFromURL(url, countryCode).finally(() => console.log(`Done`))
}

console.log(`index.ts loaded.`)
// onBodyLoad()
