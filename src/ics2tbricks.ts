// ICS to Tbricks

import Promise from "bluebird";
import icsToJson from "ics-to-json";
import fetch, { Response } from "node-fetch";
import prettyjson from "prettyjson";
import { XMLElement, XMLAttribute, XMLChild, xml } from "xml-decorators";

const calendarURL =
    "https://www.hkex.com.hk/News/HKEX-Calendar/Subscribe-Calendar?sc_lang=en";

interface calItem {
    startDate: string;
    endDate: string;
    summary: string;
}

let url = calendarURL;
let jsonDataPromise = Promise.resolve(fetch(url))
    .then((response: Response) => {
        return Promise.resolve(response.text());
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
            console.log(`\n${jsonData.length} calendar entries returned.`);
            console.log(`\nFirst calendar is:`);
            console.log(`\n${prettyjson.render(jsonData[0])}`);
        }
    })
    .catch(error => {
        new Error(error);
    });
