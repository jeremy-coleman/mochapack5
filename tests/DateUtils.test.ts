import * as DateUtils from "@myspace/common/DateUtils";
import moment from "moment";
import expect from 'expect'

describe("Date Utilities", () => {
    it("textTransformation", () => {
        const dataInText = "2017-01-18";
        const date = DateUtils.momentFromDataText(dataInText);
        const dataOutText = DateUtils.momentToDataText(date);

        expect(dataInText).toBe(dataOutText);
    });

    it("momentInRange()", () => {
        const matchDate = DateUtils.momentFromDataText("2017-01-18");

        // null
        expect(DateUtils.isMomentAfter(matchDate, null)).toBeTruthy();

        expect(DateUtils.isMomentBefore(matchDate, null)).toBeTruthy();

        // invalid moment
        expect(DateUtils.isMomentAfter(matchDate, DateUtils.momentFromDataText("3rfweefwf2"))).toBeTruthy();

        expect(DateUtils.isMomentBefore(matchDate, DateUtils.momentFromDataText("wefwefwek"))).toBeTruthy();

        // from
        let from = moment(matchDate);
        
        expect(DateUtils.isMomentAfter(matchDate, from)).toBeTruthy();
        expect(DateUtils.isMomentAfter(matchDate, from, false)).toBeFalsy();

        // to
        let to = moment(matchDate);

        expect(DateUtils.isMomentBefore(matchDate, to)).toBeTruthy();
        expect(DateUtils.isMomentBefore(matchDate, to, false)).toBeFalsy();

        // from inclusive and exclusive
        from.add(-1, "days");

        expect(DateUtils.isMomentAfter(matchDate, from)).toBeTruthy();
        expect(DateUtils.isMomentAfter(matchDate, from, false)).toBeTruthy();

        to.add(1, "days");

        expect(DateUtils.isMomentBefore(matchDate, to)).toBeTruthy();
        expect(DateUtils.isMomentBefore(matchDate, to, false)).toBeTruthy();
    });
});