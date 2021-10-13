import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const languages = ['typescript', 'javascript'];
	const window = vscode.window;
	// const workspace = vscode.workspace;
	const isTest = /^((\s*)(it|test|)(\s*)\((\s*)('|"))/g;
	// const isSuite = /^((\s*)(test.describe|describe)(\s*)\((\s*)('|"))/g;
	const isTestNameHasSingleOrDoubleQuotes = /(("|')(.*?)("|'))/;
	let disposable = vscode.commands.registerCommand('extension.playwrightTest', (match) => {
		let terminal = window.terminals.length > 0 ? window.terminals[0] : window.createTerminal();
		terminal.show();
		// let testFile = match.testFile;
		// if (testFile !== null) {
		// 	terminal.sendText(`cd "${testFile}"`);
		// }
		const testName = match.testName;
		terminal.sendText(`npx playwright test -g ${testName}`);
	});
	languages.forEach(language => {
		context.subscriptions.push(vscode.languages.registerCodeLensProvider(language, { provideCodeLenses: insertRunnerText }));
	});

	function insertRunnerText() {
		if (!window || !window.activeTextEditor) {
			return;
		}
		let matches = [];
		var doc = window.activeTextEditor.document;
		for (let index = 0; index < doc.lineCount; index++) {
			const line = doc.lineAt(index).text;
			if (isTest.test(line)) {
				const testNameMatch = line.match(isTestNameHasSingleOrDoubleQuotes);
				let match = {
					range: new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, 5)),
					testName: testNameMatch ? testNameMatch[3] : "",
					testFile: null,
					isTestSet: '\$(testing-run-icon) Execute Playwright Test'
				};
				matches.push(match);
			}
			// else if (isSuite.test(line)) {
			// 	const testNameMatch = line.match(isTestNameHasSingleOrDoubleQuotes);
			// 	let match = {
			// 		range: new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, 5)),
			// 		testName: testNameMatch ? testNameMatch[3] : "",
			// 		testFile: doc.fileName,
			// 		isTestSet: 'Execute Playwright Suite'
			// 	};
			// 	matches.push(match);
			// }
		}
		return matches.map(match => new vscode.CodeLens(match.range, {
			title: match.isTestSet,
			command: 'extension.playwrightTest',
			arguments: [match]
		}));
	}
	context.subscriptions.push(disposable);
}


export function deactivate() { }
