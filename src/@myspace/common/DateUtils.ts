import moment from "moment";
import * as StringUtils from "./StringUtils";
import { Data as DateDataFormats, Output as DateOutputFormats, Input as DateInputFormats } from "./DateFormats";

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

const momentFromDataText = (value?: string) : moment.Moment => {
    return StringUtils.isNotBlank(value) ? moment(value, DateDataFormats.default, true) : undefined;
};

const momentFromDataTextWithFormat = (value: string, format : string) : moment.Moment => {
    return StringUtils.isNotBlank(value) ? moment(value, format, true) : undefined;
};

const momentToDataText = (value?: moment.Moment) : string => {
    return isValidMoment(value) ? value.format(DateDataFormats.default) : undefined;
};

const dateToDataText = (value?: Date) : string => {
    return momentToDataText(value ? moment(value) : undefined);
};

const momentToOutputText = (value?: moment.Moment) : string => {
    return value ? value.format(DateOutputFormats.default) : undefined;
};

const momentToOutputTextWithMEFormat = (value?: moment.Moment) : string => {
    return value ? value.format(DateOutputFormats.matchEvaluationHeader) : undefined;
};

const dateToOutputText = (value?: Date) : string => {
    return momentToOutputText(value ? moment(value) : undefined);
};

const momentToInputText = (value?: moment.Moment) : string => {
    return value ? value.format(DateInputFormats.default) : undefined;
};

const dateToInputText = (value?: Date) : string => {
    return momentToInputText(value ? moment(value) : undefined);
};

const timeToOutputText = (value?: Date) : string => {
    return momentCustomTimeToOutputText(value ? moment(value) : undefined);
};

const momentCustomTimeToOutputText = (value?: moment.Moment) : string => {
    return value ? value.format(DateOutputFormats.matchEvaluationTimeFormat) : undefined;
};

const momentToTimestampOutputText = (value?: moment.Moment) : string => {
    return isValidMoment(value) ? value.format(DateOutputFormats.timestamp) : undefined;
}

const dateToTimestampOutputText = (value?: Date) : string => {
    return momentToTimestampOutputText(value ? moment(value) : undefined);
};

const isNotNull = (value?: moment.Moment) : boolean => {
    return value ? true : false;
};

const dataToText = (value : string, format : string) : string => {
    if(StringUtils.isNotBlank(value)) {
        const m = momentFromDataText(value);
        if(isValidMoment(m)) {
            return m.format(format);
        }
    }
    return value;
};

const dataToOutputText = (value?: string) : string => {
    return dataToText(value, DateOutputFormats.default);
};

const dataToInputText = (value?: string) : string => {
    return dataToText(value, DateInputFormats.default);
};

const dataTextToInputMoment = (value?: string) : moment.Moment => {
    const inputText = dataToInputText(value);
    return StringUtils.isNotBlank(inputText) ? moment(dataToInputText(value), DateInputFormats.default, true) : undefined;
};

const timestampDataToInputText = (value?: string) : string => {
    const m = momentFromTimeDataText(value);
    return isValidMoment(m) ? m.format(DateInputFormats.timestamp) : value;
};

const timestampDataTextToInputMoment = (value?: string) : moment.Moment => {
    return value ? moment(timestampDataToInputText(value), DateInputFormats.timestamp, true) : undefined;
};

const dataTimestampToOutputText = (value?: string) : string => {
    const m = momentFromTimestampDataText(value);
    return isValidMoment(m) ? momentToTimestampOutputText(m) : value;
};

const dateFromDataText = (value?: string) : Date => {
    const m = momentFromDataText(value);
    return isValidMoment(m) ? m.toDate() : undefined;
};

const dateFromMatchEvaluationDataText = (value?: string) : Date => {
    const m = momentFromDataTextWithFormat(value, DateOutputFormats.matchEvaluation);
    return isValidMoment(m) ? m.toDate() : undefined;
};

const dateAsStringFromMatchEvaluationDataText = (value?: string) : string => {
    return momentToOutputText(momentFromDataTextWithFormat(value, DateOutputFormats.matchEvaluation));
};

const dateAsStringFromMatchEvaluationHeaderDataText = (value?: string) : string => {
    return momentToOutputTextWithMEFormat(momentFromDataTextWithFormat(value, DateOutputFormats.matchEvaluation));
};

const momentToTimestampDataText = (value?: moment.Moment, withTimezone = true) : string => {
    if (!value) {
        return undefined;
    }
    if (withTimezone) {
        return value.toISOString();
    } else {
        // In local time, but without any tz info (unspecified timezone)
        return value.format(DateDataFormats.xmlDateTimeWithoutTimezone);
    }
};

const momentToTimeDataText = (value?: moment.Moment) : string => {
    return isValidMoment(value) ? value.format(DateDataFormats.time[0] + "Z").substring(0, DateDataFormats.time[0].length) : undefined;
};

const dateToTimeDataText = (value?: Date) : string => {
    return momentToTimeDataText(value ? moment(value) : undefined);
};

const momentToTimeOutputText = (value?: moment.Moment) : string => {
    return isValidMoment(value) ? value.format(DateOutputFormats.time) : undefined;
};

const dateToTimeOutputText = (value?: Date) : string => {
    return momentToTimeOutputText(value ? moment(value) : undefined);
};

const momentFromTimeDataText = (value?: string) => {
    return StringUtils.isNotBlank(value) ? moment(value, DateDataFormats.time, true) : undefined;
};

const dateFromTimeDataText = (value?: string) => {
    const m = momentFromTimeDataText(value);
    return isValidMoment(m) ? m.toDate() : undefined;
};

const dateToTimestampDataText = (value?: Date, withTimezone = true) : string => {
    return momentToTimestampDataText(value ? moment(value) : undefined, withTimezone);
};

const momentFromTimestampDataText = (value?: string, keepTimezone = false) : moment.Moment => {
    if (StringUtils.isNotBlank(value)) {
        if (keepTimezone) {
            // Keep the moment object in the timezone specified in 'value' string
            return moment.parseZone(value, moment.ISO_8601, true);
        } else {
            // Shift the timezone to client timezone (default moment behaviour)
            return moment(value, moment.ISO_8601, true);
        }
    }
    return undefined;
};

const dateFromTimestampDataText = (value?: string) : Date => {
    const m = momentFromTimestampDataText(value);
    return isValidMoment(m) ? m.toDate() : undefined;
};

const currentTimestampDataText = () => {
    return dateToTimestampDataText(new Date());
};

const momentFromKeyText = (value?: string) => {
    return StringUtils.isNotBlank(value) ? moment(value, DateDataFormats.key, true) : undefined;
};

const dateFromKeyText = (value?: string) => {
    const m = momentFromKeyText(value);
    return isValidMoment(m) ? m.toDate() : undefined;
};

const momentToKeyText = (value?: moment.Moment) => {
    return value ? value.format(DateDataFormats.key) : undefined;
};

const dateToKeyText = (value?: Date) => {
    return momentToKeyText(value ? moment(value) : undefined);
};

const momentFromInputText = (value?: string) : moment.Moment => {
    return value ? moment(value, DateInputFormats.allowedDates, true) : undefined;
};

const dateFromInputText = (value?: string) : Date => {
    const m = momentFromInputText(value);
    return m && m.isValid() ? m.toDate() : undefined;
}

export {
    isValidMoment,
    dataToOutputText,
    dataTimestampToOutputText,
    momentFromDataText,
    dateFromDataText,
    dateFromMatchEvaluationDataText,
    timeToOutputText,
    momentToDataText,
    dateToDataText,
    momentToOutputText,
    dateToOutputText,
    dataTextToInputMoment,
    timestampDataToInputText,
    timestampDataTextToInputMoment,
    momentToTimestampOutputText,
    dateToTimestampOutputText,
    momentToTimestampDataText,
    dateToTimestampDataText,
    momentFromTimestampDataText,
    momentFromDataTextWithFormat,
    dateFromTimestampDataText,
    currentTimestampDataText,
    momentToTimeDataText,
    dateToTimeDataText,
    momentToTimeOutputText,
    dateToTimeOutputText,
    momentFromTimeDataText,
    dateFromTimeDataText,
    isMomentBefore,
    isMomentAfter,
    isNotNull,
    momentFromKeyText,
    dateFromKeyText,
    momentToKeyText,
    dateToKeyText,
    dateAsStringFromMatchEvaluationHeaderDataText,
    momentFromInputText,
    dateFromInputText,
    momentToInputText,
    dateToInputText
}