# Change Log
All notable changes to this project will be documented in this file.

## 1.0.0
- Initial release

## 1.0.1
- Added Regex to identify the unique test
- Added test file name to avoid duplicate tests name

#### Version 1.0.0
- Basic functionality implemented:
  - Ability to execute Playwright tests directly from the code editor.
  - Support for detecting test and suite names within the code.
    
#### Version 2.0.0
- **Added**: Customizable environment variables through the VSCode settings UI.
  - Users can now configure environment variables for different environments (`Development`, `Staging`, `Production`) via the settings UI.
  - The extension now reads these environment variables and sets the `TEST_ENV` variable accordingly when executing tests.
- **Improved**: Flexibility and user-friendliness of the extension.
  - Users can easily customize environment variables to suit their development and staging environments.
  - Enhanced user experience by providing a UI-based approach for configuring settings.
- **Fixed**: Minor bugs and issues.
  - Resolved issues related to hardcoding environment variables, improving code maintainability and scalability.

## Version 2.0.1

- Updated extension to ensure compatibility with the latest VS Code API.
- Improved error handling and error messages for better user experience.
- Enhanced documentation and added a detailed README file.
    - Implemented a command extension.openSettings to easily access the extension settings from the editor.
    - Introduced environment tree view functionality using EnvironmentTreeViewProvider for managing test environments.
    - Registered event listeners to handle changes to the ortoniPlaywrightTestRunner.environments setting and automatically refresh the tree view.
    - Added the setDefaultEnvironment command to set the default environment for running tests.
    - Modified the extension.playwrightTest command to utilize the selected environment configuration when executing Playwright tests.

## Version 2.0.3

**Enhancements**
- Improved Command Execution: Commands are now dynamically generated and executed in the terminal, with proper escaping for special characters in test names.
- Robust CodeLens Support: Enhanced CodeLens support for individual tests and test.describe blocks, ensuring accurate command generation and execution.
- Real-time Updates: CodeLenses now refresh in real-time when environment settings are updated, ensuring the latest configurations are always in use.

**Bug Fixes**
- Execution support on older version of VS Code editor
- Terminal Handling: Fixed issues where commands would not execute properly if a terminal was already running a command.
- Special Character Escaping: Corrected problems with escaping special characters in test names, ensuring accurate test execution.
- Suite Execution: Resolved issues where tests within test.describe blocks would not execute correctly, ensuring all tests are properly prefixed and matched.

**Known Issues**
- Partial Test Name Matches: In some cases, tests with similar names might cause multiple tests to run. Ensure test names are unique to avoid this issue.

## Verison 2.0.4
**Added**
- Line Number Execution: Now the extension executes tests based on the file name and line number,    providing more accurate test execution.
- Dynamic Configuration Updates: Automatically refreshes environments and configurations without restarting VS Code.
**Fixed**
-- Command Execution: Resolved issues where the grep command failed for certain test names.
Improved
-- CodeLens Integration: Enhanced CodeLens to support both individual tests and test suites, ensuring more seamless test management.

## Version 2.0.5
**Added**
- Code lens for Cucumber Scenario & Scenario Outline files