import * as PathUtils from "@myspace/common/PathUtils";
import expect from 'expect'

describe("Path Utilities", () => {
    it("join()", () => {
        expect(PathUtils.join("a", "/b", "c/", "d")).toBe("a/b/c/d");
        expect(PathUtils.join("a", "b/", "..", "c")).toBe("a/c");
        expect(PathUtils.join("a", "b/", ".", "c")).toBe("a/b/c");
    });
    it("normalize()", () => {
        expect(PathUtils.normalize("a/b/../c/./d")).toBe("a/c/d");
    });
    it("isAbsolute()", () => {
        expect(PathUtils.isAbsolute("/a/b")).toBeTruthy();
        expect(PathUtils.isAbsolute("a/b/")).toBeFalsy();
    });
    it("basename()", () => {
        expect(PathUtils.basename("what/poo.html", ".html")).toBe("poo");
        expect(PathUtils.basename("what/poo.html")).toBe("poo.html");
    });
    it("parent()", () => {
        expect(PathUtils.parent("what/the/hell")).toBe("what/the");
    });
    it("dirname()", () => {
        expect(PathUtils.dirname("what/the/")).toBe("what");
        expect(PathUtils.dirname("i/found/a/nice/shell")).toBe("i/found/a/nice");
        expect(PathUtils.dirname("hello.txt")).toBe(".");
    });
    it("trimSeparatorFromEnd()", () => {
        expect(PathUtils.trimSeparatorFromEnd("/what/the/")).toBe("/what/the");
    });
});