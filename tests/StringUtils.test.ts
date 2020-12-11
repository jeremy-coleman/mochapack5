import { isAlpha, isAlphaNumeric, isDigit, isOneOf } from "@myspace/common/StringFilters";
import * as StringUtils from "@myspace/common/StringUtils";
import expect from 'expect';

describe("String Utilities", () => {
    it("forEach()", () => {
        const testString = "sample";

        const result : any[] = [];
        StringUtils.forEach(testString, (ch, idx, text) => {
            result.push({ ch: ch, idx: idx, text: text });
        });

        expect(result.length).toBe(testString.length);

        expect(result[0].ch).toBe("s");
        expect(result[0].idx).toBe(0);
        expect(result[0].text).toBe(testString);

        expect(result[1].ch).toBe("a");
        expect(result[1].idx).toBe(1);
        expect(result[1].text).toBe(testString);

        expect(result[2].ch).toBe("m");
        expect(result[2].idx).toBe(2);
        expect(result[2].text).toBe(testString);

        expect(result[3].ch).toBe("p");
        expect(result[3].idx).toBe(3);
        expect(result[3].text).toBe(testString);

        expect(result[4].ch).toBe("l");
        expect(result[4].idx).toBe(4);
        expect(result[4].text).toBe(testString);

        expect(result[5].ch).toBe("e");
        expect(result[5].idx).toBe(5);
        expect(result[5].text).toBe(testString);
        
    });

    it("forEachReverse()", () => {
        const testString = "sample";
        const result : any[] = [];
        StringUtils.forEachReverse(testString, (ch, idx, text) => {
            result.push({ ch: ch, idx: idx, text: text });
        });

        expect(result.length).toBe(testString.length);

        expect(result[0].ch).toBe("e");
        expect(result[0].idx).toBe(5);
        expect(result[0].text).toBe(testString);

        expect(result[1].ch).toBe("l");
        expect(result[1].idx).toBe(4);
        expect(result[1].text).toBe(testString);

        expect(result[2].ch).toBe("p");
        expect(result[2].idx).toBe(3);
        expect(result[2].text).toBe(testString);

        expect(result[3].ch).toBe("m");
        expect(result[3].idx).toBe(2);
        expect(result[3].text).toBe(testString);

        expect(result[4].ch).toBe("a");
        expect(result[4].idx).toBe(1);
        expect(result[4].text).toBe(testString);

        expect(result[5].ch).toBe("s");
        expect(result[5].idx).toBe(0);
        expect(result[5].text).toBe(testString);
        
    });

    it("some()", () => {
        const testString = "sample";
        expect(StringUtils.some(testString, (ch) => { return ch === "s" })).toBeTruthy();
        expect(StringUtils.some(testString, (ch) => { return ch === "a" })).toBeTruthy();
        expect(StringUtils.some(testString, (ch) => { return ch === "m" })).toBeTruthy();
        expect(StringUtils.some(testString, (ch) => { return ch === "p" })).toBeTruthy();
        expect(StringUtils.some(testString, (ch) => { return ch === "l" })).toBeTruthy();
        expect(StringUtils.some(testString, (ch) => { return ch === "e" })).toBeTruthy();
        expect(StringUtils.some(testString, (ch) => { return ch === "z" })).toBeFalsy();
    });

    it("every()", () => {
        const testString = "sample";
        expect(StringUtils.every(testString, isAlpha)).toBeTruthy();
        expect(StringUtils.every(testString, isAlphaNumeric)).toBeTruthy();
    });

    it("map()", () => {
        const testString = "sample";
        const r = StringUtils.map(testString, (ch, idx) => {
            return ch + idx;
        });
        expect(r).toBe("s0a1m2p3l4e5");
    });

    it("split()", () => {
        const testString = "sample";
        const r = StringUtils.split(testString, (ch) => {
            return ch === "a";
        });
        expect(r.length).toBe(2);
        expect(r[0]).toBe("s");
        expect(r[1]).toBe("mple");
    });

    it("removeWhitespace()", () => {
        expect(StringUtils.removeWhitespace("sample")).toBe("sample");
        expect(StringUtils.removeWhitespace("s a m p\tl\re")).toBe("sample");
    });

    it("leftTrim()", () => {
        expect(StringUtils.leftTrim(undefined)).toBe(undefined);
        expect(StringUtils.leftTrim(null)).toBe(null);
        expect(StringUtils.leftTrim("")).toBe("");
        expect(StringUtils.leftTrim(" ")).toBe("");
        expect(StringUtils.leftTrim(" \t\r\n")).toBe("");
        expect(StringUtils.leftTrim(" sample\t")).toBe("sample\t");
        expect(StringUtils.leftTrim("sample\t\n")).toBe("sample\t\n");
        expect(StringUtils.leftTrim("\t\r sample\t\n")).toBe("sample\t\n");
        expect(StringUtils.leftTrim("sample", c => c === "s")).toBe("ample");
        expect(StringUtils.leftTrim("sample", c => c === "z")).toBe("sample");
    });

    it("rightTrim()", () => {
        expect(StringUtils.rightTrim(undefined)).toBe(undefined);
        expect(StringUtils.rightTrim(null)).toBe(null);
        expect(StringUtils.rightTrim("")).toBe("");
        expect(StringUtils.rightTrim(" ")).toBe("");
        expect(StringUtils.rightTrim(" \t\r\n")).toBe("");
        expect(StringUtils.rightTrim("\tsample ")).toBe("\tsample");
        expect(StringUtils.rightTrim("\t\nsample")).toBe("\t\nsample");
        expect(StringUtils.rightTrim("\t\r sample\t\n")).toBe("\t\r sample");
        expect(StringUtils.rightTrim("sample", c => c === "e")).toBe("sampl");
        expect(StringUtils.rightTrim("sample", c => c === "z")).toBe("sample");
    });

    it("trim()", () => {
        expect(StringUtils.trim("sample")).toBe("sample");
        expect(StringUtils.trim("\t  sample text\t\r")).toBe("sample text");
        expect(StringUtils.trim("a ")).toBe("a");
        expect(StringUtils.trim(" a")).toBe("a");
        expect(StringUtils.trim(" a\tb\nc ")).toBe("a\tb\nc");
        expect(StringUtils.trim("sample", c => c === "s")).toBe("ample");
        expect(StringUtils.trim("sample", c => c === "s" || c === "e")).toBe("ampl");
    });

    it("leftTrim() custom filter", () => {
        expect(StringUtils.leftTrim("goodbye///", isOneOf("/"))).toBe("goodbye///");
        expect(StringUtils.leftTrim("///goodbye", isOneOf("/"))).toBe("goodbye");
    });

    it("rightTrim() custom filter", () => {
        expect(StringUtils.rightTrim("///goodbye", isOneOf("/"))).toBe("///goodbye");
        expect(StringUtils.rightTrim("goodbye///", isOneOf("/"))).toBe("goodbye");
    });

    it("trim() custom", () => {
        expect(StringUtils.trim("///goodbye///", isOneOf("/"))).toBe("goodbye");
    });

    it("findIndexOf()", () => {
        const testString = "sample1 two2three";
        const r = StringUtils.findIndexOf(testString, (ch) => {
            return isDigit(ch);
        });
        expect(r).toBe(6);
    });

    it("findLastIndexOf()", () => {
        const testString = "sample1 two2three";
        const r = StringUtils.findLastIndexOf(testString, (ch) => {
            return isDigit(ch);
        });
        expect(r).toBe(11);
    });

    it("isBlank()", () => {
       expect(StringUtils.isBlank("")).toBeTruthy();
       expect(StringUtils.isBlank("\t")).toBeTruthy();
       expect(StringUtils.isBlank("\r")).toBeTruthy();
       expect(StringUtils.isBlank(" ")).toBeTruthy();
       expect(StringUtils.isBlank("a")).toBeFalsy();
    });

    it("isNotBlank()", () => {
        expect(StringUtils.isNotBlank("A")).toBeTruthy();
        expect(StringUtils.isNotBlank("")).toBeFalsy();
    });

    it("startsWithIgnoreCase()", () => {
        expect(StringUtils.startsWithIgnoreCase("Any Time", "any")).toBeTruthy();
        expect(StringUtils.startsWithIgnoreCase("Any Time", "Any")).toBeTruthy();
        expect(StringUtils.startsWithIgnoreCase("Any Time", "ANY")).toBeTruthy();
        expect(StringUtils.startsWithIgnoreCase("Any Time", "any ")).toBeTruthy();
        expect(StringUtils.startsWithIgnoreCase("Any Time", "ani")).toBeFalsy();
        expect(StringUtils.startsWithIgnoreCase("Any Time", "time")).toBeFalsy();
    });

    it("endsWithIgnoreCase()", () => {
        expect(StringUtils.endsWithIgnoreCase("Any Time", "time")).toBeTruthy();
        expect(StringUtils.endsWithIgnoreCase("Any Time", "Time")).toBeTruthy();
        expect(StringUtils.endsWithIgnoreCase("Any Time", "Time")).toBeTruthy();
        expect(StringUtils.endsWithIgnoreCase("Any Time", " time")).toBeTruthy();
        expect(StringUtils.endsWithIgnoreCase("Any Time", "timo")).toBeFalsy();
        expect(StringUtils.endsWithIgnoreCase("Any Time", "any")).toBeFalsy();
    });

    it("padLeft()", () => {
        expect(StringUtils.padLeft("999", 2)).toBe("999");
        expect(StringUtils.padLeft("999", 3)).toBe("999");
        expect(StringUtils.padLeft("999", 6)).toBe("   999");
        expect(StringUtils.padLeft("999", 5, "0")).toBe("00999");
    });

    it("padRight()", () => {
        expect(StringUtils.padRight("999", 2)).toBe("999");
        expect(StringUtils.padRight("999", 3)).toBe("999");
        expect(StringUtils.padRight("999", 6)).toBe("999   ");
        expect(StringUtils.padRight("999", 5, "0")).toBe("99900");
    });

    it("stripLeft()", () => {
        expect(StringUtils.stripLeft("00999", "0")).toBe("999");
        expect(StringUtils.stripLeft("999", "0")).toBe("999");
    });

    it("stripRight()", () => {
        expect(StringUtils.stripRight("999", "0")).toBe("999");
        expect(StringUtils.stripRight("99900", "0")).toBe("999");
    });

    it("wordsToCamelCase()", () => {
        const test = "what the hell";
        const r = StringUtils.wordsToCamelCase(test);
        expect(r).toBe("whatTheHell");
    });
});

