// ICS to Tbricks

import Bluebird from "bluebird";
import icsToJson from "ics-to-json";
import fetch, { Response } from "node-fetch";
import prettyjson from "prettyjson";
// import { XMLElement, XMLAttribute, XMLChild, xml } from "xml-decorators";
import { document, XmlDocument, XmlElement } from "xmlcreate";
import xml from "xml";
import moment = require("moment");

const HONG_KONG_CLOSED = "Hong Kong Market is Closed";
const RESOURCE_NAME = "XHKF";
const CALENDAR_URL =
    "https://www.hkex.com.hk/News/HKEX-Calendar/Subscribe-Calendar?sc_lang=en";

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

function initializeCalendarResource(): object {
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
}

var example5 = [
    {
        days: [{ day: { _attr: { date: "half the battle", valid: "no" } } }],
    },
];

type TDayElement = {
    day: {
        _attr: {
            date: string;
            valid: string;
        };
    };
};

type TDaysElement =
    | {
          days: TDayElement[];
      }[]
    | undefined;

var processJSONData = (jsonData: {}[]): void => {
    // find all VEVENT where SUMMARY is "Hong Kong Market  is Closed" and add to the calendar resource
    var daysElement: TDaysElement = undefined;
    jsonData.forEach(entry => {
        var calItem: TCalItem = <TCalItem>entry;
        if ((calItem.summary = HONG_KONG_CLOSED)) {
            var dateString = moment(calItem.startDate).format(
                "YYYY-MM-DDTHH:MM:SSZ"
            );
            var closedDate = new Date(dateString);
            var dayElement = {
                day: {
                    _attr: {
                        // TODO we aren't getting the days correctly - the days are +3 days somehow
                        date: `${closedDate.getFullYear()}-${closedDate.getMonth() +
                            1}-${closedDate.getDay() + 1}`,
                        valid: "no",
                    },
                },
            };
            if (daysElement === undefined) {
                daysElement = [
                    {
                        days: [dayElement],
                    },
                ];
            } else {
                daysElement[0].days.push(dayElement);
            }
        }
    });
    console.log(xml(daysElement, true));
};

let url = CALENDAR_URL;
let jsonDataPromise = Bluebird.resolve(fetch(url))
    .then((response: Response) => {
        return Bluebird.resolve(response.text());
    })
    .then((icsData: string) => {
        return icsToJson(icsData);
    })
    .catch<Error>(error => new Error(error));

jsonDataPromise
    .then(jsonData => {
        if (jsonData instanceof Error) {
            console.log(`\nSomething has gone wrong`);
        } else {
            const daysElement = processJSONData(jsonData);
            /* console.log(`\n${jsonData.length} calendar entries returned.`);
            console.log(`\nFirst calendar is:`);
            console.log(`\n${prettyjson.render(jsonData[0])}`); */
        }
    })
    .catch(error => {
        new Error(error);
    });
