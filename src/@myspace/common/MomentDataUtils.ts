import moment from "moment";
import { momentFromString, momentToString, momentToISOString } from "./MomentUtils";

const Formats = {
    date: "YYYY-MM-DD",
    timestampNoTimezone: "YYYY-MM-DD[T]HH:mm:ss.SSS",
    timestampOut: "DD/MM/YYYY HH:mm:ss"
};

const momentFromDataString = (value : string) : moment.Moment => {
    return momentFromString(value, Formats.date);
};

const dateFromDataString = (value : string) : Date => {
    const m = momentFromDataString(value);
    return m && m.isValid() ? m.toDate() : undefined;
};

const momentToDataString = (value : moment.Moment) : string => {
    return momentToString(value, Formats.date);
};

const momentToTimestampDataString = (value : moment.Moment, withTimezone : boolean = true) : string => {
    if(withTimezone) {
        return momentToISOString(value);
    }
    return momentToString(value, Formats.timestampNoTimezone);
};

const momentFromTimestampDataString = (value : string, keepTimezone : boolean = false) : moment.Moment => {
    if(value) {
        if(keepTimezone) {
            // Keep the moment object in the timezone specified in 'value' string
            return moment.parseZone(value, moment.ISO_8601, true);
        } 
        // Shift the timezone to client timezone (default moment behaviour)
        return moment(value, moment.ISO_8601, true);
    }
    return undefined
};

const timestampIO = (value : string, outFormat: string = Formats.timestampOut) : string => {
    return momentToString(momentFromTimestampDataString(value), outFormat);
};

export { 
    momentFromDataString,
    dateFromDataString,
    momentToDataString,
    momentToTimestampDataString,
    momentFromTimestampDataString,
    Formats,
    timestampIO
}