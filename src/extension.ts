// --- Test List Storage & Helpers ---
let testList: MatchType[] = [];

function addToTestList(test: MatchType) {
  // Avoid duplicates by test name and file
  if (
    !testList.some(
      (t) => t.testName === test.testName && t.testFile === test.testFile
    )
  ) {
    testList.push(test);
    vscode.window.showInformationMessage(`Added to list: ${test.testName}`);
  } else {
    vscode.window.showWarningMessage(`Test already in list: ${test.testName}`);
  }
}

function clearTestList() {
  testList = [];
  vscode.window.showInformationMessage("Test list cleared.");
}

async function runTestList(
  environments: { [key: string]: string },
  defaultEnvironment: string
) {
  if (testList.length === 0) {
    vscode.window.showWarningMessage("Test list is empty.");
    return;
  }
  const envCommand = environments[defaultEnvironment];
  let terminal: vscode.Terminal;
  try {
    terminal =
      vscode.window.terminals.length > 0
        ? vscode.window.terminals[0]
        : vscode.window.createTerminal();
    terminal.show();
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to create or show terminal: ${error}`
    );
    return;
  }

  // Separate feature and non-feature tests
  const featureTests = testList.filter((match) =>
    match.testFile.endsWith(".feature")
  );
  const codeTests = testList.filter(
    (match) => !match.testFile.endsWith(".feature")
  );

  // Run all code tests in a single command
  if (codeTests.length > 0) {
    const regex = /\$\{([^}]*)\}/;
    const additionalParamMatch = envCommand.match(regex);
    const additionalParam = additionalParamMatch ? additionalParamMatch[1] : "";
    const cleanedEnvCommand = additionalParamMatch
      ? envCommand.replace(regex, "").trim()
      : envCommand;
    const testLocations = codeTests
      .map((match) => `${match.testFile}:${match.range.start.line + 1}`)
      .join(" ");
    let fullCommand =
      `${cleanedEnvCommand} npx playwright test ${testLocations}`.trim();
    if (additionalParam) {
      fullCommand += ` ${additionalParam}`;
    }
    terminal.sendText(fullCommand);
  }

  // Run each feature test separately (Cucumber)
  for (const match of featureTests) {
    const scenarioName = match.testName
      .replace(/^(Feature:|Scenario Outline:|Scenario:)\s*/, "")
      .trim();
    let fullCommand = `${envCommand} --name="^${scenarioName}$"`.trim();
    terminal.sendText(fullCommand);
  }

  vscode.window.showInformationMessage("Test list executed.");
}
import * as vscode from "vscode";
import * as path from "path";
import { EnvironmentTreeViewProvider } from "./EnvironmentTreeViewProvider";
import { MatchType } from "./MatchType";
export function activate(context: vscode.ExtensionContext) {
  // Register new commands for test list management
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.addToTestList",
      (match: MatchType) => {
        addToTestList(match);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.runTestList", () => {
      runTestList(environments, defaultEnvironment);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.clearTestList", () => {
      clearTestList();
    })
  );
  // To open setting from the tree view
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.openSettings", () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "ortoniPlaywrightTestRunner.environments"
      );
    })
  );
  const config = vscode.workspace.getConfiguration(
    "ortoniPlaywrightTestRunner"
  );
  let environments = config.get<{ [key: string]: string }>("environments")!;
  let defaultEnvironment = config.get<string>("defaultEnvironment")!;
  const environmentProvider = new EnvironmentTreeViewProvider(
    environments,
    defaultEnvironment
  );

  vscode.window.registerTreeDataProvider(
    "ortoniPlaywrightTestRunner",
    environmentProvider
  );

  // Listen for changes to the 'ortoniPlaywrightTestRunner.environments' setting
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("ortoniPlaywrightTestRunner.environments") ||
        event.affectsConfiguration(
          "ortoniPlaywrightTestRunner.defaultEnvironment"
        )
      ) {
        // Refresh environments and update tree view
        environments = vscode.workspace
          .getConfiguration("ortoniPlaywrightTestRunner")
          .get<{ [key: string]: string }>("environments")!;
        defaultEnvironment = vscode.workspace
          .getConfiguration("ortoniPlaywrightTestRunner")
          .get<string>("defaultEnvironment")!;
        environmentProvider.refresh(environments, defaultEnvironment);
        // Refresh the CodeLenses
        vscode.commands.executeCommand(
          "vscode.executeCodeLensProvider",
          vscode.window.activeTextEditor?.document.uri
        );
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.setDefaultEnvironment",
      (environment: string) => {
        config
          .update(
            "defaultEnvironment",
            environment,
            vscode.ConfigurationTarget.Global
          )
          .then(() => {
            defaultEnvironment = environment; // Update the default environment in the variable
            environmentProvider.setDefaultEnvironment(environment);
            vscode.window.showInformationMessage(
              `Default environment set to ${environment}`
            );
          });
      }
    )
  );

  let disposable = vscode.commands.registerCommand(
    "extension.playwrightTest",
    async (match: MatchType) => {
      // Fetch the default environment each time the command is executed
      const environment = vscode.workspace
        .getConfiguration("ortoniPlaywrightTestRunner")
        .get<string>("defaultEnvironment");

      if (!environment) {
        vscode.window.showWarningMessage(
          "No environment selected, test not run."
        );
        return;
      }
      const envCommand = environments[environment];
      // Create or show terminal
      let terminal: vscode.Terminal;
      try {
        terminal =
          vscode.window.terminals.length > 0
            ? vscode.window.terminals[0]
            : vscode.window.createTerminal();
        terminal.show();
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to create or show terminal: ${error}`
        );
        return;
      }
      const scenarioName = match.testName
        .replace(/^(Feature:|Scenario Outline:|Scenario:)\s*/, "")
        .trim();
      const testFile = match.testFile;
      const testLine = match.range.start.line + 1; // Line numbers are 1-based in the command
      let fullCommand: string;
      if (testFile.endsWith(".feature")) {
        // For Cucumber feature files
        fullCommand = `${envCommand} --name="^${scenarioName}$"`.trim();
      } else {
        const regex = /\$\{([^}]*)\}/;
        const additionalParamMatch = envCommand.match(regex);
        const additionalParam = additionalParamMatch
          ? additionalParamMatch[1]
          : "";
        const cleanedEnvCommand = additionalParamMatch
          ? envCommand.replace(regex, "").trim()
          : envCommand;
        fullCommand =
          `${cleanedEnvCommand} npx playwright test ${testFile}:${testLine}`.trim();
        if (additionalParam) {
          fullCommand += ` ${additionalParam}`;
        }
      }
      terminal.sendText(fullCommand);
    }
  );

  const languages = ["typescript", "javascript", "feature"];
  const window = vscode.window;
  const isScenario = /^\s*(Scenario|Scenario Outline):\s*(.*)/;

  // Enhanced regex to match test definitions with single, double, or backtick quotes (template literals)
  const isTest = /(it|test|test\.only)\s*\(\s*([`'"])([\s\S]*?)\2/;
  const isSuite =
    /(describe|test\.describe|test\.describe.only)\s*\(\s*([`'"])([\s\S]*?)\2/;
  const isTestNameHasQuotesOrTemplate = /([`'"])([\s\S]*?)\1/;

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

      // Suite detection (describe blocks)
      const suiteMatch = line.match(isSuite);
      if (suiteMatch) {
        const suiteNameMatch = line.match(isTestNameHasQuotesOrTemplate);
        if (suiteNameMatch) {
          currentSuiteName = suiteNameMatch[2];
          let match: MatchType = {
            range: new vscode.Range(
              new vscode.Position(index, 0),
              new vscode.Position(index, line.length)
            ),
            testName: suiteNameMatch[2],
            testFile: currentlyOpenTabfileName,
            isTestSet: "Execute Playwright Suite",
          };
          matches.push(match);
        }
      }

      // Test detection (it/test/test.only)
      const testMatch = line.match(isTest);
      if (testMatch) {
        // testMatch[3] contains the test name (supports template literals)
        const testName = testMatch[3].replace(/\s+/g, " ").trim();
        const fullTestName = currentSuiteName
          ? `${currentSuiteName} ${testName}`
          : testName;
        let match: MatchType = {
          range: new vscode.Range(
            new vscode.Position(index, 0),
            new vscode.Position(index, line.length)
          ),
          testName: fullTestName,
          testFile: currentlyOpenTabfileName,
          isTestSet: "$(testing-run-icon) Execute Playwright Test",
        };
        matches.push(match);
      }

      // Cucumber scenario detection
      if (isScenario.test(line)) {
        const scenarioNameMatch = line.match(isScenario);
        if (scenarioNameMatch) {
          let match: MatchType = {
            range: new vscode.Range(
              new vscode.Position(index, 0),
              new vscode.Position(index, line.length)
            ),
            testName: `${scenarioNameMatch[1]}: ${scenarioNameMatch[2]}`,
            testFile: currentlyOpenTabfileName,
            isTestSet: "Execute Cucumber Scenario",
            lineNumber: index + 1,
          };
          matches.push(match);
        }
      }
    }

    // For each match, provide four CodeLenses: Run, Add to List, Run List, Clear List
    return matches.flatMap((match) => [
      new vscode.CodeLens(match.range, {
        title: match.isTestSet,
        command: "extension.playwrightTest",
        arguments: [match],
      }),
      new vscode.CodeLens(match.range, {
        title: "Add to List",
        command: "extension.addToTestList",
        arguments: [match],
      }),
      new vscode.CodeLens(match.range, {
        title: "Run List",
        command: "extension.runTestList",
        arguments: [],
      }),
      new vscode.CodeLens(match.range, {
        title: "Clear List",
        command: "extension.clearTestList",
        arguments: [],
      }),
    ]);
  }

  context.subscriptions.push(disposable);
}

export function deactivate() {}
