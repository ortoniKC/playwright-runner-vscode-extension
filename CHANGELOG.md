# Change Log
All notable changes to this project will be documented in this file.

## [1.0.0] 14-10-2021
- Initial release

## [1.0.1] 16-10-2021
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

This change log outlines the key updates and improvements introduced in version 1.1.0 of the extension, focusing on the addition of customizable environment variables and improvements in flexibility and user experience.
