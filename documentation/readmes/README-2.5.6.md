<div align="center">

# Mentor Service

<a href="https://shikshalokam.org/elevate/">
<img
    src="https://shikshalokam.org/wp-content/uploads/2021/06/elevate-logo.png"
    height="140"
    width="300"
  />
</a>

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/ELEVATE-Project/mentoring/tree/master.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/gh/ELEVATE-Project/mentoring/tree/master)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=ELEVATE-Project_mentoring&metric=duplicated_lines_density&branch=master)](https://sonarcloud.io/summary/new_code?id=ELEVATE-Project_mentoring)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ELEVATE-Project_mentoring&metric=coverage)](https://sonarcloud.io/summary/new_code?id=ELEVATE-Project_mentoring)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=ELEVATE-Project_mentoring&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=ELEVATE-Project_mentoring)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![Docs](https://img.shields.io/badge/Docs-success-informational)](https://elevate-docs.shikshalokam.org/mentorEd/intro)

![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/ELEVATE-Project/mentoring?filename=src%2Fpackage.json)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

<details><summary>CircleCI insights</summary>

[![CircleCI](https://dl.circleci.com/insights-snapshot/gh/ELEVATE-Project/mentoring/master/buil-and-test/badge.svg?window=30d)](https://app.circleci.com/insights/github/ELEVATE-Project/mentoring/workflows/buil-and-test/overview?branch=integration-testing&reporting-window=last-30-days&insights-snapshot=true)

</details>

<details><summary>develop</summary>

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/ELEVATE-Project/mentoring/tree/develop.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/gh/ELEVATE-Project/mentoring/tree/develop)
![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/ELEVATE-Project/mentoring/develop?filename=src%2Fpackage.json)

[![CircleCI](https://dl.circleci.com/insights-snapshot/gh/ELEVATE-Project/mentoring/dev/buil-and-test/badge.svg?window=30d)](https://app.circleci.com/insights/github/ELEVATE-Project/mentoring/workflows/buil-and-test/overview?branch=develop&reporting-window=last-30-days&insights-snapshot=true)

[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=ELEVATE-Project_mentoring&metric=duplicated_lines_density&branch=develop)](https://sonarcloud.io/summary/new_code?id=ELEVATE-Project_mentoring)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ELEVATE-Project_mentoring&metric=coverage&branch=develop)](https://sonarcloud.io/summary/new_code?id=ELEVATE-Project_mentoring)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=ELEVATE-Project_mentoring&metric=vulnerabilities&branch=develop)](https://sonarcloud.io/summary/new_code?id=ELEVATE-Project_mentoring)

</details>

</br>
The Mentor building block enables effective mentoring interactions between mentors and mentees. The capability aims to create a transparent eco-system to learn, connect, solve, and share within communities. Mentor is an open source mentoring application that facilitates peer learning and professional development by creating a community of mentors and mentees.

</div>
<!-- [![CircleCI](https://dl.circleci.com/status-badge/img/gh/ELEVATE-Project/mentoring/tree/dev.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/gh/ELEVATE-Project/mentoring/tree/dev)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=ELEVATE-Project_mentoring&metric=duplicated_lines_density&branch=master)](https://sonarcloud.io/summary/new_code?id=ELEVATE-Project_mentoring)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=ELEVATE-Project_mentoring&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=ELEVATE-Project_mentoring)
<a href="https://shikshalokam.org/elevate/">
<img
    src="https://shikshalokam.org/wp-content/uploads/2021/06/elevate-logo.png"
    height="140"
    width="300"
   align="right"
  />
</a>
(Dev)
 -->

# System Requirements

-   **Operating System:** Ubuntu 22/Windows 11/macos 12
-   **Node.js®:** v20
-   **PostgreSQL:** 16
-   **Apache Kafka®:** 3.5.0

# Setup Options

**Elevate services can be setup in local using two methods:**

<details><summary>Dockerized Services & Dependencies Using Docker-Compose File</summary>

## Dockerized Services & Dependencies

Expectation: Upon following the prescribed steps, you will achieve a fully operational MentorEd application setup, complete with both the portal and backend services.

## Prerequisites

To set up the MentorEd application, ensure you have Docker and Docker Compose installed on your system. For Ubuntu users, detailed installation instructions for both can be found in the documentation here: [How To Install and Use Docker Compose on Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-compose-on-ubuntu-20-04). For Windows and MacOS users, you can refer to the Docker documentation for installation instructions: [Docker Compose Installation Guide](https://docs.docker.com/compose/install/). Once these prerequisites are in place, you're all set to get started with setting up the MentorEd application.

## Installation

1.  **Create mentoring Directory:** Create a directory named **mentoring**.

    > Example Command: `mkdir mentoring && cd mentoring/`

2.  **Download Docker Compose File:** Retrieve the **[docker-compose-mentoring.yml](https://github.com/ELEVATE-Project/mentoring/blob/master/src/scripts/setup/docker-compose-mentoring.yml)** file from the Mentoring repository and save it to the mentoring directory.

    ```
    curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/docker-compose-mentoring.yml
    ```

    > Note: All commands are run from the mentoring directory.

    Directory structure:

    ```
    ./mentoring
    └── docker-compose-mentoring.yml
    ```

3.  **Download Environment Files**: Using the OS specific commands given below, download environment files for all the services.

    -   **Ubuntu/Linux/Mac**
        ```
        curl -L \
         -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/interface_env \
         -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/mentoring_env \
         -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/notification_env \
         -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/scheduler_env \
         -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/user_env \
         -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/environment.ts
        ```
    -   **Windows**

        ```
        curl -L ^
            -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/interface_env ^
            -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/mentoring_env ^
            -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/notification_env ^
            -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/scheduler_env ^
            -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/user_env ^
            -O https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/envs/environment.ts
        ```

    > **Note:** Modify the environment files as necessary for your deployment using any text editor, ensuring that the values are appropriate for your environment. The default values provided in the current files are functional and serve as a good starting point. Refer to the sample env files provided at the [Mentoring](https://github.com/ELEVATE-Project/mentoring/blob/master/src/.env.sample), [User](https://github.com/ELEVATE-Project/user/blob/master/src/.env.sample), [Notification](https://github.com/ELEVATE-Project/notification/blob/master/src/.env.sample), [Scheduler](https://github.com/ELEVATE-Project/scheduler/blob/master/src/.env.sample), and [Interface](https://github.com/ELEVATE-Project/interface-service/blob/main/src/.env.sample) repositories for reference.

    > **Caution:** While the default values in the downloaded environment files enable the MentorEd Application to operate, certain features may not function correctly or could be impaired unless the adopter-specific environment variables are properly configured.
    >
    > For detailed instructions on adjusting these values, please consult the **[MentorEd Environment Variable Modification Guide](https://github.com/ELEVATE-Project/mentoring/blob/master/documentation/2.5.6/MentorEd-Env-Modication-README.md)**.

    > **Important:** As mentioned in the above linked document, the **User SignUp** functionality may be compromised if key environment variables are not set correctly during deployment. If you opt to skip this setup, consider using the sample user account generator detailed in the `Sample User Accounts Generation` section of this document.

4.  **Download `replace_volume_path` Script File**

    -   **Ubuntu/Linux/Mac**

        ```
        curl -OJL https://raw.githubusercontent.com/ELEVATE-Project/mentoring/master/documentation/2.5.6/dockerized/scripts/mac-linux/replace_volume_path.sh
        ```

    -   **Windows**

        ```
        curl -OJL https://raw.githubusercontent.com/ELEVATE-Project/mentoring/master/documentation/2.5.6/dockerized/scripts/windows/replace_volume_path.bat
        ```

5.  **Run `replace_volume_path` Script File**

    -   **Ubuntu/Linux/Mac**
        1. Make the `replace_volume_path.sh` file an executable.
            ```
            chmod +x replace_volume_path.sh
            ```
        2. Run the script file using the following command.
            ```
            ./replace_volume_path.sh
            ```
    -   **Windows**

        Run the script file either by double clicking it or by executing the following command from the terminal.

        ```
        replace_volume_path.bat
        ```

        > **Note**: The provided script file replaces the host path for the **portal** service container volume in the `docker-compose-mentoring.yml` file with your current directory path.
        >
        > volumes:
        >
        > \- /home/joffin/elevate/backend/environment.ts:/app/src/environments/environment.ts

6.  **Download `docker-compose-up` & `docker-compose-down` Script Files**

    -   **Ubuntu/Linux/Mac**

        1. Download the files.

            ```
            curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/scripts/mac-linux/docker-compose-up.sh
            ```

            ```
            curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/scripts/mac-linux/docker-compose-down.sh
            ```

        2. Make the files executable by running the following commands.

            ```
            chmod +x docker-compose-up.sh
            ```

            ```
            chmod +x docker-compose-down.sh
            ```

    -   **Windows**

        ```
        curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/scripts/windows/docker-compose-up.bat
        ```

        ```
        curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/scripts/windows/docker-compose-down.bat
        ```

7.  **Run All Services & Dependencies:** All services and dependencies can be started using the `docker-compose-up` script file.

    -   **Ubuntu/Linux/Mac**
        ```
        ./docker-compose-up.sh
        ```
    -   **Windows**

        ```
        docker-compose-up.bat
        ```

        > Double-click the file or run the above command from the terminal.

        > **Note**: During the first Docker Compose run, the database, migration seeder files, and the script to set the default organization will be executed automatically.

8.  **Access The MentorEd Application**: Once the services are up and the front-end app bundle is built successfully, navigate to **[localhost:8100](http://localhost:8100/)** to access the MentorEd app.
9.  **Gracefully Stop All Services & Dependencies:** All containers which are part of the docker-compose can be gracefully stopped by pressing `Ctrl + c` in the same terminal where the services are running.
10. **Remove All Service & Dependency Containers**: All docker containers can be stopped and removed by using the `docker-compose-down` file.

    -   **Ubuntu/Linux/Mac**
        ```
        ./docker-compose-down.sh
        ```
    -   **Windows**

        ```
        docker-compose-down.bat
        ```

        > **Caution**: As per the default configuration in the `docker-compose-mentoring.yml` file, using the `down` command will lead to data loss since the database container does not persist data. To persist data across `down` commands and subsequent container removals, refer to the "Persistence of Database Data in Docker Containers" section of this documentation.

## Enable Citus Extension

MentorEd relies on PostgreSQL as its core database system. To boost performance and scalability, users can opt to enable the Citus extension. This transforms PostgreSQL into a distributed database, spreading data across multiple nodes to handle large datasets more efficiently as demand grows.

For more information, refer **[Citus Data](https://www.citusdata.com/)**.

To enable the Citus extension for mentoring and user services, follow these steps.

1. Create a sub-directory named `mentoring` and download `distributionColumns.sql` into it.
    ```
    mkdir mentoring && curl -o ./mentoring/distributionColumns.sql -JL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/distribution-columns/mentoring/distributionColumns.sql
    ```
2. Create a sub-directory named `user` and download `distributionColumns.sql` into it.
    ```
    mkdir user && curl -o ./user/distributionColumns.sql -JL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/distribution-columns/user/distributionColumns.sql
    ```
3. Set up the citus_setup file by following the steps given below.

    - **Ubuntu/Linux/Mac**

        1. Download the `citus_setup.sh` file.

            ```
            curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/scripts/mac-linux/citus_setup.sh
            ```

        2. Make the setup file executable by running the following command.

            ```
            chmod +x citus_setup.sh
            ```

        3. Enable Citus and set distribution columns for `mentoring` database by running the `citus_setup.sh`with the following arguments.
            ```
            ./citus_setup.sh mentoring postgres://postgres:postgres@citus_master:5432/mentoring
            ```
        4. Enable Citus and set distribution columns for `user` database by running the `citus_setup.sh`with the following arguments.
            ```
            ./citus_setup.sh user postgres://postgres:postgres@citus_master:5432/user
            ```

    - **Windows**
        1. Download the `citus_setup.bat` file.
            ```
             curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/dockerized/scripts/windows/citus_setup.bat
            ```
        2. Enable Citus and set distribution columns for `mentoring` database by running the `citus_setup.bat`with the following arguments.
            ```
            citus_setup.bat mentoring postgres://postgres:postgres@citus_master:5432/mentoring
            ```
        3. Enable Citus and set distribution columns for `user` database by running the `citus_setup.bat`with the following arguments.
            ```
            citus_setup.bat user postgres://postgres:postgres@citus_master:5432/user
            ```
            > **Note:** Since the `citus_setup.bat` file requires arguments, it must be run from a terminal.

## Persistence of Database Data in Docker Container

To ensure the persistence of database data when running `docker compose down`, it is necessary to modify the `docker-compose-mentoring.yml` file according to the steps given below:

1. **Modification of the `docker-compose-mentoring.yml` File:**

    Begin by opening the `docker-compose-mentoring.yml` file. Locate the section pertaining to the Citus container and proceed to uncomment the volume specification. This action is demonstrated in the snippet provided below:

    ```yaml
    citus:
        image: citusdata/citus:11.2.0
        container_name: 'citus_master'
        ports:
            - 5432:5432
        volumes:
            - citus-data:/var/lib/postgresql/data
    ```

2. **Uncommenting Volume Names Under the Volumes Section:**

    Next, navigate to the volumes section of the file and proceed to uncomment the volume names as illustrated in the subsequent snippet:

    ```yaml
    networks:
        elevate_net:
            external: false

    volumes:
        citus-data:
    ```

By implementing these adjustments, the configuration ensures that when the `docker-compose down` command is executed, the database data is securely stored within the specified volumes. Consequently, this data will be retained and remain accessible, even after the containers are terminated and subsequently reinstated using the `docker-compose up` command.

## Sample User Accounts Generation

During the initial setup of MentorEd services with the default configuration, you may encounter issues creating new accounts through the regular SignUp flow on the MentorEd portal. This typically occurs because the default SignUp process includes OTP verification to prevent abuse. Until the notification service is configured correctly to send actual emails, you will not be able to create new accounts.

In such cases, you can generate sample user accounts using the steps below. This allows you to explore the MentorEd services and portal immediately after setup.

> **Warning:** Use this generator only immediately after the initial system setup and before any normal user accounts are created through the portal. It should not be used under any circumstances thereafter.

1. **Download The `sampleData.sql` Files:**

    - **Ubuntu/Linux/Mac**

        ```
        mkdir -p sample-data/mentoring sample-data/user && \
        curl -L https://raw.githubusercontent.com/ELEVATE-Project/mentoring/master/documentation/2.5.6/sample-data/mac-linux/mentoring/sampleData.sql -o sample-data/mentoring/sampleData.sql && \
        curl -L https://raw.githubusercontent.com/ELEVATE-Project/mentoring/master/documentation/2.5.6/sample-data/mac-linux/user/sampleData.sql -o sample-data/user/sampleData.sql
        ```

    - **Windows**

        ```
        mkdir sample-data\mentoring 2>nul & mkdir sample-data\user 2>nul & ^
        curl -L "https://raw.githubusercontent.com/ELEVATE-Project/mentoring/master/documentation/2.5.6/sample-data/windows/mentoring/sampleData.sql" -o sample-data\mentoring\sampleData.sql & ^
        curl -L "https://raw.githubusercontent.com/ELEVATE-Project/mentoring/master/documentation/2.5.6/sample-data/windows/user/sampleData.sql" -o sample-data\user\sampleData.sql
        ```

2. **Download The `insert_sample_data` Script File:**

    - **Ubuntu/Linux/Mac**

        ```
        curl -L -o insert_sample_data.sh https://raw.githubusercontent.com/ELEVATE-Project/mentoring/master/documentation/2.5.6/dockerized/scripts/mac-linux/insert_sample_data.sh && chmod +x insert_sample_data.sh
        ```

    - **Windows**

        ```
        curl -L -o insert_sample_data.bat https://raw.githubusercontent.com/ELEVATE-Project/mentoring/master/documentation/2.5.6/dockerized/scripts/windows/insert_sample_data.bat
        ```

3. **Run The `insert_sample_data` Script File:**

    - **Ubuntu/Linux/Mac**

        ```
        ./insert_sample_data.sh user postgres://postgres:postgres@citus_master:5432/user && \
        ./insert_sample_data.sh mentoring postgres://postgres:postgres@citus_master:5432/mentoring
        ```

    - **Windows**

        ```
        insert_sample_data.bat user postgres://postgres:postgres@citus_master:5432/user & ^
        insert_sample_data.bat mentoring postgres://postgres:postgres@citus_master:5432/mentoring
        ```

    After successfully running the script mentioned above, the following user accounts will be created and available for login:

    | Email ID                 | Password   | Role               |
    | ------------------------ | ---------- | ------------------ |
    | aaravpatel@example.com   | Password1@ | Mentee             |
    | arunimareddy@example.com | Password1@ | Mentor             |
    | aaravpatel@example.com   | Password1@ | Organization Admin |


</details>

<details>
<summary>Natively Installed Services & Dependencies </summary>

## PM2 Managed Services & Natively Installed Dependencies

Expectation: Upon following the prescribed steps, you will achieve a fully operational MentorEd application setup. Both the portal and backend services are managed using PM2, with all dependencies installed natively on the host system.

## Prerequisites

Before setting up the following MentorEd application, dependencies given below should be installed and verified to be running. Refer to the steps given below to install them and verify.

-   **Ubuntu/Linux**

    1. Download dependency management scripts:
        ```
        curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/scripts/linux/check-dependencies.sh && \
        curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/scripts/linux/install-dependencies.sh && \
        curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/scripts/linux/uninstall-dependencies.sh && \
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

-   **MacOS**

    1. Install Node.js 20:

        ```
        brew install node@20
        ```

        ```
        brew link --overwrite node@20
        ```

    2. Install Kafka:

        ```
        brew install kafka
        ```

        ```
        brew services start kafka
        ```

    3. Install PostgreSQL 16:

        ```
        brew install postgresql@16
        ```

        ```
        brew services start postgresql@16
        ```

    4. Install PM2:

        ```
        sudo npm install pm2@latest -g
        ```

    5. Install Redis:

        ```
        brew install redis
        ```

        ```
        brew services start redis
        ```

    6. Download `check-dependencies.sh` file:

        ```
        curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/scripts/macos/check-dependencies.sh && \
        chmod +x check-dependencies.sh
        ```

    7. Verify installed dependencies by running `check-dependencies.sh`:

        ```
        ./check-dependencies.sh
        ```

-   **Windows**

    1. Install Node.js 20:

        Download and install Node.js v20 for Windows platform (x64) from official [Node.js download page](https://nodejs.org/en/download).

    2. Install Kafka 3.5.0:

        1. Adapt the instructions given in the following ["Apache Kafka on Windows"](https://www.conduktor.io/kafka/how-to-install-apache-kafka-on-windows/) documentation to install Kafka version 3.5.0.

            > Note: As per the instructions, Kafka server and Zookeeper has to be kept active on different WSL terminals for the entire lifetime of MentorEd services.

            > Note: Multiple WSL terminals can be opened by launching `Ubuntu` from start menu.

        2. Open a new WSL terminal and execute the following command to get the IP of the WSL instance.

            ```
            ip addr show eth0
            ```

            Sample Output:

            ```
            2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1492 qdisc mq state UP group default qlen 1000
            link/ether 11:56:54:f0:as:vf brd ff:ff:ff:ff:ff:ff
            inet 172.12.46.150/20 brd 172.24.79.255 scope global eth0
                valid_lft forever preferred_lft forever
            inet6 fe80::215:5dff:fee7:dc52/64 scope link
                valid_lft forever preferred_lft forever
            ```

            Keep note of the IP address shown alongside `inet`. In the above case, `172.12.46.150` is IP address of the WSL instance.

        3. In the same WSL terminal, navigate to `config` directory of Kafka from step 1 and make the following changes to `server.properties` file.

            - Uncomment `listeners=PLAINTEXT://:9092` line and change it to `listeners=PLAINTEXT://0.0.0.0:9092` to allow connections from any IP.

            - Uncomment `advertised.listeners` line and set it to `advertised.listeners=PLAINTEXT://172.12.46.150:9092`. Replace `172.12.46.150` with the actual IP address of your WSL instance.

        4. Restart the Zookeeper and Kafka Server from their own WSL terminals from step 1.

    3. Install Redis:

        1. Follow the instructions given in the official [Redis Documentation](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/install-redis-on-windows/) to install Redis using WSL.

        2. Using the WSL terminal, open the Redis configuration file in a text editor, such as nano:

            ```
            sudo nano /etc/redis/redis.conf
            ```

        3. Find the line containing `bind 127.0.0.1 ::1` and change it to `bind 0.0.0.0 ::.`. This change allows Redis to accept connections from any IP address. Then save and exit the file.

        4. Restart Redis to apply the changes:

            ```
            sudo service redis-server restart
            ```

    4. Install PM2:

        ```
        npm install pm2@latest -g
        ```

    5. Install PostgreSQL 16:

        1. Download and install PostgreSQL 16 from [EnterpriseDB PostgreSQL](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) download page.

            > Note: Set username and password for the default database to be 'postgres' during installation.

        2. Once installed, Add `C:\Program Files\PostgreSQL\16\bin` to windows environment variables. Refer [here](https://www.computerhope.com/issues/ch000549.htm) or [here](https://stackoverflow.com/a/68851621) for more information regarding how to set it.

## Installation

1. **Create Mentoring Directory:** Create a directory named **mentorEd**.

    > Example Command: `mkdir mentorEd && cd mentorEd/`

2. **Git Clone Services And Portal Repositories**

    - **Ubuntu/Linux/MacOS**

        ```
        git clone -b release-2.5.6 https://github.com/ELEVATE-Project/mentoring.git && \
        git clone -b release-2.5.6 https://github.com/ELEVATE-Project/user.git && \
        git clone -b release-2.5.6 https://github.com/ELEVATE-Project/notification.git && \
        git clone -b release-2.5.6 https://github.com/ELEVATE-Project/interface-service.git && \
        git clone -b release-2.5.6 https://github.com/ELEVATE-Project/scheduler.git && \
        git clone -b release-2.5.0 https://github.com/ELEVATE-Project/mentoring-mobile-app.git
        ```

    - **Windows**

        ```
        git clone -b release-2.5.6 https://github.com/ELEVATE-Project/mentoring.git & ^
        git clone -b release-2.5.6 https://github.com/ELEVATE-Project/user.git & ^
        git clone -b release-2.5.6 https://github.com/ELEVATE-Project/notification.git & ^
        git clone -b release-2.5.6 https://github.com/ELEVATE-Project/interface-service.git & ^
        git clone -b release-2.5.6 https://github.com/ELEVATE-Project/scheduler.git & ^
        git clone -b release-2.5.0 https://github.com/ELEVATE-Project/mentoring-mobile-app.git
        ```

3. **Install NPM Packages**

    - **Ubuntu/Linux/MacOS**

        ```
        cd mentoring/src && npm install && cd ../.. && \
        cd user/src && npm install && cd ../.. && \
        cd notification/src && npm install && cd ../.. && \
        cd interface-service/src && npm install && cd ../.. && \
        cd scheduler/src && npm install && cd ../.. && \
        cd mentoring-mobile-app && npm install --force && cd ..
        ```

    - **Windows**

        ```
        cd mentoring\src & npm install & cd ..\.. & ^
        cd user\src & npm install & cd ..\.. & ^
        cd notification\src & npm install & cd ..\.. & ^
        cd interface-service\src & npm install & cd ..\.. & ^
        cd scheduler\src & npm install & cd ..\.. & ^
        cd mentoring-mobile-app & npm install --force & cd ..
        ```

4. **Download Environment Files**

    - **Ubuntu/Linux**

        ```
        curl -L -o mentoring/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/mentoring_env && \
        curl -L -o user/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/user_env && \
        curl -L -o notification/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/notification_env && \
        curl -L -o interface-service/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/interface_env && \
        curl -L -o scheduler/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/scheduler_env && \
        curl -L -o mentoring-mobile-app/src/environments/environment.ts https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/environment.ts
        ```

    - **MacOS**

        ```
        curl -L -o mentoring/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/non-citus/mentoring_env && \
        curl -L -o user/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/non-citus/user_env && \
        curl -L -o notification/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/non-citus/notification_env && \
        curl -L -o interface-service/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/interface_env && \
        curl -L -o scheduler/src/.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/scheduler_env && \
        curl -L -o mentoring-mobile-app/src/environments/environment.ts https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/environment.ts
        ```

    - **Windows**

        ```
        curl -L -o mentoring\src\.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/non-citus/mentoring_env & ^
        curl -L -o user\src\.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/non-citus/user_env & ^
        curl -L -o notification\src\.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/non-citus/notification_env & ^
        curl -L -o interface-service\src\.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/interface_env & ^
        curl -L -o scheduler\src\.env https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/scheduler_env & ^
        curl -L -o mentoring-mobile-app\src\environments\environment.ts https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/envs/environment.ts
        ```

    > **Note:** Modify the environment files as necessary for your deployment using any text editor, ensuring that the values are appropriate for your environment. The default values provided in the current files are functional and serve as a good starting point. Refer to the sample env files provided at the [Mentoring](https://github.com/ELEVATE-Project/mentoring/blob/master/src/.env.sample), [User](https://github.com/ELEVATE-Project/user/blob/master/src/.env.sample), [Notification](https://github.com/ELEVATE-Project/notification/blob/master/src/.env.sample), [Scheduler](https://github.com/ELEVATE-Project/scheduler/blob/master/src/.env.sample), and [Interface](https://github.com/ELEVATE-Project/interface-service/blob/main/src/.env.sample) repositories for reference.

    > **Caution:** While the default values in the downloaded environment files enable the MentorEd Application to operate, certain features may not function correctly or could be impaired unless the adopter-specific environment variables are properly configured.
    >
    > For detailed instructions on adjusting these values, please consult the **[MentorEd Environment Variable Modification Guide](https://github.com/ELEVATE-Project/mentoring/blob/master/documentation/2.5.6/MentorEd-Env-Modication-README.md)**.

    > **Important:** As mentioned in the above linked document, the **User SignUp** functionality may be compromised if key environment variables are not set correctly during deployment. If you opt to skip this setup, consider using the sample user account generator detailed in the `Sample User Accounts Generation` section of this document.

5. **Create Databases**

    - **Ubuntu/Linux**
        1. Download `create-databases.sh` Script File:
            ```
            curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/scripts/linux/create-databases.sh
            ```
        2. Make the executable by running the following command:
            ```
            chmod +x create-databases.sh
            ```
        3. Run the script file:
            ```
            ./create-databases.sh
            ```
    - **MacOS**

        1. Download `create-databases.sh` Script File:
            ```
            curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/scripts/macos/create-databases.sh
            ```
        2. Make the executable by running the following command:
            ```
            chmod +x create-databases.sh
            ```
        3. Run the script file:
            ```
            ./create-databases.sh
            ```

    - **Windows**

        1. Download `create-databases.bat` Script File:
            ```
            curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/scripts/windows/create-databases.bat
            ```
        2. Run the script file from a command-prompt terminal:
            ```
            create-databases.bat
            ```

6. **Run Migrations To Create Tables**

    - **Ubuntu/Linux/MacOS**

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

    - **Windows**
        1. Install Sequelize-cli globally:
            ```
            npm i sequelize-cli -g
            ```
        2. Run Migrations:
            ```
            cd mentoring/src & npx sequelize-cli db:migrate & cd ../.. && ^
            cd user/src & npx sequelize-cli db:migrate & cd ../.. & ^
            cd notification/src & npx sequelize-cli db:migrate & cd ../..
            ```

7. **Enabling Citus And Setting Distribution Columns (Optional)**

    MentorEd relies on PostgreSQL as its core database system. To boost performance and scalability, users can opt to enable the Citus extension. This transforms PostgreSQL into a distributed database, spreading data across multiple nodes to handle large datasets more efficiently as demand grows.

    > NOTE: Currently only available for Linux based operation systems.

    1. Download mentoring `distributionColumns.sql` file.

        ```
        curl -o ./mentoring/distributionColumns.sql -JL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/distribution-columns/mentoring/distributionColumns.sql
        ```

    2. Download user `distributionColumns.sql` file.

        ```
        curl -o ./user/distributionColumns.sql -JL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/distribution-columns/user/distributionColumns.sql
        ```

    3. Set up the `citus_setup` file by following the steps given below.

        - **Ubuntu/Linux**

            1. Download the `citus_setup.sh` file:

                ```
                curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/documentation/2.5.6/native/scripts/linux/citus_setup.sh
                ```

            2. Make the setup file executable by running the following command:

                ```
                chmod +x citus_setup.sh
                ```

            3. Enable Citus and set distribution columns for `mentoring` database by running the `citus_setup.sh` with the following arguments.
                ```
                ./citus_setup.sh mentoring postgres://postgres:postgres@localhost:9700/mentoring
                ```
            4. Enable Citus and set distribution columns for `user` database by running the `citus_setup.sh`with the following arguments.
                ```
                ./citus_setup.sh user postgres://postgres:postgres@localhost:9700/users
                ```

8. **Insert Initial Data**
   Use MentorEd in-build seeders to insert the initial data.

    - **Ubuntu/Linux/MacOS**

        ```
        cd mentoring/src && npm run db:seed:all && cd ../.. && \
        cd user/src && npm run db:seed:all && cd ../..
        ```

    - **Windows**
        ```
        cd mentoring/src & npm run db:seed:all & cd ../.. & ^
        cd user/src & npm run db:seed:all & cd ../..
        ```

9. **Start The Services**

    Following the steps given below, 2 instances of each MentorEd backend service will be deployed and be managed by PM2 process manager.

    - **Ubuntu/Linux**

        ```
        cd mentoring/src && pm2 start app.js -i 2 --name mentored-mentoring && cd ../.. && \
        cd user/src && pm2 start app.js -i 2 --name mentored-user && cd ../.. && \
        cd notification/src && pm2 start app.js -i 2 --name mentored-notification && cd ../.. && \
        cd interface-service/src && pm2 start app.js -i 2 --name mentored-interface && cd ../.. && \
        cd scheduler/src && pm2 start app.js -i 2 --name mentored-scheduler && cd ../..
        ```

    - **MacOS**

        ```
        cd mentoring/src && npx pm2 start app.js -i 2 --name mentored-mentoring && cd ../.. && \
        cd user/src && npx pm2 start app.js -i 2 --name mentored-user && cd ../.. && \
        cd notification/src && npx pm2 start app.js -i 2 --name mentored-notification && cd ../.. && \
        cd interface-service/src && npx pm2 start app.js -i 2 --name mentored-interface && cd ../.. && \
        cd scheduler/src && npx pm2 start app.js -i 2 --name mentored-scheduler && cd ../..
        ```

    - **Windows**
        ```
        cd mentoring/src && pm2 start app.js -i 2 --name mentored-mentoring && cd ../.. && ^
        cd user/src && pm2 start app.js -i 2 --name mentored-user && cd ../.. && ^
        cd notification/src && pm2 start app.js -i 2 --name mentored-notification && cd ../.. && ^
        cd interface-service/src && pm2 start app.js -i 2 --name mentored-interface && cd ../.. && ^
        cd scheduler/src && pm2 start app.js -i 2 --name mentored-scheduler && cd ../..
        ```

10. **Run Service Scripts**

    - **Ubuntu/Linux/MacOS**

        ```
        cd user/src/scripts && node insertDefaultOrg.js && node viewsScript.js && \
        node -r module-alias/register uploadSampleCSV.js && cd ../../.. && \
        cd mentoring/src/scripts && node psqlFunction.js && node viewsScript.js && cd ../../..
        ```

    - **Windows**
        ```
        cd user/src/scripts & node insertDefaultOrg.js & node viewsScript.js & ^
        node -r module-alias/register uploadSampleCSV.js & cd ../../.. && ^
        cd mentoring/src/scripts & node psqlFunction.js & node viewsScript.js & cd ../../..
        ```

11. **Start The Portal**

    MentorEd portal utilizes Ionic and Angular CLI for building the browser bundle, follow the steps given below to install them and start the portal.

    - **Ubuntu/Linux**

        1. Install Ionic CLI globally:

            ```
            sudo npm install -g @ionic/cli
            ```

        2. Install Angular CLI globally:

            ```
            sudo npm install -g @angular/cli
            ```

        3. Navigate to `mentoring-mobile-app` directory:

            ```
            cd mentoring-mobile-app
            ```

        4. Build the portal

            ```
            ionic build
            ```

        5. Start the portal:
            ```
            pm2 start pm2.config.json && cd ..
            ```

    - **MacOS**

        1. Install Ionic CLI globally:

            ```
            sudo npm install -g @ionic/cli
            ```

        2. Install Angular CLI globally:

            ```
            sudo npm install -g @angular/cli
            ```

        3. Navigate to `mentoring-mobile-app` directory:

            ```
            cd mentoring-mobile-app
            ```

        4. Build the portal:

            ```
            npx ionic build
            ```

        5. Start the portal:
            ```
            npx pm2 start pm2.config.json && cd ..
            ```

    - **Windows**

        1. Install Ionic CLI globally:

            ```
            npm install -g @ionic/cli
            ```

        2. Install Angular CLI globally:

            ```
            npm install -g @angular/cli
            ```

        3. Navigate to `mentoring-mobile-app` directory:

            ```
            cd mentoring-mobile-app
            ```

        4. Build the portal

            ```
            ionic build
            ```

        5. Start the portal:
            ```
            pm2 start pm2.config.json & cd ..
            ```

    Navigate to http://localhost:7601 to access the MentorEd Portal.

## Sample User Accounts Generation

During the initial setup of MentorEd services with the default configuration, you may encounter issues creating new accounts through the regular SignUp flow on the MentorEd portal. This typically occurs because the default SignUp process includes OTP verification to prevent abuse. Until the notification service is configured correctly to send actual emails, you will not be able to create new accounts.

In such cases, you can generate sample user accounts using the steps below. This allows you to explore the MentorEd services and portal immediately after setup.

> **Warning:** Use this generator only immediately after the initial system setup and before any normal user accounts are created through the portal. It should not be used under any circumstances thereafter.

-   **Ubuntu/Linux**

    ```
    curl -o insert_sample_data.sh https://raw.githubusercontent.com/ELEVATE-Project/mentoring/master/documentation/2.5.6/native/scripts/linux/insert_sample_data.sh && \
    chmod +x insert_sample_data.sh && \
    ./insert_sample_data.sh
    ```

-   **MacOS**

    ```
    curl -o insert_sample_data.sh https://raw.githubusercontent.com/ELEVATE-Project/mentoring/master/documentation/2.5.6/native/scripts/macos/insert_sample_data.sh && \
    chmod +x insert_sample_data.sh && \
    ./insert_sample_data.sh
    ```

-   **Windows**

    ```
    curl -o insert_sample_data.bat https://raw.githubusercontent.com/ELEVATE-Project/mentoring/master/documentation/2.5.6/native/scripts/windows/insert_sample_data.bat && ^
    insert_sample_data.bat
    ```

After successfully running the script mentioned above, the following user accounts will be created and available for login:

| Email ID                 | Password   | Role               |
| ------------------------ | ---------- | ------------------ |
| aaravpatel@example.com   | Password1@ | Mentee             |
| arunimareddy@example.com | Password1@ | Mentor             |
| devikasingh@example.com  | Password1@ | Organization Admin |


</details>

</br>

**BigBlueButton™ Service (Optional) can be setup using the following method:**

<details><summary>Setting up the BigBlueButton Service (Optional)</summary>

## Setting up the BigBlueButton Service (Optional)

## Installation

**Expectation**: Integrate the BigBlueButton meeting platform with the mentoring application.

1. Before installing, ensure that you meet all the prerequisites required to install BigBlueButton. To learn more, see Administration section in [BigBlueButton Docs](https://docs.bigbluebutton.org).

2. Install BigBlueButton version 2.6 using the hostname and email address, which you want to use. To learn more, see Administration section in [BigBlueButton Docs](https://docs.bigbluebutton.org).

3. After completing the installation, check the status of your server using the following command:

    ```
    sudo bbb-conf --check
    ```

    > **Note**: If you encounter any error which is flagged as _Potential problems_, check for installation or configuration errors on your server.

4. Start the service using the following command:

    ```
    sudo bbb-conf --start
    ```

5. Check if the BigBlueButton service is running using the following command:

    ```
    sudo bbb-conf --status
    ```

6. Restart the BigBlueButton server using the following command:

    ```
    sudo bbb-conf --restart
    ```

## Obtaining the Secret Key

If you wish to generate a new secret key, use the following command:

```
sudo bbb-conf --secret
```

## Deleting the Demo Meeting

If you want to delete the demo meeting, use the following command:

```
sudo apt-get purge bbb-demo
```

> **Tip**:
>
> -   To learn more, see the Administration section in <a href="https://docs.bigbluebutton.org">BigBlueButton Docs</a>.
> -   To automatically delete the metadata of recordings which are converted to mp4 format and uploaded on the cloud storage, see <a href="https://github.com/ELEVATE-Project/elevate-utils/tree/master/BBB-Recordings">ELEVATE-Project on GitHub</a>.

</details>

</br>

# Postman Collections

-   [Mentoring Service](https://github.com/ELEVATE-Project/mentoring/tree/master/documentation/2.5.6/postman-collections/mentoring)
-   [User Service](https://github.com/ELEVATE-Project/mentoring/tree/master/documentation/2.5.6/postman-collections/mentoring)
-   [Notification Service](https://github.com/ELEVATE-Project/mentoring/tree/master/documentation/2.5.6/postman-collections/mentoring)
-   [Scheduler Service](https://github.com/ELEVATE-Project/mentoring/tree/master/documentation/2.5.6/postman-collections/mentoring)

# Dependencies

This project relies on the following services:

-   [User Service](https://github.com/ELEVATE-Project/user)
-   [Notification Service](https://github.com/ELEVATE-Project/notification)
-   [Scheduler Service](https://github.com/ELEVATE-Project/scheduler)
-   [Interface Service](https://github.com/ELEVATE-Project/interface-service)

Please follow the setup guide provided with each service to ensure proper configuration. While these are the recommended services, feel free to utilize any alternative microservices that better suit your project's requirements.

For a comprehensive overview of the MentorEd implementation, refer to the [MentorEd Documentation](https://elevate-docs.shikshalokam.org/.mentorEd/intro).

The source code for the frontend/mobile application can be found in its respective [GitHub repository](https://github.com/ELEVATE-Project/mentoring-mobile-app).

# Team

<a href="https://github.com/ELEVATE-Project/mentoring/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ELEVATE-Project/mentoring" />
</a>

# Open Source Dependencies

Several open source dependencies that have aided Mentoring's development:

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-000?style=for-the-badge&logo=apachekafka)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)

<!-- ![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)
![CircleCI](https://img.shields.io/badge/circle%20ci-%23161616.svg?style=for-the-badge&logo=circleci&logoColor=white) -->
