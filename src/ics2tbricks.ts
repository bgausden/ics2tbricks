// ICS to Tbricks

import icsToJson from "ics-to-json";
import fetch from "node-fetch";
import prettyjson from "prettyjson";
import moment from "moment";
import { json2xml } from "xml-js";

const HONG_KONG_CLOSED = "Hong Kong Market is Closed";
const CALENDAR_URL =
    "https://www.hkex.com.hk/News/HKEX-Calendar/Subscribe-Calendar?sc_lang=en";
const DAY = "day";
const DAYS = "days";
const NO = "no";
const ELEMENT = "element";

const CWeekElement: IWeekElement = {
    type: "element",
    name: "week",
    attributes: {
        monday: "yes",
        tuesday: "yes",
        wednesday: "yes",
        thursday: "yes",
        friday: "yes",
        saturday: "no",
        sunday: "no",
    },
};

const CDocumentationElement: IDocumentationElements = {
    type: "element",
    name: "documentation",
    elements: [
        {
            type: "text",
            text:
                "\n        Calendar defining bank/settlement days for HK (Hong Kong).\n    ",
        },
    ],
};

const CResourceElement: IResourceElement = {
    type: "element",
    name: "resource",
    attributes: {
        name: "HK",
        type: "application/x-calendar+xml",
    },
};

interface IResourceElement {
    type: "element";
    name: "resource";
    attributes: {
        name: string;
        type: "application/x-calendar+xml";
    };
}


type TCalItem = {
    startDate: string;
    endDate: string;
    summary: string;
};


type TYesNo = "yes" | "no";

interface IWeekElement {
    type: "element";
    name: "week";
    attributes: {
        monday: TYesNo;
        tuesday: TYesNo;
        wednesday: TYesNo;
        thursday: TYesNo;
        friday: TYesNo;
        saturday: TYesNo;
        sunday: TYesNo;
    };
}

interface IDocumentationElement {
    type: "text";
    text: string;
}

interface IDocumentationElements {
    type: "element";
    name: "documentation";
    elements: IDocumentationElement[];
}

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

interface ICalData {
    elements: [
        IResourceElement,
        IWeekElement,
        IDaysElement,
        IDocumentationElements
    ];
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


async function getCalData(url: string) {
        const response = await fetch(url);
        if (response.ok) {
            var icsData = await response.text();
            return icsToJson(icsData);
        } else {
            return new Error(`fetch() of ${url} failed.`);
        }
    }

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
    var calJSON = await convertCalData(CALENDAR_URL);
    const CCal: ICalData = {
        elements: [
            CResourceElement,
            CWeekElement,
            calJSON,
            CDocumentationElement,
        ],
    };

    // console.log(result);
    var intermediateResult = JSON.stringify(CCal);
    console.log(
        `\nintermediateResult = ${prettyjson.render(intermediateResult)}`
    );
    var result2 = json2xml(intermediateResult, { compact: false, spaces: 2 });
    console.log(`result2 = ${result2}`);
}

// convertCalData(CALENDAR_URL).then(res => console.log(res));

main();
