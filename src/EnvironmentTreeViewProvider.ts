import * as vscode from 'vscode';

export class EnvironmentTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private defaultEnvironment: string,
        public readonly command?: vscode.Command
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = label === defaultEnvironment ? '(default)' : '';
        this.contextValue = label === defaultEnvironment ? 'defaultEnvironment' : 'environment';
    }
}

export class EnvironmentTreeViewProvider implements vscode.TreeDataProvider<EnvironmentTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<EnvironmentTreeItem | undefined | void> = new vscode.EventEmitter<EnvironmentTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<EnvironmentTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private environments: { [key: string]: string }, private defaultEnvironment: string) { }

    getTreeItem(element: EnvironmentTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: EnvironmentTreeItem): Thenable<EnvironmentTreeItem[]> {
        if (!element) {
            // Root level items: environments and settings link
            const items: EnvironmentTreeItem[] = Object.keys(this.environments).map(env =>
                new EnvironmentTreeItem(env, this.defaultEnvironment, {
                    command: 'extension.setDefaultEnvironment',
                    title: 'Set Default Environment',
                    arguments: [env]
                })
            );
            items.push(new EnvironmentTreeItem('Edit Settings...', this.defaultEnvironment, {
                command: 'extension.openSettings',
                title: 'Edit Settings',
            }));
            return Promise.resolve(items);
        } else {
            return Promise.resolve([]);
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setDefaultEnvironment(environment: string): void {
        this.defaultEnvironment = environment;
        this.refresh();
    }
}
