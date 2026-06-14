import * as vscode from "vscode";
import * as path from "path";
import { EnvironmentTreeViewProvider } from "./EnvironmentTreeViewProvider";
import { MatchType } from "./MatchType";
import { TestListTreeViewProvider } from "./TestListTreeViewProvider";

let testList: MatchType[] = [];
let extensionContext: vscode.ExtensionContext | undefined;
// simple cache for CodeLenses keyed by document uri + version
const codeLensCache: Map<string, vscode.CodeLens[]> = new Map();
// Event emitter so we can force CodeLens provider to refresh immediately
const codeLensEmitter = new vscode.EventEmitter<void>();
// expose a helper for firing later (used in addToTestList/clearTestList)
const fireCodeLensRefresh = () => codeLensEmitter.fire();

async function addToTestList(
  test: MatchType,
  testListProvider?: TestListTreeViewProvider,
) {
  // Avoid duplicates by test name and file
  if (
    !testList.some(
      (t) => t.testName === test.testName && t.testFile === test.testFile,
    )
  ) {
    testList.push(test);
    vscode.window.showInformationMessage(`Added to list: ${test.testName}`);
    try {
      testListProvider?.refresh(testList);
      // persist list (serialize minimal fields)
      try {
        const serialized = testList.map((t) => ({
          testName: t.testName,
          testFile: t.testFile,
          lineNumber: t.lineNumber,
          isTestSet: t.isTestSet,
        }));
        await extensionContext?.workspaceState.update("testList", serialized);
      } catch (err) {
        console.error("Failed to persist testList:", err);
      }
      // clear CodeLens cache so Run List / Clear List appear immediately
      codeLensCache.clear();
      // Force CodeLens refresh so "Run List" & "Clear List" appear immediately
      //   await vscode.commands.executeCommand("editor.action.codeLensRefresh");
      fireCodeLensRefresh();
    } catch (err) {
      console.error("Failed to refresh testList view or code lenses:", err);
    }
  } else {
    vscode.window.showWarningMessage(`Test already in list: ${test.testName}`);
  }
}

async function clearTestList(testListProvider?: TestListTreeViewProvider) {
  testList = [];
  vscode.window.showInformationMessage("Test list cleared.");
  try {
    testListProvider?.refresh(testList);
    try {
      await extensionContext?.workspaceState.update("testList", []);
    } catch (err) {
      console.error("Failed to persist cleared testList:", err);
    }
    codeLensCache.clear();
    // Force CodeLens refresh so Run List / Clear List disappear immediately
    // await vscode.commands.executeCommand("editor.action.codeLensRefresh");
    fireCodeLensRefresh();
  } catch (err) {
    console.error("Failed to refresh testList view or code lenses:", err);
  }
}

async function runTestList(
  environments: { [key: string]: string },
  defaultEnvironment: string,
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
      `Failed to create or show terminal: ${error}`,
    );
    return;
  }

  // Separate feature and non-feature tests
  const featureTests = testList.filter((match) =>
    match.testFile.endsWith(".feature"),
  );
  const codeTests = testList.filter(
    (match) => !match.testFile.endsWith(".feature"),
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
    let coreCommand =
      `${cleanedEnvCommand} npx playwright test ${testLocations}`.trim();
    if (additionalParam) {
      coreCommand += ` ${additionalParam}`;
    }
    const prefix = vscode.workspace
      .getConfiguration("OrtoniRunner")
      .get<string>("prefixCommand", "");
    const suffix = vscode.workspace
      .getConfiguration("OrtoniRunner")
      .get<string>("suffixCommand", "");
    const fullCommand =
      `${prefix ? prefix + " " : ""}${coreCommand}${suffix ? " " + suffix : ""}`.trim();
    terminal.sendText(fullCommand);
  }

  // Run each feature test separately (Cucumber)
  for (const match of featureTests) {
    const scenarioName = match.testName
      .replace(/^(Feature:|Scenario Outline:|Scenario:)\s*/, "")
      .trim();
    const coreCommand = `${envCommand} --name="^${scenarioName}$"`.trim();
    const prefix = vscode.workspace
      .getConfiguration("OrtoniRunner")
      .get<string>("prefixCommand", "");
    const suffix = vscode.workspace
      .getConfiguration("OrtoniRunner")
      .get<string>("suffixCommand", "");
    const fullCommand =
      `${prefix ? prefix + " " : ""}${coreCommand}${suffix ? " " + suffix : ""}`.trim();
    terminal.sendText(fullCommand);
  }
  //   vscode.window.showInformationMessage("Test list executed.");
}

// ------------------ extension activation ------------------
export function activate(context: vscode.ExtensionContext) {
  extensionContext = context;
  // To open setting from the tree view
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.openSettings", () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "OrtoniRunner.environments",
      );
    }),
  );

  const config = vscode.workspace.getConfiguration("OrtoniRunner");
  let environments = config.get<{ [key: string]: string }>("environments")!;
  let defaultEnvironment = config.get<string>("defaultEnvironment")!;

  // Environment provider (existing)
  const environmentProvider = new EnvironmentTreeViewProvider(
    environments,
    defaultEnvironment,
  );

  vscode.window.registerTreeDataProvider("OrtoniRunner", environmentProvider);

  // Test List tree view provider (new)
  const testListProvider = new TestListTreeViewProvider(testList);
  vscode.window.registerTreeDataProvider("ortoniTestList", testListProvider);
  // load persisted testList if available
  try {
    const saved = context.workspaceState.get<Array<any>>("testList", []);
    if (saved && saved.length > 0) {
      testList = saved.map((s) => {
        const line =
          s.lineNumber && typeof s.lineNumber === "number"
            ? s.lineNumber - 1
            : 0;
        return {
          range: new vscode.Range(
            new vscode.Position(line, 0),
            new vscode.Position(line, 0),
          ),
          testName: s.testName || "",
          testFile: s.testFile || "",
          isTestSet: s.isTestSet || "",
          lineNumber: s.lineNumber,
        } as MatchType;
      });
    }
  } catch (err) {
    console.error("Failed to load persisted testList:", err);
  }
  testListProvider.refresh(testList);

  // Listen for changes to the 'OrtoniRunner.environments' setting
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("OrtoniRunner.environments") ||
        event.affectsConfiguration("OrtoniRunner.defaultEnvironment")
      ) {
        // Refresh environments and update tree view
        environments = vscode.workspace
          .getConfiguration("OrtoniRunner")
          .get<{ [key: string]: string }>("environments")!;
        defaultEnvironment = vscode.workspace
          .getConfiguration("OrtoniRunner")
          .get<string>("defaultEnvironment")!;
        environmentProvider.refresh(environments, defaultEnvironment);
        // Refresh the CodeLenses
        vscode.commands.executeCommand(
          "vscode.executeCodeLensProvider",
          vscode.window.activeTextEditor?.document.uri,
        );
      }
    }),
  );

  // setDefaultEnvironment command (existing)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.setDefaultEnvironment",
      (environment: string) => {
        config
          .update(
            "defaultEnvironment",
            environment,
            vscode.ConfigurationTarget.Global,
          )
          .then(() => {
            defaultEnvironment = environment; // Update the default environment in the variable
            environmentProvider.setDefaultEnvironment(environment);
            vscode.window.showInformationMessage(
              `Default environment set to ${environment}`,
            );
          });
      },
    ),
  );

  // register runTest
  let disposable = vscode.commands.registerCommand(
    "extension.runTest",
    async (match: MatchType) => {
      const locationOnly = vscode.workspace
        .getConfiguration("OrtoniRunner")
        .get<boolean>("locationOnly", false);
      const prefixRaw = vscode.workspace
        .getConfiguration("OrtoniRunner")
        .get<string>("prefixCommand", "");
      const suffixRaw = vscode.workspace
        .getConfiguration("OrtoniRunner")
        .get<string>("suffixCommand", "");
      // Fetch the default environment each time the command is executed (may be undefined)
      const environment = vscode.workspace
        .getConfiguration("OrtoniRunner")
        .get<string>("defaultEnvironment");
      const envCommand = environment ? environments[environment] : undefined;

      // Warn if env is missing but prefix/suffix require ${env}
      if (
        !environment &&
        (prefixRaw.includes("${env}") || suffixRaw.includes("${env}"))
      ) {
        vscode.window.showWarningMessage(
          "No environment selected, test not run.",
        );
        return;
      }
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
          `Failed to create or show terminal: ${error}`,
        );
        return;
      }
      const scenarioName = match.testName
        .replace(/^(Feature:|Scenario Outline:|Scenario:)\s*/, "")
        .trim();
      const testFile = match.testFile;
      const testLine = match.range.start.line + 1; // Line numbers are 1-based in the command
      let fullCommand: string;
      const envCommandSafe = envCommand || "";
      if (locationOnly) {
        const core = `${testFile}:${testLine}`;
        fullCommand = composeLocationOnlyCommand(core, envCommandSafe);
      } else if (testFile.endsWith(".feature")) {
        // For Cucumber feature files
        const core = `${envCommandSafe} --name="^${scenarioName}$"`.trim();
        fullCommand = buildFinalCommand(core, envCommandSafe);
      } else {
        const regex = /\$\{([^}]*)\}/;
        const additionalParamMatch = envCommandSafe.match(regex);
        const additionalParam = additionalParamMatch
          ? additionalParamMatch[1]
          : "";
        const cleanedEnvCommand = additionalParamMatch
          ? envCommandSafe.replace(regex, "").trim()
          : envCommandSafe;
        let core =
          `${cleanedEnvCommand} npx playwright test ${testFile}:${testLine}`.trim();
        if (additionalParam) {
          core += ` ${additionalParam}`;
        }
        fullCommand = buildFinalCommand(core, envCommandSafe);
      }
      terminal.sendText(fullCommand);
    },
  );
  context.subscriptions.push(disposable);

  // register CodeLens providers for TS/JS and for .feature files (pattern-based)
  const codeLensProviderObj: vscode.CodeLensProvider = {
    provideCodeLenses: insertRunnerText,
    // VS Code will re-run provideCodeLenses when this event fires
    onDidChangeCodeLenses: codeLensEmitter.event,
  };

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [{ language: "typescript" }, { language: "javascript" }],
      codeLensProviderObj,
    ),
  );

  // register provider for .feature files by glob pattern so it works regardless of languageId
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: "file", pattern: "**/*.feature" },
      codeLensProviderObj,
    ),
  );

  // register test-list related commands so menus work
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.addToTestList",
      (match: MatchType) => {
        addToTestList(match, testListProvider);
      },
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.runTestList", async () => {
      // respect locationOnly config: when true, send only file:line(s)
      const locationOnly = vscode.workspace
        .getConfiguration("OrtoniRunner")
        .get<boolean>("locationOnly", false);
      if (locationOnly) {
        if (testList.length === 0) {
          vscode.window.showWarningMessage("Test list is empty.");
          return;
        }
        let terminal: vscode.Terminal;
        try {
          terminal =
            vscode.window.terminals.length > 0
              ? vscode.window.terminals[0]
              : vscode.window.createTerminal();
          terminal.show();
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to create or show terminal: ${error}`,
          );
          return;
        }
        const locations = testList
          .map((m) => `${m.testFile}:${m.range.start.line + 1}`)
          .join(" ");
        const environment = vscode.workspace
          .getConfiguration("OrtoniRunner")
          .get<string>("defaultEnvironment");
        const envCommand = environment ? environments[environment] : undefined;
        const finalCommand = composeLocationOnlyCommand(
          locations,
          envCommand || "",
        );
        terminal.sendText(finalCommand);
        return;
      }
      runTestList(environments, defaultEnvironment);
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.clearTestList", () => {
      clearTestList(testListProvider);
    }),
  );
}

function parseEnvCommand(envCommand?: string) {
  if (!envCommand) {
    return { envPrefix: "", envSuffix: "" };
  }
  const regex = /\$\{([^}]*)\}/;
  const match = envCommand.match(regex);
  if (match) {
    return {
      envPrefix: envCommand.replace(regex, "").trim(),
      envSuffix: match[1].trim(),
    };
  }
  return { envPrefix: envCommand.trim(), envSuffix: "" };
}

function composeLocationOnlyCommand(coreCommand: string, envCommand?: string) {
  const { envPrefix, envSuffix } = parseEnvCommand(envCommand);
  const prefix = vscode.workspace
    .getConfiguration("OrtoniRunner")
    .get<string>("prefixCommand", "");
  const suffix = vscode.workspace
    .getConfiguration("OrtoniRunner")
    .get<string>("suffixCommand", "");
  const hasEnvPlaceholder =
    prefix.includes("${env}") || suffix.includes("${env}");
  let effectiveCore = coreCommand;
  if (envPrefix && !hasEnvPlaceholder) {
    effectiveCore = `${envPrefix} ${effectiveCore}`.trim();
  }
  if (envSuffix) {
    effectiveCore = `${effectiveCore} ${envSuffix}`.trim();
  }
  return buildFinalCommand(effectiveCore, envPrefix);
}

function buildFinalCommand(coreCommand: string, envCommand?: string) {
  const prefix = vscode.workspace
    .getConfiguration("OrtoniRunner")
    .get<string>("prefixCommand", "");
  const suffix = vscode.workspace
    .getConfiguration("OrtoniRunner")
    .get<string>("suffixCommand", "");
  const { envPrefix } = parseEnvCommand(envCommand);

  const replacedPrefix = envPrefix
    ? prefix.replace(/\$\{env\}/g, envPrefix)
    : prefix;
  const replacedSuffix = envPrefix
    ? suffix.replace(/\$\{env\}/g, envPrefix)
    : suffix;

  return `${replacedPrefix ? replacedPrefix + " " : ""}${coreCommand}${replacedSuffix ? " " + replacedSuffix : ""}`.trim();
}

function insertRunnerText(document: vscode.TextDocument): vscode.CodeLens[] {
  if (!vscode.window.activeTextEditor) {
    return [];
  }

  const cacheKey = `${document.uri.toString()}:${document.version}`;
  const cached = codeLensCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let matches: MatchType[] = [];
  const doc = document;
  const currentlyOpenTabfileName = path.basename(doc.fileName);

  let currentSuiteName: string | null = null;

  for (let index = 0; index < doc.lineCount; index++) {
    const line = doc.lineAt(index).text;

    // Suite detection (describe blocks)
    const suiteMatch = line.match(
      /(describe|test\.describe|test\.describe.only)\s*\(\s*([`'"])([\s\S]*?)\2/,
    );
    if (suiteMatch) {
      const suiteNameMatch = line.match(/([`'"])([\s\S]*?)\1/);
      if (suiteNameMatch) {
        currentSuiteName = suiteNameMatch[2];
        let match: MatchType = {
          range: new vscode.Range(
            new vscode.Position(index, 0),
            new vscode.Position(index, line.length),
          ),
          testName: suiteNameMatch[2],
          testFile: currentlyOpenTabfileName,
          isTestSet: "Execute Playwright Suite",
        };
        matches.push(match);
      }
    }

    // Test detection (it/test/test.only)
    const testMatch = line.match(
      /(it|test|test\.only)\s*\(\s*([`'"])([\s\S]*?)\2/,
    );
    if (testMatch) {
      // testMatch[3] contains the test name (supports template literals)
      const testName = testMatch[3].replace(/\s+/g, " ").trim();
      const fullTestName = currentSuiteName
        ? `${currentSuiteName} ${testName}`
        : testName;
      let match: MatchType = {
        range: new vscode.Range(
          new vscode.Position(index, 0),
          new vscode.Position(index, line.length),
        ),
        testName: fullTestName,
        testFile: currentlyOpenTabfileName,
        isTestSet: "$(testing-run-icon) Execute Playwright Test",
      };
      matches.push(match);
    }

    // Cucumber scenario detection
    if (/^\s*(Scenario|Scenario Outline):\s*(.*)/.test(line)) {
      const scenarioNameMatch = line.match(
        /^\s*(Scenario|Scenario Outline):\s*(.*)/,
      );
      if (scenarioNameMatch) {
        let match: MatchType = {
          range: new vscode.Range(
            new vscode.Position(index, 0),
            new vscode.Position(index, line.length),
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
  // show "Run List" and "Clear List" only if there is at least one test in the list
  // For each match, provide CodeLenses: Run, Add to List, and optionally Run List / Clear List
  const lenses = matches.flatMap((match) => {
    const l: vscode.CodeLens[] = [
      new vscode.CodeLens(match.range, {
        title: match.isTestSet,
        command: "extension.runTest",
        arguments: [match],
      }),
    ];

    if (!match.isTestSet.endsWith("Execute Cucumber Scenario")) {
      l.push(
        new vscode.CodeLens(match.range, {
          title: "Add to List",
          command: "extension.addToTestList",
          arguments: [match],
        }),
      );
    }
    // Only show Run List / Clear List if there is something in the list
    if (
      testList.length > 0 &&
      !match.isTestSet.endsWith("Execute Cucumber Scenario")
    ) {
      l.push(
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
      );
    }

    return l;
  });

  codeLensCache.set(cacheKey, lenses);
  return lenses;
}

export function deactivate() {}
