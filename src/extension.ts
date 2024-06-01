import * as vscode from 'vscode';
import * as path from 'path';
import { EnvironmentTreeViewProvider } from './EnvironmentTreeViewProvider';
import { MatchType } from './MatchType';
export function activate(context: vscode.ExtensionContext) {
	// To open setting from the tree view
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.openSettings', () => {
			vscode.commands.executeCommand('workbench.action.openSettings', 'ortoniPlaywrightTestRunner.environments');
		})
	);
	const config = vscode.workspace.getConfiguration("ortoniPlaywrightTestRunner");
	let environments = config.get<{ [key: string]: string }>("environments")!;
	let defaultEnvironment = config.get<string>("defaultEnvironment")!;
	const environmentProvider = new EnvironmentTreeViewProvider(environments, defaultEnvironment);

	vscode.window.registerTreeDataProvider('ortoniPlaywrightTestRunner', environmentProvider);

	// Listen for changes to the 'ortoniPlaywrightTestRunner.environments' setting
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('ortoniPlaywrightTestRunner.environments') || event.affectsConfiguration('ortoniPlaywrightTestRunner.defaultEnvironment')) {
				// Refresh environments and update tree view
				environments = vscode.workspace.getConfiguration("ortoniPlaywrightTestRunner").get<{ [key: string]: string }>("environments")!;
				defaultEnvironment = vscode.workspace.getConfiguration("ortoniPlaywrightTestRunner").get<string>("defaultEnvironment")!;
				environmentProvider.refresh(environments, defaultEnvironment);
				// Refresh the CodeLenses
				vscode.commands.executeCommand('vscode.executeCodeLensProvider', vscode.window.activeTextEditor?.document.uri);
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
		async (match: MatchType) => {
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
			const scenarioName = match.testName.replace(/^(Feature:|Scenario Outline:|Scenario:)\s*/, '');
			const testFile = match.testFile;
			const testLine = match.range.start.line + 1; // Line numbers are 1-based in the command
			let fullCommand: string;
			if (testFile.endsWith('.feature')) {
				fullCommand = `${envCommand} --name="^${scenarioName.trim()}$"`.trim();
			} else {
				fullCommand = `${envCommand} npx playwright test ${testFile}:${testLine}`.trim();
			}
			terminal.sendText(fullCommand);
		}
	);

	const languages = ["typescript", "javascript", "feature"];
	const window = vscode.window;
	const isScenario = /^\s*(Scenario|Scenario Outline):\s*(.*)/;
	const isTest = /^\s*(it|test|test\.only)\s*\(\s*[\r\n]*\s*['"]/m;
	const isSuite = /^\s*(describe|test\.describe|test\.describe.only)\s*\(\s*[\s\S]*?['"]/m;
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
		const doc = document;
		const currentlyOpenTabfileName = path.basename(doc.fileName);

		let currentSuiteName: string | null = null;

		for (let index = 0; index < doc.lineCount; index++) {
			const line = doc.lineAt(index).text;
			if (isSuite.test(line)) {
				const suiteNameMatch = line.match(isTestNameHasSingleOrDoubleQuotes);
				if (suiteNameMatch) {
					currentSuiteName = suiteNameMatch[2];


					let match: MatchType = {
						range: new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, line.length)),
						testName: suiteNameMatch[2],
						testFile: currentlyOpenTabfileName,
						isTestSet: "Execute Playwright Suite",
					};
					matches.push(match);
				}
			}
			if (isTest.test(line)) {
				const testNameMatch = line.match(isTestNameHasSingleOrDoubleQuotes);
				if (testNameMatch) {
					const fullTestName = currentSuiteName ? `${currentSuiteName} ${testNameMatch[2]}` : testNameMatch[2];
					let match: MatchType = {
						range: new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, line.length)),
						testName: fullTestName,
						testFile: currentlyOpenTabfileName,
						isTestSet: "$(testing-run-icon) Execute Playwright Test",
					};
					matches.push(match);
				}
			}
			if (isScenario.test(line)) {
				const scenarioNameMatch = line.match(isScenario);
				if (scenarioNameMatch) {
					let match: MatchType = {
						range: new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, line.length)),
						testName: `${scenarioNameMatch[1]}: ${scenarioNameMatch[2]}`,
						testFile: currentlyOpenTabfileName,
						isTestSet: "Execute Cucumber Scenario",
						lineNumber: index + 1,
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