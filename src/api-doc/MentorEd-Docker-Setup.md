## A. Dockerized Services & Dependencies

**Expectation**: Run all services and dependencies simultaneously with a common **Docker-Compose** file.

## Prerequisites

To set up the Elevate MentorEd application, ensure you have Docker and Docker Compose installed on your system. For Ubuntu users, detailed installation instructions for both can be found in the documentation here: [How To Install and Use Docker Compose on Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-compose-on-ubuntu-20-04). For Windows users, you can refer to the Docker documentation for installation instructions: [Docker Compose Installation Guide for Windows](https://docs.docker.com/compose/install/). Once these prerequisites are in place, you're all set to get started with setting up the Elevate MentorEd application.

## Directory Setup

### Follow these steps to download the necessary files for the Elevate application:

1.  **Create Directory:** Create a directory named **elevate** with a **backend** sub-directory within it.

    Directory structure:

    ```
    ./elevate/
    └── backend
    ```

    > Example Command: `mkdir elevate &&	cd elevate/`

2.  **Download Docker Compose File:** Retrieve the **[docker-compose-mentoring.yml](https://github.com/ELEVATE-Project/mentoring/blob/master/src/scripts/setup/docker-compose-mentoring.yml)** file from the Elevate Mentoring repository and save it to the backend directory.

    ```
    elevate/backend$ curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/docker-compose-mentoring.yml
    ```

    Directory structure:

    ```
    ./elevate/
    └── backend
        └── docker-compose-mentoring.yml
    ```

3.  **Create Sub-directories For Services:** Since each service requires distinct setup files, create separate sub-directories for the mentoring and user services within the backend directory.

    Directory structure:

    ```
    ./elevate/
    └── backend
        ├── docker-compose-mentoring.yml
        ├── mentoring
        └── user
    ```

    > Example Command: `~/elevate/backend$ mkdir mentoring`

4.  **Set up Mentoring Directory:** Navigate into the mentoring directory and download required files.

    -   **[setup.sh](https://github.com/ELEVATE-Project/mentoring/blob/temp_setup/src/setup.sh)**
        ```
        /mentoring$ curl -o setup.sh -L https://github.com/ELEVATE-Project/mentoring/raw/temp_setup/src/setup.sh
        ```
    -   **[distributionColumns.psql](https://github.com/ELEVATE-Project/mentoring/blob/temp_setup/src/distributionColumns.psql)**
        ```
        /mentoring$ curl -o distributionColumns.psql -L https://github.com/ELEVATE-Project/mentoring/raw/temp_setup/src/distributionColumns.psql
        ```

    Directory Structure:

        ./elevate/
        └── backend
            ├── docker-compose-mentoring.yml
            ├── mentoring
            │   ├── distributionColumns.psql
            │   └── setup.sh
            └── user

5.  **Make The Setup File Executable:**

    -   Ubuntu/Linux/Mac:
        ```
        /mentoring$ chmod +x setup.sh
        ```
    -   Windows
        ```
        /mentoring attrib +x setup.sh
        ```

6.  **Set Up User Directory:** Navigate into the user directory and repeat steps 4 and 5 with the following files.

    -   **[setup.sh](https://github.com/ELEVATE-Project/user/blob/temp_setup/src/setup.sh)**
        ```
        /user$ curl -o setup.sh -L https://github.com/ELEVATE-Project/user/raw/temp_setup/src/setup.sh
        ```
    -   **[distributionColumns.sql](https://github.com/ELEVATE-Project/user/blob/temp_setup/src/distributionColumns.sql)**
        `/user$ curl -o distributionColumns.sql -L https://github.com/ELEVATE-Project/user/raw/temp_setup/src/distributionColumns.sql` > **Note:** The setup.sh file needs to be set as executable.

    Directory Structure:

    ```
    ./elevate/
    └── backend
        ├── docker-compose-mentoring.yml
        ├── mentoring
        │   ├── distributionColumns.psql
        │   └── setup.sh
        └── user
            ├── distributionColumns.sql
            └── setup.sh
    ```

## Environment File Creation

### Create an environment file for the Mentoring service by following these steps:

1. Navigate to the **backend** directory and create a new file named **mentoring_env** using any text editor like nano/notepad:

-   Ubuntu/Linux/Mac:
    ```
    $ nano mentoring_env
    ```
-   Windows

    ```
    $ notepad mentoring_env
    ```

2. Copy and paste the following environment variables into the **mentoring_env** file:

    File name: **mentoring_env**
    <details>
    <summary>mentoring_env content (Click Here)</summary>

    ```
    ACCESS_TOKEN_SECRET=asadsd8as7df9as8df987asdf
    API_DOC_URL=/api-doc
    APPLICATION_BASE_URL=/mentoring/
    APPLICATION_ENV=development
    APPLICATION_HOST=mentoring
    APPLICATION_PORT=3000
    APPLICATION_URL=https://dev.mentoring.shikshalokam.org
    AWS_ACCESS_KEY_ID=aws-access-key-id
    AWS_BUCKET_ENDPOINT=s3.ap-south-1.amazonaws.com
    AWS_BUCKET_REGION=ap-south-1
    AWS_SECRET_ACCESS_KEY=aws-secret-access-key
    AZURE_ACCOUNT_KEY=azure-account-key
    AZURE_ACCOUNT_NAME=account-name
    BIG_BLUE_BUTTON_BASE_URL=/bigbluebutton/
    BIG_BLUE_BUTTON_LAST_USER_TIMEOUT_MINUTES=15
    BIG_BLUE_BUTTON_SECRET_KEY=s90df8g09sd8fg098sdfg
    BIG_BLUE_BUTTON_SESSION_END_URL=https%3A%2F%2Fdev.some-mentoring.temp.org%2F
    BIG_BLUE_BUTTON_URL=https://dev.some.temp.org
    CLOUD_STORAGE=AWS
    CLEAR_INTERNAL_CACHE=mentoringInternal
    DEFAULT_AWS_BUCKET_NAME=aws-bucket-storage-name
    DEFAULT_GCP_BUCKET_NAME=gcp-bucket-storage-name
    DEFAULT_MEETING_SERVICE=BBB
    DEFAULT_ORGANISATION_CODE=default_code
    DEFAULT_ORG_ID=1
    DEV_DATABASE_URL=postgres://postgres:postgres@localhost:5432/elevate-mentoring
    DISABLE_LOG=false
    ENABLE_EMAIL_FOR_REPORT_ISSUE=true
    ENABLE_LOG=true
    ERROR_LOG_LEVEL=silly
    GCP_PATH=gcp.json
    GCP_PROJECT_ID=project-id
    INTERNAL_ACCESS_TOKEN=internal_access_token
    INTERNAL_CACHE_EXP_TIME=86400
    KAFKA_GROUP_ID=mentoring
    KAFKA_MENTORING_TOPIC=mentoringtopic
    KAFKA_RECORDING_TOPIC=recordingtopic
    KAFKA_URL=kafka:9092
    MEETING_END_CALLBACK_EVENTS=https%3A%2F%2Fdev.some-apis.temp.org%2Fmentoring%2Fv1%2Fsessions%2Fcompleted
    MENTEE_SESSION_ENROLLMENT_EMAIL_TEMPLATE=mentee_session_enrollment
    MENTOR_SESSION_DELETE_EMAIL_TEMPLATE=mentor_session_delete
    MENTOR_SESSION_RESCHEDULE_EMAIL_TEMPLATE=mentor_session_reschedule
    NOTIFICATION_KAFKA_TOPIC=develop.notifications
    RATING_KAFKA_TOPIC=dev.rate
    REDIS_HOST=redis://redis:6379
    REFRESH_VIEW_INTERVAL=30000
    REPORT_ISSUE_EMAIL_TEMPLATE_CODE=user_issue_reported
    REQUIRED_PACKAGES=elevate-user@1.1.30 elevate-mentoring@1.1.23 elevate-scheduler@1.0.4
    SCHEDULER_SERVICE_BASE_URL=/scheduler/
    SCHEDULER_SERVICE_ERROR_REPORTING_EMAIL_ID=rakesh.k@some.com
    SCHEDULER_SERVICE_HOST=http://scheduler:4000
    SCHEDULER_SERVICE_URL=http://scheduler:4000/jobs/scheduleJob
    SESSION_EDIT_WINDOW_MINUTES=0
    SESSION_KAFKA_TOPIC=session
    SESSION_MENTEE_LIMIT=5
    SUPPORT_EMAIL_ID=support@xyz.com,team@xyz.com
    USER_SERVICE_BASE_URL=/user/
    USER_SERVICE_HOST=http://user:3001
    ```

    </details>

3. Save the changes to the file and exit the text editor.

    Directory Structure:

    ```
    ./elevate/
    └── backend
      ├── docker-compose-mentoring.yml
      ├── mentoring
      │   ├── distributionColumns.psql
      │   └── setup.sh
      ├── mentoring_env ◀️▶
      └── user
          ├── distributionColumns.sql
          └── setup.sh
    ```

    For Elevate Mentoring Repository, **[Click Here](https://github.com/ELEVATE-Project/mentoring)**.

### Create environment files for other backend services:

Following the exact same instructions from the previous section, create the following env files with the contents given below:

-   File name: **user_env**
    <details>
      <summary>user_env content (Click Here)</summary>

    ```
    ACCESS_TOKEN_EXPIRY=1
    ACCESS_TOKEN_SECRET=asadsd8as7df9as8df987asdf
    ADMIN_INVITEE_UPLOAD_EMAIL_TEMPLATE_CODE=test
    ADMIN_SECRET_CODE=a98sd76fasdfasd
    API_DOC_URL=/user/api-doc
    APPLICATION_ENV=development
    APPLICATION_HOST=user
    APPLICATION_PORT=3001
    APP_NAME=MentorED
    AZURE_ACCOUNT_KEY=asd897gfa09sd87f09as8d
    AZURE_ACCOUNT_NAME=mentoring
    AWS_ACCESS_KEY_ID=adsfg98a7sdfg
    AWS_BUCKET_ENDPOINT=s3.ap-south-1.amazonaws.com
    AWS_BUCKET_REGION=ap-south-1
    AWS_SECRET_ACCESS_KEY=asd9786fg9a8sd/asdfg9a8sd7fg
    CLEAR_INTERNAL_CACHE=userinternal
    CLOUD_STORAGE=AWS
    DEFAULT_AWS_BUCKET_NAME=mentoring-dev-storage
    DEFAULT_AZURE_CONTAINER_NAME=mentoring-images
    DEFAULT_GCP_BUCKET_NAME=mentoring-dev-storage
    DEFAULT_OCI_BUCKET_NAME=dev-mentoring
    DEFAULT_ORGANISATION_CODE=default_code
    DEFAULT_ORG_ID=1
    DEFAULT_ROLE=mentee
    DEFAULT_QUEUE=test
    DEV_DATABASE_URL=postgres://postgres:postgres@localhost:5432/elevate-user
    DISABLE_LOG=false
    ENABLE_EMAIL_OTP_VERIFICATION=false
    ENABLE_LOG=true
    ERROR_LOG_LEVEL=silly
    GCP_PATH=gcp.json
    GCP_PROJECT_ID=sl-dev-project
    INTERNAL_ACCESS_TOKEN=internal_access_token
    INTERNAL_CACHE_EXP_TIME=86400
    INVITEE_EMAIL_TEMPLATE_CODE=test
    IV=09sdf8g098sdf/Q==
    KAFKA_GROUP_ID=mentoring
    KAFKA_TOPIC=
    KAFKA_URL=kafka:9092
    KEY=fasd98fg9a8sydg98a7usd89fg
    MENTEE_INVITATION_EMAIL_TEMPLATE_CODE=test
    MENTOR_INVITATION_EMAIL_TEMPLATE_CODE=test
    MENTOR_REQUEST_ACCEPTED_EMAIL_TEMPLATE_CODE=mentor_request_accepted
    MENTOR_REQUEST_REJECTED_EMAIL_TEMPLATE_CODE=mentor_request_rejected
    MENTORING_SERVICE_URL=http://mentoring:3000
    NOTIFICATION_KAFKA_TOPIC=dev.notifications
    OCI_ACCESS_KEY_ID=asdgf6a0s98d76g9a8sasdasd7df987as98df
    OCI_BUCKET_ENDPOINT=https://as98d7asdasdf.compat.objectstorage.ap-hyderabad-1.oraclecloud.com
    OCI_BUCKET_REGION=ap-hyderabad-1
    OCI_SECRET_ACCESS_KEY=as09d7f8/as0d7f09as7d8f=
    OTP_EMAIL_TEMPLATE_CODE=emailotp
    OTP_EXP_TIME=86400
    PORTAL_URL=https://mentored.some.org/auth/login
    REFRESH_TOKEN_EXPIRY=183
    REFRESH_TOKEN_SECRET=as9d87fa9s87df98as7d9f87a9sd87f98as7dg987asf
    REFRESH_VIEW_INTERVAL=540000
    REDIS_HOST=redis://redis:6379
    REGISTRATION_EMAIL_TEMPLATE_CODE=registration
    REGISTRATION_OTP_EMAIL_TEMPLATE_CODE=registrationotp
    SAMPLE_CSV_FILE_PATH=sample/bulk_user_creation.csv
    SCHEDULER_SERVICE_BASE_URL= /scheduler/
    SCHEDULER_SERVICE_ERROR_REPORTING_EMAIL_ID=rakesh.k@some.com
    SCHEDULER_SERVICE_HOST=http://scheduler:4000
    SCHEDULER_SERVICE_URL=http://scheduler:4000/jobs/scheduleJob
    ```

    </details>

    For Elevate User Repository, **[Click Here](https://github.com/ELEVATE-Project/user)**.

-   File name: **notification_env**
    <details>
      <summary>notification_env content</summary>

    ```
    API_DOC_URL=/api-doc
    APPLICATION_BASE_URL=/notification/
    APPLICATION_ENV=development
    APPLICATION_PORT=3002
    DEV_DATABASE_URL=postgres://postgres:postgres@localhost:5432/elevate-notification
    DISABLE_LOG=false
    ENABLE_LOG=true
    ERROR_LOG_LEVEL=silly
    INTERNAL_ACCESS_TOKEN=internal_access_token
    KAFKA_GROUP_ID=notification
    KAFKA_HOST=kafka:9092
    KAFKA_TOPIC=develop.notifications
    SENDGRID_API_KEY=SG.asd9f87a9s8d7f.
    SENDGRID_FROM_MAIL=no-reply@some.org
    ```

    </details>

    For Elevate Notification Repository, **[Click Here](https://github.com/ELEVATE-Project/notification)**.

-   File name: **scheduler_env**
    <details>
      <summary>scheduler_env content</summary>

    ```
    API_DOC_URL=/api-doc
    APPLICATION_BASE_URL=/scheduler/
    APPLICATION_ENV=development
    APPLICATION_PORT=4000
    DEFAULT_QUEUE=email
    DISABLE_LOG=false
    ENABLE_LOG=true
    ERROR_LOG_LEVEL=silly
    KAFKA_URL=kafka:9092
    NOTIFICATION_KAFKA_TOPIC=develop.notifications
    REDIS_HOST=redis
    REDIS_PORT=6379
    ```

    </details>

    For Elevate Scheduler Repository, **[Click Here](https://github.com/ELEVATE-Project/scheduler)**.

-   File name: **interface_env**
    <details>
      <summary>interface_env content</summary>

    ```
    API_DOC_URL=http://localhost:3569/apidoc
    APPLICATION_ENV=development
    APPLICATION_PORT=3569
    INSTALLED_PACKAGES=elevate-user elevate-mentoring elevate-scheduler
    MENTORING_SERVICE_BASE_URL=http://mentoring:3000
    NOTIFICATION_SERVICE_BASE_URL=http://notification:3002
    REQUIRED_PACKAGES=elevate-user@1.1.30 elevate-mentoring@1.1.23 elevate-scheduler@1.0.4
    SCHEDULER_SERVICE_BASE_URL=http://scheduler:4000
    SUPPORTED_HTTP_TYPES=GET POST PUT PATCH DELETE
    USER_SERVICE_BASE_URL=http://user:3001

    ```

    </details>

    For Elevate Scheduler Repository, **[Click Here](https://github.com/ELEVATE-Project/interface-service)**.

    Directory Structure:

    ```
    ./elevate/
    └── backend
        ├── docker-compose-mentoring.yml
        ├── interface_env ◀️▶
        ├── mentoring
        │   ├── distributionColumns.psql
        │   └── setup.sh
        ├── mentoring_env ◀️▶
        ├── notification_env ◀️▶
        ├── scheduler_env ◀️▶
        ├── user
        │   ├── distributionColumns.sql
        │   └── setup.sh
        └── user_env ◀️▶
    ```

### Create an environment file for the mobile-portal-app service by following these steps:

1. Navigate to the elevate/backend directory and create a new file named `environment.ts`.

2. Copy and paste the following environment variables into the `environment.ts` file:
    ```typescript
    export const environment = {
    	baseUrl: 'http://localhost:3569',
    	deepLinkUrl: 'https://mentored.shikshalokam.org',
    	dev: false,
    	name: 'debug environment',
    	privacyPolicyUrl: 'https://shikshalokam.org/mentoring/privacy-policy',
    	production: true,
    	sqliteDBName: 'mentoring.db',
    	staging: false,
    	termsOfServiceUrl: 'https://shikshalokam.org/mentoring/term-of-use',
    }
    ```
3. Update Docker Compose Configuration

    Open the `docker-compose-mentoring.yml` file and update the path of the `environment.ts` file under the portal docker image (refer to Line 160). Change `/home/priyanka/workspace/docker/environment.ts` to your exact path to the `environment.ts` file.

    > Note: Use pwd command to obtain the exact path (Linux).

    Directory Structure:

    ```
    ./elevate/
    └── backend
        ├── docker-compose-mentoring.yml
        ├── environment.ts ◀️▶
        ├── interface_env
        ├── mentoring
        │   ├── distributionColumns.psql
        │   └── setup.sh
        ├── mentoring_env
        ├── notification_env
        ├── scheduler_env
        ├── user
        │   ├── distributionColumns.sql
        │   └── setup.sh
        └── user_env
    ```

### To update all services with the latest image, follow these steps **(Optional)**:

Please refer to the Shikshalokam [Docker Hub repository](https://hub.docker.com/r/shikshalokamqa/elevate-user/tags) for the latest available images. Note that the master branch typically hosts the most recent published image.

## Run/Stop/Remove Docker Compose Containers

-   **Ubuntu/Linux/Mac:**

    1. Navigate to backend directory and download `docker-compose-up.sh` and `docker-compose-down.sh` files.
       **docker-compose-up.sh**

        ```
        elevate/backend$ curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/docker-compose-up.sh
        ```

        **docker-compose-down.sh**

        ```
        elevate/backend$ curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/docker-compose-down.sh
        ```

    2. Make the files executable by running the following commands.

        **docker-compose-up.sh**

        ```
        elevate/backend$ chmod +x docker-compose-up.sh
        ```

        **docker-compose-down.sh**

        ```
        elevate/backend$ chmod +x docker-compose-down.sh
        ```

    3. Follow the steps given below to execute associated Docker-Compose operations.

        - **To run all services and dependencies**:
            ```
            elevate/backend$ ./docker-compose-up.sh
            ```
        - **To gracefully stop all the service and dependency containers**:

            Press `Ctrl + c`

        - **To stop and remove all the running service and dependency containers**:
            ```
            elevate/backend$ ./docker-compose-down.sh
            ```

-   **Windows:**

    1.  Navigate to backend directory and download `docker-compose-up.bat` and `docker-compose-down.bat` files.

        **docker-compose-up.bat**

        ```
        elevate\backend>curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/docker-compose-up.bat
        ```

        **docker-compose-down.bat**

        ```
        elevate\backend>curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/docker-compose-down.bat
        ```

    2.  Follow the steps given below to execute associated Docker-Compose operations.

        -   **To run all services and dependencies, run**:

            ```
            elevate\backend>docker-compose-up.bat
            ```

        -   **To gracefully stop all the service and dependency containers**:

            Press `Ctrl + c`

        -   **To stop and remove all the running service and dependency containers, run**:
            ```
            elevate\backend>docker-compose-down.bat
            ```

> **Note:** During the first Docker Compose run, the database, migration seeder files, and the script to establish the default organization will also be executed automatically.

## Enable Citus Extension

### To enable the Citus extension for mentoring and user services, follow these steps:

1. Create a sub-directory named `mentoring` and download `distributionColumns.sql` into it.
    ```
    elevate/backend$ mkdir -p mentoring && curl -o ./mentoring/distributionColumns.sql -L https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/distribution-columns/mentoring/distributionColumns.sql
    ```
2. Create a sub-directory named `user` and download `distributionColumns.sql` into it.
    ```
    mkdir -p user && curl -o ./user/distributionColumns.sql -JL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/distribution-columns/user/distributionColumns.sql
    ```
3. Set up the citus_setup file by following the steps given below.

    - **Ubuntu/Linux/Mac:**

        1. Navigate to the elevate/backend directory and download the `citus_setup.sh` file:

            ```
            elevate/backend$ curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/citus_setup.sh
            ```

        2. Make the setup file executable by running the following command:

            ```
            elevate/backend$ chmod +x citus_setup.sh
            ```

        3. Enable Citus and set distribution columns for `elevate-mentoring` database by running the `citus_setup.sh`with the following arguments:
            ```
            elevate/backend$ ./citus_setup.sh mentoring postgres://postgres:postgres@citus_master:5432/elevate-mentoring
            ```
        4. Enable Citus and set distribution columns for `elevate-user` database by running the `citus_setup.sh`with the following arguments:
            ```
            elevate/backend$ ./citus_setup.sh user postgres://postgres:postgres@citus_master:5432/elevate-user
            ```

    - **Windows:**
        1. Navigate to the elevate/backend directory and download the `citus_setup.bat` file:
            ```
             elevate\backend>curl -OJL https://github.com/ELEVATE-Project/mentoring/raw/master/src/scripts/setup/citus_setup.bat
            ```
        2. Enable Citus and set distribution columns for `elevate-mentoring` database by running the `citus_setup.bat`with the following arguments:
            ```
            elevate\backend>citus_setup.bat mentoring postgres://postgres:postgres@citus_master:5432/elevate-mentoring
            ```
        3. Enable Citus and set distribution columns for `elevate-user` database by running the `citus_setup.bat`with the following arguments:
            ```
            elevate\backend>citus_setup.bat user postgres://postgres:postgres@citus_master:5432/elevate-user
            ```

## Persistence of Database Data in Docker Container

To ensure the persistence of database data when downing database docker container, it is necessary to modify the `docker-compose-mentoring.yml` file according to the steps given below:

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
