# Playwright Runner by Koushik
The Playwright Runner by Koushik VS Code extension simplifies the process of running Playwright tests directly from your editor. With this extension, you can easily execute Playwright tests, manage different test environments, and streamline your testing workflow without leaving VS Code.

### Usage:
1. **Installation**:
   - Install the extension from the Visual Studio Code Marketplace by searching for "Playwright Runner by Koushik" and clicking on "Install".

2. **Setting Up Environments**:
   - Open your user settings (File > Preferences > Settings) and navigate to the extension settings under "Playwright Runner by Koushik".
   - Define your test environments and their corresponding configurations (e.g., development, staging, production).

3. **Running Playwright Tests**:
   - Navigate to your TypeScript or JavaScript test file containing Playwright tests.
   - The extension automatically detects test functions and suites and adds "Run Playwright Test" code lenses.
   - Click on the code lens next to a test to execute it.
   - Choose the desired environment from the prompt, and the test will run with the selected configuration.

4. **Managing Environments**:
   - Access the environment selector from the "Playwright runner by Koushik" view in the Activity Bar.
   - View and select different environments from the tree view.
   - Set the default environment for running tests by right-clicking on an environment and selecting "Set Default Environment".

5. **Customization**:
   - Customize default environment configurations and default settings according to your project's requirements.
   - Use the provided commands and settings to tailor the extension to your testing workflow.

6. **Accessing Settings**:
   - Open the extension settings directly from the editor by executing the "Open Settings" command.
   - Modify environment configurations, default settings, and other preferences conveniently from within VS Code.

### Get Started:
- [Download link](https://marketplace.visualstudio.com/items?itemName=ortoni.ortoni)
- Install the Playwright Runner by Koushik extension.
- Define your test environments and configurations in the extension settings.
- Start running Playwright tests effortlessly from your TypeScript or JavaScript files with just a few clicks!

## Instruction
![Set the environment](https://github.com/ortoniKC/playwright-runner-vscode-extension/assets/58769833/e84545d8-a269-4779-abb4-46cbbd31a344)



### Requirements
* Use GitBash as your default VSCode terminal
* Playwright config file required to execute the test
* Disable the testMatch in config file

## Release Notes
## 1.0.0
- Initial release
## 1.0.1
- Added Regex to identify the unique test
- Added test file name to avoid duplicate tests name
## Version 1.0.1 Improvements
- Basic functionality implemented:
  - Ability to execute Playwright tests directly from the code editor.
  - Support for detecting test and suite names within the code.
## Version 2.0.0
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

**Enjoy!**
