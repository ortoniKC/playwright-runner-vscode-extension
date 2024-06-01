import * as vscode from 'vscode';

export type MatchType = {
    range: vscode.Range;
    testName: string;
    testFile: string;
    isTestSet: string;
    lineNumber?: number;
};
