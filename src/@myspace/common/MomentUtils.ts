import moment from "moment";
import { isNotBlank } from "./StringUtils";

const isValidMoment = (value : moment.Moment) => {
    return value && value.isValid() ? true : false;
};

const isMomentAfter = (value : moment.Moment, test: moment.Moment, inclusive : boolean = true) : boolean => {
    if(isValidMoment(test)) {
        if(isValidMoment(value)) {
            return inclusive ? value.isSameOrAfter(test) : value.isAfter(test);
        }
        return false;
    }
    return true;
};

const isDateAfter = (value : Date, test: Date, inclusive : boolean = true) : boolean => {
    return isMomentAfter(value ? moment(value) : null, test ? moment(test) : null, inclusive);
};

const isMomentBefore = (value : moment.Moment, test: moment.Moment, inclusive : boolean = true) : boolean => {
    if(isValidMoment(test)) {
        if(isValidMoment(value)) {
            return inclusive ? value.isSameOrBefore(test) : value.isBefore(test);
        }
        return false;
    }
    return true;
};

const isDateBefore = (value : Date, test: Date, inclusive : boolean = true) : boolean => {
    return isMomentBefore(value ? moment(value) : null, test ? moment(test) : null, inclusive);
};

const momentFromString = (value: string, format: string) : moment.Moment => {
    return isNotBlank(value) ? moment(value, format, true) : undefined;
};

const momentToString = (value: moment.Moment, format: string) : string => {
    return isValidMoment(value) ? value.format(format) : undefined;
};

const dateToString = (value: Date, format: string) : string => {
    return momentToString(value ? moment(value): undefined, format);
};

const dateFromString = (value : string, format : string) : Date => {
    const m = momentFromString(value, format);
    return isValidMoment(m) ? m.toDate() : undefined;
};

const momentToISOString = (value : moment.Moment) : string => {
    return value ? value.toISOString() : undefined;
};

const dateToISOString = (value : Date) : string => {
    return value ? momentToISOString(moment(value)) : undefined;
};

const io = (value : string, inFormat: string, outFormat : string) : string => {
    return momentToString(momentFromString(value, inFormat), outFormat);
};

export {
    isValidMoment,
    isMomentBefore,
    isDateBefore,
    isMomentAfter,
    isDateAfter,
    momentFromString,
    dateFromString,
    momentToString,
    dateToString,
    momentToISOString,
    dateToISOString,
    io
}