import * as assert from "assert";
import * as vscode from "vscode";
import {
  EnvironmentTreeViewProvider,
  EnvironmentTreeItem,
} from "../../EnvironmentTreeViewProvider";
import {
  TestListTreeViewProvider,
  TestListItem,
} from "../../TestListTreeViewProvider";
import { MatchType } from "../../MatchType";

describe("EnvironmentTreeViewProvider", () => {
  it("shows Open Settings with gear icon", async () => {
    const provider = new EnvironmentTreeViewProvider({}, "default");
    const items = await provider.getChildren();
    const openSettings = items.find((i) => i.label === "Open Settings");
    assert.ok(openSettings);
    assert.ok(openSettings.iconPath instanceof vscode.ThemeIcon);
  });

  it("shows environments and marks default", async () => {
    const envs = { default: "cmd", other: "cmd2" };
    const provider = new EnvironmentTreeViewProvider(envs, "default");
    const items = await provider.getChildren();
    const defaultItem = items.find((i) => i.label === "default");
    assert.ok(defaultItem?.iconPath instanceof vscode.ThemeIcon);
    assert.strictEqual(defaultItem?.contextValue, "defaultEnvironment");
  });

  it("shows placeholder if no environments", async () => {
    const provider = new EnvironmentTreeViewProvider({}, "default");
    const items = await provider.getChildren();
    assert.ok(items.some((i) => i.label.includes("No environments set")));
  });

  it("refresh updates environments and default", () => {
    const provider = new EnvironmentTreeViewProvider({ a: "cmd" }, "a");
    provider.refresh({ b: "cmd2" }, "b");
    assert.deepStrictEqual((provider as any).environments, { b: "cmd2" });
    assert.strictEqual((provider as any).defaultEnvironment, "b");
  });

  it("setDefaultEnvironment updates default", () => {
    const provider = new EnvironmentTreeViewProvider({ a: "cmd" }, "a");
    provider.setDefaultEnvironment("b");
    assert.strictEqual((provider as any).defaultEnvironment, "b");
  });
});

describe("TestListTreeViewProvider", () => {
  const sampleMatch: MatchType = {
    range: new vscode.Range(
      new vscode.Position(1, 0),
      new vscode.Position(1, 10)
    ),
    testName: "Sample Test",
    testFile: "file.spec.ts",
    isTestSet: "Execute Playwright Test",
    lineNumber: 2,
  };

  it("shows placeholder if empty", async () => {
    const provider = new TestListTreeViewProvider([]);
    const items = await provider.getChildren();
    assert.strictEqual(
      items[0].label,
      "No tests in list. Use 'Add to List' from editor."
    );
  });

  it("shows all tests in list", async () => {
    const provider = new TestListTreeViewProvider([sampleMatch]);
    const items = await provider.getChildren();
    assert.strictEqual(items[0].label, "Sample Test");
    assert.strictEqual(items[0].description, "file.spec.ts:2");
    assert.ok(items[0].iconPath instanceof vscode.ThemeIcon);
  });

  it("refresh updates items", async () => {
    const provider = new TestListTreeViewProvider([]);
    provider.refresh([sampleMatch]);
    const items = await provider.getChildren();
    assert.strictEqual(items[0].label, "Sample Test");
  });

  it("setItems and getItems work", () => {
    const provider = new TestListTreeViewProvider([]);
    provider.setItems([sampleMatch]);
    assert.strictEqual(provider.getItems()[0].testName, "Sample Test");
  });
});
