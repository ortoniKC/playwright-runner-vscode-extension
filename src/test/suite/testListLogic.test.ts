import * as assert from "assert";
import * as vscode from "vscode";
import { TestListTreeViewProvider } from "../../TestListTreeViewProvider";
import { MatchType } from "../../MatchType";

let testList: MatchType[] = [];

function addToTestList(
  test: MatchType,
  testListProvider?: TestListTreeViewProvider
) {
  if (
    !testList.some(
      (t) => t.testName === test.testName && t.testFile === test.testFile
    )
  ) {
    testList.push(test);
    testListProvider?.refresh(testList);
  }
}

function clearTestList(testListProvider?: TestListTreeViewProvider) {
  testList = [];
  testListProvider?.refresh(testList);
}

describe("Test List Logic", () => {
  let testListProvider: TestListTreeViewProvider;
  let match: MatchType;

  beforeEach(() => {
    testListProvider = new TestListTreeViewProvider([]);
    match = {
      range: new vscode.Range(
        new vscode.Position(1, 0),
        new vscode.Position(1, 10)
      ),
      testName: "Test",
      testFile: "file.ts",
      isTestSet: "Execute Playwright Test",
    };
    testList = [];
  });

  it("adds test to list and avoids duplicates", () => {
    addToTestList(match, testListProvider);
    assert.strictEqual(testListProvider.getItems().length, 1);
    addToTestList(match, testListProvider);
    assert.strictEqual(testListProvider.getItems().length, 1);
  });

  it("clears the test list", () => {
    addToTestList(match, testListProvider);
    clearTestList(testListProvider);
    assert.strictEqual(testListProvider.getItems().length, 0);
  });

  it("does not fail when clearing empty list", () => {
    clearTestList(testListProvider);
    assert.strictEqual(testListProvider.getItems().length, 0);
  });
});
