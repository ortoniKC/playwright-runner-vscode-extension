import * as vscode from "vscode";
import { MatchType } from "./MatchType";

/**
 * TreeItem for a match in the test list
 */
export class TestListItem extends vscode.TreeItem {
  constructor(
    public readonly match: MatchType,
    public readonly command?: vscode.Command
  ) {
    // label: show testName, description: file:line
    const description =
      match.lineNumber !== undefined
        ? `${match.testFile}:${match.lineNumber}`
        : match.testFile;
    super(match.testName, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.contextValue = "testListItem";
    if (command) {
      this.command = command;
    }
    this.tooltip = `${match.testName}\n${description}`;
  }
}

/**
 * TreeDataProvider for test list
 */
export class TestListTreeViewProvider
  implements vscode.TreeDataProvider<TestListItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    TestListItem | undefined | void
  > = new vscode.EventEmitter<TestListItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TestListItem | undefined | void> =
    this._onDidChangeTreeData.event;

  private items: MatchType[] = [];

  constructor(initialItems: MatchType[] = []) {
    this.items = initialItems;
  }

  getTreeItem(element: TestListItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TestListItem): Thenable<TestListItem[]> {
    if (this.items.length === 0) {
      // show a placeholder item
      const placeholder = new TestListItem(
        {
          range: new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(0, 0)
          ),
          testName: "No tests in list. Use 'Add to List' from editor.",
          testFile: "",
          isTestSet: "",
        },
        undefined
      );
      placeholder.collapsibleState = vscode.TreeItemCollapsibleState.None;
      return Promise.resolve([placeholder]);
    }

    const data = this.items.map((m) => {
      const item = new TestListItem(m, {
        command: "extension.runTest",
        title: "Run test",
        arguments: [m],
      });
      item.iconPath = new vscode.ThemeIcon(
        "beaker",
        new vscode.ThemeColor("charts.blue")
      );
      return item;
    });
    return Promise.resolve(data);
  }

  refresh(items?: MatchType[]) {
    if (items) {
      this.items = items;
    }
    this._onDidChangeTreeData.fire();
  }

  // helpers to manipulate items
  setItems(items: MatchType[]) {
    this.items = items.slice();
    this.refresh();
  }

  getItems() {
    return this.items.slice();
  }
}
