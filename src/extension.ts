import * as vscode from 'vscode';
import * as path from 'path';
import { EnvironmentTreeViewProvider } from './EnvironmentTreeViewProvider';

export function activate(context: vscode.ExtensionContext) {
	// To open setting from the tree view
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.openSettings', () => {
			vscode.commands.executeCommand('workbench.action.openSettings', 'ortoniPlaywrightTestRunner.environments');
		})
	);
	const config = vscode.workspace.getConfiguration("ortoniPlaywrightTestRunner");
	const environments = config.get<{ [key: string]: string }>("environments")!;
	let defaultEnvironment = config.get<string>("defaultEnvironment")!;

	const environmentProvider = new EnvironmentTreeViewProvider(environments, defaultEnvironment);

	vscode.window.registerTreeDataProvider('playwrightEnvironmentSelector', environmentProvider);

	// Listen for changes to the 'ortoniPlaywrightTestRunner.environments' setting
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('ortoniPlaywrightTestRunner.environments')) {
				// Refresh environments and update tree view
				const updatedEnvironments = vscode.workspace.getConfiguration("ortoniPlaywrightTestRunner").get<{ [key: string]: string }>("environments")!;
				const updatedDefaultEnvironment = vscode.workspace.getConfiguration("ortoniPlaywrightTestRunner").get<string>("defaultEnvironment")!;
				environmentProvider.refresh(updatedEnvironments, updatedDefaultEnvironment);
			}
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.setDefaultEnvironment', (environment: string) => {
			config.update('defaultEnvironment', environment, vscode.ConfigurationTarget.Global)
				.then(() => {
					defaultEnvironment = environment;  // Update the default environment in the variable
					environmentProvider.setDefaultEnvironment(environment);
					vscode.window.showInformationMessage(`Default environment set to ${environment}`);
				});
		})
	);

	let disposable = vscode.commands.registerCommand(
		"extension.playwrightTest",
		async (match) => {
			// Fetch the default environment each time the command is executed
			const environment = vscode.workspace.getConfiguration("ortoniPlaywrightTestRunner").get<string>("defaultEnvironment");

			if (!environment) {
				vscode.window.showWarningMessage("No environment selected, test not run.");
				return;
			}
			const envCommand = environments[environment];
			// Create or show terminal
			let terminal: vscode.Terminal;
			try {
				terminal = vscode.window.terminals.length > 0 ? vscode.window.terminals[0] : vscode.window.createTerminal();
				terminal.show();
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to create or show terminal: ${error}`);
				return;
			}

			const testFile = match.testFile;
			const testName = match.testName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&").replace(/\s+/g, "\\s+"); // Escaping special characters
			const endMatch = "$";
			terminal.sendText(`${envCommand} npx playwright test ${testFile} -g "${testName + endMatch}"`);
		}
	);

	const languages = ["typescript", "javascript"];
	const window = vscode.window;
	const isTest = /^\s*(it|test)\s*\(\s*['"]/;
	const isSuite = /^\s*(describe|test\.describe)\s*\(\s*['"]/;
	const isTestNameHasSingleOrDoubleQuotes = /(['"])(.*?)\1/;

	languages.forEach((language) => {
		context.subscriptions.push(
			vscode.languages.registerCodeLensProvider(language, {
				provideCodeLenses: insertRunnerText,
			})
		);
	});

	function insertRunnerText(document: vscode.TextDocument): vscode.CodeLens[] {
		if (!window.activeTextEditor) {
			return [];
		}

		let matches = [];
		const doc = window.activeTextEditor.document;
		const currentlyOpenTabfileName = path.basename(doc.fileName);

		for (let index = 0; index < doc.lineCount; index++) {
			const line = doc.lineAt(index).text;
			if (isTest.test(line)) {
				const testNameMatch = line.match(isTestNameHasSingleOrDoubleQuotes);
				if (testNameMatch) {
					let match = {
						range: new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, line.length)),
						testName: testNameMatch[2],
						testFile: currentlyOpenTabfileName,
						isTestSet: "$(testing-run-icon) Execute Playwright Test",
					};
					matches.push(match);
				}
			} else if (isSuite.test(line)) {
				const testNameMatch = line.match(isTestNameHasSingleOrDoubleQuotes);
				if (testNameMatch) {
					let match = {
						range: new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, line.length)),
						testName: testNameMatch[2],
						testFile: currentlyOpenTabfileName,
						isTestSet: "Execute Playwright Suite",
					};
					matches.push(match);
				}
			}
		}

		return matches.map(
			(match) =>
				new vscode.CodeLens(match.range, {
					title: match.isTestSet,
					command: "extension.playwrightTest",
					arguments: [match],
				})
		);
	}

	context.subscriptions.push(disposable);
}

export function deactivate() { }
