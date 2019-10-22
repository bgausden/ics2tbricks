import xml from "xml";

type TYesNo = "yes" | "no";

interface IWeekElement {
    _attr: {
        monday: TYesNo;
        tuesday: TYesNo;
        wednesday: TYesNo;
        thursday: TYesNo;
        friday: TYesNo;
        saturday: TYesNo;
        sunday: TYesNo;
    };
}

interface IDaysElement {
    days: IDayElement;
}

interface IDayElement {
    day: { _attr: { date: string; valid: TYesNo } };
}

interface ICalendarResource {
    resource: { _attr: { name: string; type: string } };
    week: IWeekElement;
}

var example5 = [
    {
        toys: [
            { _attr: { decade: "80s", locale: "US" } },
            { toy: "Transformers" },
            { toy: [{ _attr: { knowing: "half the battle" } }, "GI Joe"] },
            {
                toy: [
                    { name: "He-man" },
                    {
                        description: {
                            _cdata: "<strong>Master of the Universe!</strong>",
                        },
                    },
                ],
            },
        ],
    },
];

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
