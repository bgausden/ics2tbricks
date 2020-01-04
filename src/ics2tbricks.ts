/* eslint-disable space-before-function-paren */
/* eslint-disable @typescript-eslint/interface-name-prefix */
// ICS to Tbricks

import icsToJson from "ics-to-json"
import fetch from "node-fetch"
import moment from "moment"
import xmljs from "xml-js"

const HONG_KONG = "HK"
const DEFAULT_COUNTRY_CODE = HONG_KONG
const HONG_KONG_CLOSED = "Hong Kong Market is closed"
const DEFAULT_CALENDAR_URL = "https://www.hkex.com.hk/News/HKEX-Calendar/Subscribe-Calendar?sc_lang=en"
const TEST_CALENDAR_URL = "http://francis.net.xxx"
const DAY: TDay = "day"
const DAYS: TDays = "days"
const WEEK: TWeek = "week"
const NO: TYesNo = "no"
const ELEMENT: TElement = "element"
const RESOURCE: TResource = "resource"
const RESOURCEID: TResourceID = "application/x-calendar+xml"

const weekElement: IWeekElement = {
    type: ELEMENT,
    name: WEEK,
    attributes: {
        monday: "yes",
        tuesday: "yes",
        wednesday: "yes",
        thursday: "yes",
        friday: "yes",
        saturday: "no",
        sunday: "no",
    },
}

const documentationsElement: IDocumentationsElement = {
    type: ELEMENT,
    name: "documentation",
    elements: [
        {
            type: "text",
            text: "Calendar defining bank/settlement days for HK (Hong Kong).",
        },
    ],
}

type TElement = "element"
type TDay = "day"
type TDays = "days"
type TWeek = "week"
type TResource = "resource"
type TDocumentation = "documentation"
type TResourceID = "application/x-calendar+xml"
type TYesNo = "yes" | "no"
type TCalData = string

interface TCalItem {
    startDate: string
    endDate: string
    summary: string
    description: string
}

interface IElementBase {
    type: TElement
    name: TResource | TWeek | TDays | TDay | TDocumentation
}

interface IResource {
    elements: [IResourceElement]
}

interface IResourceElement extends IElementBase {
    attributes: {
        name: string
        type: TResourceID
    }
    elements: [IWeekElement, IDaysElement, IDocumentationsElement]
}

interface IWeekElement extends IElementBase {
    attributes: {
        monday: TYesNo
        tuesday: TYesNo
        wednesday: TYesNo
        thursday: TYesNo
        friday: TYesNo
        saturday: TYesNo
        sunday: TYesNo
    }
}

interface IDocumentationElement {
    type: "text"
    text: string
}

interface IDocumentationsElement extends IElementBase {
    elements: IDocumentationElement[]
}

interface IDayAttrib {
    date: string
    valid: TYesNo
}

class CDayAttrib implements IDayAttrib {
    constructor(public date: string, public valid: TYesNo) {}
}

interface IDaysAttrib {
    year: number
}

interface IDayElement extends IElementBase {
    attributes: { date: string; valid: TYesNo }
}

class CDayElement implements IDayElement {
    type = ELEMENT
    name = DAY
    attributes: IDayAttrib
    constructor(date: string, valid: TYesNo) {
        this.attributes = new CDayAttrib(date, valid)
    }

    toPlainObj(): IDayElement {
        return Object.assign({}, this)
    }
}

interface IDaysElement extends IElementBase {
    elements: IDayElement[]
    attributes?: IDaysAttrib
}

class CDaysElement {
    type = ELEMENT
    name = DAYS
    elements: IDayElement[]
    attributes?: IDaysAttrib
    constructor(daysElement?: IDayElement[], attributes?: IDaysAttrib) {
        this.elements = daysElement ?? []
        if (attributes instanceof CDayAttrib) {
            this.attributes = attributes
        }
    }
}

interface ICalData {
    elements: [IResourceElement, IWeekElement, IDaysElement, IDocumentationsElement]
}

interface IElement {
    type: TElement
    name: string
    elements?: IElement[]
    attributes?: {}
    text?: string
}

type TElements = IWeekElement | IDaysElement | IDayElement | IDocumentationsElement | IResourceElement
type TElementName = TResource | TDay | TDays | TWeek | TDocumentation
type returnType = Partial<TElements>

function addElementContainer(name: TElementName, elements?: TElements[], attributes?: {}): IElementBase {
    const container = {
        type: ELEMENT,
        name: name,
        elements: elements ?? [],
        attributes: attributes ?? {},
    }
    return container
}

function processICSJSON(icsJSON: Array<{}>): IDaysElement[] {
    // find all VEVENT where SUMMARY is "Hong Kong Market  is Closed" and add to the calendar resource and add them to an array for later processing
    const daysElements: IDaysElement[] = []
    // let count = 0
    // TODO for testing we only consider the first few items. For prod we'll need to look at every item (approx 850 of them)
    for (let index = 0; index < icsJSON.length; index++) {
        // if (count > 50) break
        const calItem = icsJSON[index] as TCalItem
        if (calItem.description === HONG_KONG_CLOSED) {
            // count++
            const closedDate = moment(calItem.startDate)
            const closedYear = Number(closedDate.format("YYYY"))
            const dayElement = new CDayElement(`${closedDate.format("MM")}-${closedDate.format("DD")}`, NO)
            if (daysElements[closedYear] === undefined) {
                const daysAttribute: IDaysAttrib = {
                    year: closedYear,
                }
                daysElements[closedYear] = new CDaysElement(undefined, daysAttribute)
            }
            if (daysElements[closedYear] !== undefined) {
                daysElements[closedYear].elements.push(dayElement)
            }
        }
    }

    return daysElements
}

async function getCalDataFromURL(url: string): Promise<string | Error> {
    if (url.startsWith("http")) {
        try {
            const response = await fetch(url)
            if (response.ok) {
                const calData = await response.text()
                return calData
            } else {
                return new Error(`fetch() of ${url} failed.`)
            }
        } catch (error) {
            console.error(error)
            return new Error(`fetch failed`)
        }
    } else {
        throw new Error(`url parameter does not begin with "http"`)
    }
}

async function calResourceFromURL(url = TEST_CALENDAR_URL, countryCode = HONG_KONG): Promise<void> {
    const icsData = await getCalDataFromURL(url)
    let icsJSON = [] as Array<{}>
    if (icsData instanceof Error) {
        // TODO handle Errors instead of dropping out of the Promise chain.
        throw icsData
    } else {
        icsJSON = icsToJson(icsData)
    }

    const daysElements = processICSJSON(icsJSON)

    const resourceAttributes = {
        name: countryCode,
        type: RESOURCEID,
    }

    const elements: TElements[] = [weekElement]
    for (let index = 0; index < daysElements.length; index++) {
        const element = daysElements[index]
        if (daysElements[index] !== undefined) {
            element.attributes = {
                year: index,
            }
            elements.push(element)
        }
    }

    elements.push(documentationsElement)

    const resourceBody = addElementContainer(RESOURCE, elements, resourceAttributes)

    /* Add the top level { elements: } wrapper around the body JSON */
    const resource = JSON.stringify({
        elements: [resourceBody],
    })
    console.log(xmljs.json2xml(resource, { compact: false, spaces: 2 }))
}

calResourceFromURL().then(
    () => console.log(`Done`),
    () => console.log(`Didn't work out`)
)
