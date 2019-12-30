/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
/* eslint-disable @typescript-eslint/interface-name-prefix */
const url = document.getElementById("icsURL")
const formEL = document.getElementById("ics2calResource")

if (formEL instanceof HTMLElement) {
    formEL.addEventListener("submit", function(evt) {
        evt.preventDefault()
        fillArray()
    })
}

function fillArray(): void {
    if (url instanceof HTMLElement) {
        console.log(`do something with ${url.nodeValue}`)
    }
}
