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

## Version 2.0.2


