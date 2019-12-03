// ICS to Tbricks

import Bluebird from "bluebird";
import icsToJson from "ics-to-json";
import fetch, { Response, Body } from "node-fetch";
import prettyjson from "prettyjson";
// import { XMLElement, XMLAttribute, XMLChild, xml } from "xml-decorators";
import { document, XmlDocument, XmlElement } from "xmlcreate";
// import xml from "xml";
import moment from "moment";
import xml, { Element, json2xml } from "xml-js";

const HONG_KONG_CLOSED = "Hong Kong Market is Closed";
const RESOURCE_NAME = "XHKF";
const CALENDAR_URL =
    "https://www.hkex.com.hk/News/HKEX-Calendar/Subscribe-Calendar?sc_lang=en";
const DAY = "day";
const DAYS = "days";
const YES = "yes";
const NO = "no";
const ELEMENT = "element";

interface ICalItem {
    startDate: string;
    endDate: string;
    summary: string;
}

type TCalItem = {
    startDate: string;
    endDate: string;
    summary: string;
};

interface IInitCalResourceReturn {
    calendarXML: XmlDocument;
    daysElement: XmlElement<XmlElement<XmlDocument>>;
}

/* function initializeCalendarResource(): object {
    const calResource = [
        {
            resource: [
                { _attr: { name: "XHKF", type: "application/x-calendar+xml" } },
                {
                    week: {
                        _attr: {
                            monday: "yes",
                            tuesday: "yes",
                            wednesday: "yes",
                            thursday: "yes",
                            friday: "yes",
                            saturday: "no",
                            sunday: "no",
                        },
                    },
                },
                { documentation: "Calendar definition for XHKF" },
            ],
        },
    ];

    console.log(xml(calResource, true));
    return calResource;
} */

/* type TDayElement = {
    type: "element",
    name: "day",
    attributes: {
            date: string,
            valid: string,
        }
    } */

/* type TDaysElement = {
        type: "element",
        name: "days",
        attributes?: {
            year: string,
        }
        elements: TDayElement[]
      }[]; */

type TElement = "element";
type TDay = "day";
type TDays = "days";
type TYesNo = "yes" | "no";

interface IDayAttrib {
    date: string;
    valid: TYesNo;
}

class CDayAttrib implements IDayAttrib {
    constructor(public date: string, public valid: TYesNo) {}
}

interface IDaysAttrib {
    year: string;
}

class CDaysAttrib implements IDaysAttrib {
    constructor(public year: string) {}
}

interface IDayElement {
    type: string;
    name: string;
    attributes: { date: string; valid: string };
}

class CDayElement implements IDayElement {
    type = ELEMENT;
    name = DAY;
    attributes: IDayAttrib;
    constructor(date: string, valid: TYesNo) {
        this.attributes = new CDayAttrib(date, valid);
    }
    toPlainObj(): IDayElement {
        return Object.assign({}, this);
    }
}

interface IDaysElement {
    type: string;
    name: string;
    dayElements: IDayElement[];
    attributes?: IDaysAttrib;
}

class CDaysElement {
    type = ELEMENT;
    name = DAYS;
    dayElements: IDayElement[];
    attributes?: IDaysAttrib;
    constructor(dayElements: IDayElement[], attributes?: CDaysAttrib) {
        this.dayElements = dayElements;
        if (attributes instanceof CDayAttrib) {
            this.attributes = attributes;
        } else {
            attributes = undefined;
        }
    }
    toPlainObj(): IDaysElement {
        return Object.assign({}, this);
    }
}

function processCalData(calItems: {}[]): CDaysElement {
    // find all VEVENT where SUMMARY is "Hong Kong Market  is Closed" and add to the calendar resource and add them to an array for later processing
    var dayElements: CDayElement[] = [];
    // TODO for testing we only consider the first few items. For prod we'll need to look at every item (approx 850 of them)
    for (const [index, element] of calItems.entries()) {
        // calItems.forEach(entry => {
        if (index === 5) break;
        var calItem: TCalItem = <TCalItem>element;
        if ((calItem.summary = HONG_KONG_CLOSED)) {
            var closedDate = moment(calItem.startDate);
            var dayElement = new CDayElement(
                `${closedDate.month() + 1}-${closedDate.date()}`,
                NO
            );
            dayElements.push(dayElement);
        }
    }
    // console.log(dayElements);
    return new CDaysElement(dayElements, { year: "2019" });
}

/* async function getUserAsync(name) {
  await fetch(`https://api.github.com/users/${name}`).then(async (response)=> {
  return await response.json()
}); */

async function getCalData(url: string) {
    const response = await fetch(url);
    if (response.ok) {
        var icsData = await response.text();
        return icsToJson(icsData);
    } else {
        return new Error(`fetch() of ${url} failed.`);
    }
}

/* function getCalData(url: string) {
    // let url = CALENDAR_URL;
    return Bluebird.resolve(fetch(url))
        .then((response: Response) => {
            return Bluebird.resolve(response.text());
        })
        .then((icsData: string) => {
            return icsToJson(icsData);
        })
        .catch<Error>(error => new Error(error));
} */

/* var resourceJSON = undefined;
getCalData(CALENDAR_URL)
    .then(calData => {
        if (calData instanceof Error) {
            console.log(`\nSomething has gone wrong`);
        } else {
            resourceJSON = processSourceCalendar(calData);
            console.log(`\nresourceJSON = ` + JSON.stringify(resourceJSON, undefined,2));
            console.log(`\n${calData.length} calendar entries returned.`);
            console.log(`\nFirst calendar is:`);
            console.log(`\n${JSON.stringify(calData[0],undefined,2)}`);
        }
    })
    .catch(error => {
        new Error(error);
    }); */

async function convertCalData(url: string) {
    const calItems = await getCalData(url);
    //getCalData(CALENDAR_URL).then(calItems => {
    if (calItems instanceof Error) {
        throw calItems;
    } else {
        return processCalData(calItems);
    }
}

async function main() {
    var result = await convertCalData(CALENDAR_URL);
    console.log(result);
    var result2 = json2xml(JSON.stringify(result));
    console.log(result2);
}

// convertCalData(CALENDAR_URL).then(res => console.log(res));

main();
