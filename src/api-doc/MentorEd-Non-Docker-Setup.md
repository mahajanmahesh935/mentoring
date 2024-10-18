## B. PM2 Managed Services & Natively Installed Dependencies

Expectation: Upon following the prescribed steps, you will achieve a fully operational MentorEd application setup. Both the portal and backend services are managed using PM2, with all dependencies installed natively on the host system.

## Prerequisites

Before setting up the following MentorEd application, dependencies given below should be installed and verified to be running. Refer to the steps given below to install them and verify.

-   **Ubuntu/Linux/Mac**

    1. Download dependency management scripts:
        ```
        curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/check-dependencies.sh && \
        curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/install-dependencies.sh && \
        curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/uninstall-dependencies.sh && \
        chmod +x check-dependencies.sh && \
        chmod +x install-dependencies.sh && \
        chmod +x uninstall-dependencies.sh
        ```
    2. Verify installed dependencies by running `check-dependencies.sh`:

        ```
        ./check-dependencies.sh
        ```

        > Note: Keep note of any missing dependencies.

    3. Install dependencies by running `install-dependencies.sh`:
        ```
        ./install-dependencies.sh
        ```
        > Note: Install all missing dependencies and use check-dependencies script to ensure everything is installed and running.
    4. Uninstall dependencies by running `uninstall-dependencies.sh`:

        ```
        ./uninstall-dependencies.sh
        ```

        > Warning: Due to the destructive nature of the script (without further warnings), it should only be used during the initial setup of the dependencies. For example, Uninstalling PostgreSQL/Citus using script will lead to data loss. USE EXTREME CAUTION.

        > Warning: This script should only be used to uninstall dependencies that were installed via installation script in step 3. If same dependencies were installed using other methods, refrain from using this script. This script is provided in-order to reverse installation in-case issues arise from a bad install.

## Installation

1. **Create Mentoring Directory:** Create a directory named **mentorEd**.

    > Example Command: `mkdir mentorEd && cd mentorEd/`

2. **Git Clone Services And Portal Repositories**

    - **Ubuntu/Linux/Mac**

        ```
        git clone https://github.com/ELEVATE-Project/mentoring.git && \
        git clone https://github.com/ELEVATE-Project/user.git && \
        git clone https://github.com/ELEVATE-Project/notification.git && \
        git clone https://github.com/ELEVATE-Project/interface-service.git && \
        git clone https://github.com/ELEVATE-Project/scheduler.git && \
        git clone -b release-2.5.0 https://github.com/ELEVATE-Project/mentoring-mobile-app.git
        ```

3. **Install NPM Packages**

    - **Ubuntu/Linux/Mac**

        ```
        cd mentoring/src && npm install && cd ../.. && \
        cd user/src && npm install && cd ../.. && \
        cd notification/src && npm install && cd ../.. && \
        cd interface-service/src && npm install && cd ../.. && \
        cd scheduler/src && npm install && cd ../.. && \
        cd mentoring-mobile-app && npm install --force && cd ..
        ```

4. **Download Environment Files**

    - **Ubuntu/Linux/Mac**

        ```
        curl -L -o mentoring/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/envs/local/mentoring_env && \
        curl -L -o user/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/envs/local/user_env && \
        curl -L -o notification/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/envs/local/notification_env && \
        curl -L -o interface-service/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/envs/local/interface_env && \
        curl -L -o scheduler/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/envs/local/scheduler_env && \
        curl -L -o mentoring-mobile-app/src/environments/environment.ts https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/envs/environment.ts
        ```

5. **Create Databases**

    - **Ubuntu/Linux/Mac**
        1. Download `create-databases.sh` Script File:
            ```
            curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/create-databases.sh
            ```
        2. Make the executable by running the following command:
            ```
            chmod +x create-databases.sh
            ```
        3. Run the script file:
            ```
            ./create-databases.sh
            ```

6. **Run Migrations To Create Tables**

    - **Ubuntu/Linux/Mac**
        1. Install Sequelize-cli globally:
            ```
            sudo npm i sequelize-cli -g
            ```
        2. Run Migrations:
            ```
            cd mentoring/src && npx sequelize-cli db:migrate && cd ../.. && \
            cd user/src && npx sequelize-cli db:migrate && cd ../.. && \
            cd notification/src && npx sequelize-cli db:migrate && cd ../..
            ```

7. **Enabling Citus And Setting Distribution Columns (Optional)**

    MentorEd relies on PostgreSQL as its core database system. To boost performance and scalability, users can opt to enable the Citus extension. This transforms PostgreSQL into a distributed database, spreading data across multiple nodes to handle large datasets more efficiently as demand grows.

    1. Download mentoring `distributionColumns.sql` file.

        ```
        curl -o ./mentoring/distributionColumns.sql -L https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/distribution-columns/mentoring/distributionColumns.sql
        ```

    2. Download user `distributionColumns.sql` file.

        ```
        curl -o ./user/distributionColumns.sql -JL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/distribution-columns/user/distributionColumns.sql
        ```

    3. Set up the citus_setup_local file by following the steps given below.

        - **Ubuntu/Linux/Mac**

            1. Download the `citus_setup_local.sh` file:

                ```
                curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/citus_setup_local.sh
                ```

            2. Make the setup file executable by running the following command:

                ```
                chmod +x citus_setup_local.sh
                ```

            3. Enable Citus and set distribution columns for `mentoring` database by running the `citus_setup_local.sh` with the following arguments.
                ```
                ./citus_setup_local.sh mentoring postgres://postgres:postgres@localhost:9700/mentoring
                ```
            4. Enable Citus and set distribution columns for `user` database by running the `citus_setup_local.sh`with the following arguments.
                ```
                ./citus_setup_local.sh user postgres://postgres:postgres@localhost:9700/users
                ```

8. **Insert Initial Data**
   Use MentorEd in-build seeders to insert the initial data.

    ```
    cd mentoring/src && npm run db:seed:all && cd ../.. && \
    cd user/src && npm run db:seed:all && cd ../..
    ```

9. **Start The Services**

    Following the steps given below, 2 instances of each MentorEd backend service will be deployed and be managed by PM2 process manager.

    ```
    cd mentoring/src && pm2 start app.js -i 2 --name mentored-mentoring && cd ../.. && \
    cd user/src && pm2 start app.js -i 2 --name mentored-user && cd ../.. && \
    cd notification/src && pm2 start app.js -i 2 --name mentored-notification && cd ../.. && \
    cd interface-service/src && pm2 start app.js -i 2 --name mentored-interface && cd ../.. && \
    cd scheduler/src && pm2 start app.js -i 2 --name mentored-scheduler && cd ../..
    ```

10. **Run Service Scripts**

    ```
    cd user/src/scripts && node insertDefaultOrg.js && node viewsScript.js && \
    cd mentoring/src/scripts && node psqlFunction.js && node viewsScript.js && cd ../../.. && \
    node -r module-alias/register uploadSampleCSV.js && cd ../../..
    ```

11. **Start The Portal**

    MentorEd portal utilizes Ionic and Angular CLI for building the browser bundle, follow the steps given below to install them and start the portal.

    - **Ubuntu/Linux/Mac**

        1. Install Ionic CLI globally:

            ```
            sudo npm install -g @ionic/cli
            ```

        2. Install Angular CLI globally:

            ```
            sudo npm install -g @angular/cli
            ```

        3. Build the portal
           Navigate to mentoring-mobile-app directory and run:

            ```
            ionic build
            ```

        4. Start the portal:
            ```
            pm2 start pm2.config.json
            ```

    Navigate to http://localhost:7601 to access the MentorEd Portal.
