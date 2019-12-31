/* eslint-disable space-before-function-paren */
/* eslint-disable comma-dangle */
/* eslint-disable @typescript-eslint/interface-name-prefix */
// ICS to Tbricks

import ICS2J from "ics-to-json"
import fetch from "node-fetch"
import moment from "moment"
import xmljs from "xml-js"

const HONG_KONG = "HK"
export const DEFAULT_COUNTRY_CODE = HONG_KONG
const HONG_KONG_CLOSED = "Hong Kong Market is closed"
export const DEFAULT_CALENDAR_URL = "https://www.hkex.com.hk/News/HKEX-Calendar/Subscribe-Calendar?sc_lang=en"
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

/* const CResourceElement: IResourceElement = {
    type: "element",
    name: "resource",
    attributes: {
        name: "HK",
        type: "application/x-calendar+xml",
    },
}; */

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

/* class CDaysAttrib implements IDaysAttrib {
    constructor (public year: string) {}
} */

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

    /*     toPlainObj () {
        return Object.assign({}, this)
    } */
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

/* function toPlainObject (o: object): object {
    return Object.assign({}, o)
} */

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
    /*     if (elements !== undefined) {
        Object.assign(container, elements)
    }
    if (attributes !== undefined) {
        Object.assign(container, attributes)
    } */
    return container
}

function processICSJSON(icsJSON: Array<{}>): IDaysElement[] {
    // find all VEVENT where SUMMARY is "Hong Kong Market  is Closed" and add to the calendar resource and add them to an array for later processing
    const daysElements: IDaysElement[] = []
    let count = 0
    // TODO for testing we only consider the first few items. For prod we'll need to look at every item (approx 850 of them)
    for (let index = 0; index < icsJSON.length; index++) {
        if (count > 50) break
        const calItem = icsJSON[index] as TCalItem
        if (calItem.description === HONG_KONG_CLOSED) {
            count++
            // console.log(calItem.startDate)
            // console.log(new Date(calItem.startDate))
            const closedDate = moment(calItem.startDate)
            const closedYear = Number(closedDate.format("YYYY"))
            const dayElement = new CDayElement(`${closedDate.format("MM")}-${closedDate.format("DD")}`, NO)
            if (daysElements[closedYear] === undefined) {
                // daysElements[closedYear] =  { type: ELEMENT, name: DAYS, elements: [] };
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
    /*     for (const [index, element] of icsJSON.entries()) {
        // calItems.forEach(entry => {
        if (index === 50) break;
        var calItem = <TCalItem>element;
        if (calItem.summary == HONG_KONG_CLOSED) {
            console.log(calItem.startDate)
            // console.log(new Date(calItem.startDate))
            var closedDate = moment(new Date(calItem.startDate));
            var dayElement = new CDayElement(
                `${closedDate.format("MM") + 1}-${closedDate.format("DD")}`,
                NO
            );
            elements.push(dayElement);
        }
    } */

    return daysElements
}

async function getCalDataFromURL(url: string): Promise<string | Error> {
    if (url.startsWith("http")) {
        const response = await fetch(url)
        if (response.ok) {
            const calData = await response.text()
            return calData
        } else {
            return new Error(`fetch() of ${url} failed.`)
        }
    } else {
        throw new Error(`url parameter does not begin with "http"`)
    }
}

export async function calResourceFromURL(url = DEFAULT_CALENDAR_URL, countryCode = HONG_KONG): Promise<void> {
    const icsData = await getCalDataFromURL(url)
    let icsJSON = [] as Array<{}>
    // console.log(icsData);
    if (icsData instanceof Error) {
        throw icsData
    } else {
        icsJSON = ICS2J.default(icsData)
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
    /*   const resource: IResource = {
        elements: [
            {
                type: ELEMENT,
                name: "resource",
                attributes: resourceAttributes,
                elements: [weekElement, daysElements, documentationsElement],
            },
        ],
    }; */

    /* Add the top level { elements: } wrapper around the body JSON */
    const resource = JSON.stringify({
        elements: [resourceBody],
    })
    console.log(xmljs.json2xml(resource, { compact: false, spaces: 2 }))
}

calResourceFromURL().then(undefined, undefined)
