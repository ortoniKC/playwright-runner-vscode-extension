# Playwright Runner by Koushik
The Playwright Runner by Koushik VS Code extension simplifies the process of running Playwright tests directly from your editor. With this extension, you can easily execute Playwright tests & Cucumber tests, manage different test environments, and streamline your testing workflow without leaving VS Code.

### Usage:
1. **Installation**:
   - Install the extension from the Visual Studio Code Marketplace by searching for "Playwright Runner by Koushik" and clicking on "Install".

2. **Setting Up Environments**:
   - Open your user settings (File > Preferences > Settings) and navigate to the extension settings under "Playwright Runner by Koushik".
   - Define your test environments and their corresponding configurations (e.g., development, staging, production).
   -  Define your cucumber test commands with different environment names

3. **Running Playwright Tests**:
   - Navigate to your TypeScript or JavaScript test file containing Playwright tests.
   - The extension automatically detects test functions and suites and adds "Run Playwright Test" code lenses.
   - Click on the code lens next to a test to execute it.

4. **Running Cucumber scenarios**:
   - Navigate to your feature file
   - The extension automatically detects Scenario & Scenario Outline
   - Click on the code lens next to execute it
   - After clicking it will add the scenario name to the existing command that user already set   

5. **Managing Environments**:
   - Access the environment selector from the "Playwright runner by Koushik" view in the Activity Bar.
   - View and select different environments from the tree view.
   - Set the default environment for running tests
   - Add additional command with ${command}
   ```
    "ENV_NAME": "TEST_ENV=stagingNational ${--config=play.config.ts --headed}",
   ```

6. **Customization**:
   - Customize default environment configurations and default settings according to your project's requirements.
   - Use the provided commands and settings to tailor the extension to your testing workflow.

7. **Accessing Settings**:
   - Open the extension settings directly from the editor side bar by executing the "Open Settings" command.
   - Modify environment configurations, default settings, and other preferences conveniently from within VS Code.

### Get Started:
- [Download link](https://marketplace.visualstudio.com/items?itemName=ortoni.ortoni)
- Install the Playwright Runner by Koushik extension.
- Define your test environments and configurations in the extension settings.
- Start running Playwright tests effortlessly from your TypeScript or JavaScript files with just a few clicks!

## Instruction
![Setings.json](<Set the environment.png>)

### Requirements
* Use GitBash as your default VSCode terminal
* Playwright config file required to execute the test
* Enable the testMatch in config file with test script path
* Cucumber config and other setup is required - It gets only the scenario name and pass it to the terminal

## Release Notes
Refer to the change log section

**Enjoy!**
