// ICS to Tbricks

import icsToJson from "ics-to-json";
import fetch from "node-fetch";
import prettyjson from "prettyjson";

const calendarURL =
    "https://www.hkex.com.hk/News/HKEX-Calendar/Subscribe-Calendar?sc_lang=en";

interface calItem {
    startDate: string;
    endDate: string;
    summary: string;
}

// Get ICS text however you like, example below
// Make sure you have the right CORS settings if needed
const convert = async (fileLocation: string) => {
    const icsRes = await fetch(fileLocation);
    const icsData = await icsRes.text();
    // Convert
    const data = icsToJson(icsData);
    return data;
};

let convertPromise = convert(calendarURL);
convertPromise.then((result: {}[]) => {
    console.log(`\n${result.length} calendar entries returned.`);
    console.log(`\nFirst calendar is:`);
    console.log(`\n${prettyjson.render(result[0])}`);
});
convertPromise.catch(error => console.log(new Error(error)));
