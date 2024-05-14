import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
	const languages = ["typescript", "javascript"];
	const window = vscode.window;
	const isTest = /^\s*(it|test)\s*\(\s*['"]/;
	const isSuite = /^\s*(describe|test\.describe)\s*\(\s*['"]/;
	const isTestNameHasSingleOrDoubleQuotes = /(['"])(.*?)\1/;

	let disposable = vscode.commands.registerCommand(
		"extension.playwrightTest",
		async (match) => {
			// Prompt the user to select an environment
			const environment = await vscode.window.showQuickPick(
				["Develop", "Staging", "Production"],
				{
					placeHolder: "Select the environment to run the test",
				}
			);

			if (!environment) {
				vscode.window.showWarningMessage(
					"No environment selected, test not run."
				);
				return;
			}

			// Read environment configuration from settings
			const config = vscode.workspace.getConfiguration("playwrightTestRunner");
			const envMap = config.get<{ [key: string]: string }>("environments");

			if (!envMap) {
				vscode.window.showErrorMessage(
					"Environment configuration is missing or incorrect."
				);
				return;
			}

			const env = envMap[environment];
			if (!env) {
				vscode.window.showErrorMessage(
					`Unknown environment selected: ${environment}`
				);
				return;
			}

			// Create or show terminal
			let terminal: vscode.Terminal;
			try {
				terminal =
					window.terminals.length > 0
						? window.terminals[0]
						: window.createTerminal();
				terminal.show();
	  } catch (error) {
		  vscode.window.showErrorMessage(
			  `Failed to create or show terminal: ${error}`
		  );
		  return;
	  }

		const testFile = match.testFile;
		const testName = match.testName
			.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
			.replace(/\s+/g, "\\s+"); // Escaping special characters
		const endMatch = "$";
		  terminal.sendText(
			  `${env} npx playwright test ${testFile} -g "${testName + endMatch}"`
		  );
	  }
  );

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
				  range: new vscode.Range(
					  new vscode.Position(index, 0),
					  new vscode.Position(index, line.length)
				  ),
				  testName: testNameMatch[2],
				  testFile: currentlyOpenTabfileName,
				  isTestSet: "$(testing-run-icon) Execute Playwright Test",
			  };
			  matches.push(match);
		  }
	  } else if (isSuite.test(line)) {
		  // Uncommented this section to handle test suites
		  const testNameMatch = line.match(isTestNameHasSingleOrDoubleQuotes);
		  if (testNameMatch) {
			let match = {
			  range: new vscode.Range(
				  new vscode.Position(index, 0),
				  new vscode.Position(index, line.length)
			  ),
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
