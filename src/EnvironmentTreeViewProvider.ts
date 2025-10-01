import * as vscode from "vscode";

export class EnvironmentTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private defaultEnvironment: string,
    public readonly command?: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    if (label === defaultEnvironment) {
      this.iconPath = new vscode.ThemeIcon(
        "check",
        new vscode.ThemeColor("terminal.ansiGreen")
      );
    }
    this.contextValue =
      label === defaultEnvironment ? "defaultEnvironment" : "environment";
  }
}

export class EnvironmentTreeViewProvider
  implements vscode.TreeDataProvider<EnvironmentTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    EnvironmentTreeItem | undefined | void
  > = new vscode.EventEmitter<EnvironmentTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    EnvironmentTreeItem | undefined | void
  > = this._onDidChangeTreeData.event;

  constructor(
    private environments: { [key: string]: string },
    private defaultEnvironment: string
  ) {}

  getTreeItem(element: EnvironmentTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: EnvironmentTreeItem): Thenable<EnvironmentTreeItem[]> {
    const items: EnvironmentTreeItem[] = [];

    // Add "Open Settings" command
    this.addOpenSetting(items, "Open Settings");

    // If environments are set, display them
    if (Object.keys(this.environments).length > 0) {
      items.push(
        ...Object.keys(this.environments).map(
          (env) =>
            new EnvironmentTreeItem(env, this.defaultEnvironment, {
              command: "extension.setDefaultEnvironment",
              title: "Set Default Environment",
              arguments: [env],
            })
        )
      );
    } else {
      // If no environments are set, display a placeholder item
      this.addOpenSetting(
        items,
        "No environments set. Click to add environments"
      );
    }

    return Promise.resolve(items);
  }

  private addOpenSetting(items: EnvironmentTreeItem[], text: string) {
    const gearIcon = new vscode.ThemeIcon(
      "gear",
      new vscode.ThemeColor("terminal.ansiYellow")
    );
    const settingsItem = new EnvironmentTreeItem(
      text,
      this.defaultEnvironment,
      {
        command: "extension.openSettings",
        title: "Open Settings",
      }
    );
    settingsItem.iconPath = gearIcon;
    items.push(settingsItem);
  }

  refresh(
    environments: { [key: string]: string },
    defaultEnvironment: string
  ): void {
    this.environments = environments;
    this.defaultEnvironment = defaultEnvironment;
    this._onDidChangeTreeData.fire();
  }

  setDefaultEnvironment(environment: string): void {
    this.defaultEnvironment = environment;
    // Since the environments aren't changing in this method, we can pass the existing values
    this.refresh(this.environments, this.defaultEnvironment);
  }
}
