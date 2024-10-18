# MentorEd Documentation - Developer Guide

Follow the steps below to generate documentation for a specific release version once a new release is made.

1. **Create New Release Branches**: For each service, create a new release branch. The branch names should follow the pattern `release-x.y.z`. Examples include:
    - `release-2.5.6`
    - `release-2.6.1`
    - `release-3.0.0`
2. **Duplicate and Rename Release Folder**: Duplicate the previous release folder and rename it according to the new release version. For example, if the previous release version was `2.6.1` and the new release version is `3.0.0`, copy the `/documentation/2.6.1` directory and rename it to `3.0.0`.

3. **Update Documentation**: Make the necessary updates to the documentation (Especially download links), environment, and script files within the new release directory.

4. **Generate New Readme File**: Run the `readmeGenerator.js` script to generate the new readme file. Enter the version number when prompted:

    ```
    /documentation$ node readmeGenerator.js
    Enter the version of the documentation (leave blank for latest): 3.0.0
    Updated README successfully written to readmes/README-3.0.0.md
    ```

5. **Update 'Latest' Directory**: If the current release is the latest, update the contents of the `latest` directory with the content from the new release directory.

6. **Generate 'Latest' Readme File**: Run the `readmeGenerator.js` file again to generate the readme file for the latest release. When prompted for the version, leave it blank:

    ```
    /documentation$ node readmeGenerator.js
    Enter the version of the documentation (leave blank for latest):
    Updated README successfully written to readmes/README.md
    ```

7. **Update Repository's Root Readme**: Copy the newly generated `README.md` file and paste it into the root of the repository to serve as the master readme.

**Important Reminder:**

After a release is completed, it's crucial to keep the related release branches, documentation, environment settings, and script files unchanged. Avoid making any additional alterations to these elements once the release is finalized. This helps maintain consistency and reliability in managing different versions and deploying updates.
