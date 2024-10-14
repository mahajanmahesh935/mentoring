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

-   **Operating System:** Ubuntu 22
-   **Node.js®:** v20
-   **PostgreSQL:** 16
-   **Citus:** 12.1
-   **Apache Kafka®:** 3.5.0

# Setup Options

Elevate services can be setup in local using two methods:

<details><summary>Dockerized Services & Dependencies Using Docker-Compose File (Easiest)</summary>

## A. Docker-Compose

**Expectation**: Run all services simultaneously with a common **Docker-Compose** file.

### Steps

1.  Install **Docker** & **Docker-Compose**.

2.  To create/start all containers:

    ```
    ELEVATE/mentoring$ docker-compose up
    ```

    You can pass .env file to docker images of elevate service by using the below command

    ```
    ELEVATE/mentoring$ mentoring_env=".env path" users_env=".env path" notification_env=".env path" scheduler=".env path"  docker-compose up

    ```

    example:

    ```
    ELEVATE/mentoring$ mentoring_env="/Users/mentoring/src/.env" users_env="/Users/user/src/.env" notification_env="/Users/notification/src/.env" scheduler="/Users/scheduler/src/.env"  docker-compose up

    ```

3.  To remove all containers & networks:

            ```
            ELEVATE/mentoring$ docker-compose down
            ```

            Refer **Docker-Compose README** for more information.

            **Note:** It isn't always necessary to run **down** command. Existing containers and networks can be stopped gracefully by using **Ctrl + C** key combination.

            **Warning:** Do not use docker-compose in production.

</details>

<details>
<summary>Local Service with local dependencies (Hardest)</summary>

## B. Local Service With Local Dependencies

**Expectation**: Run a single service with existing local dependencies in the host (**Non-Docker Implementation**).

## Installations

### Install Node.js LTS

Refer to the [NodeSource distributions installation scripts](https://github.com/nodesource/distributions#installation-scripts) for Node.js installation.

```bash
$ curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - &&\
sudo apt-get install -y nodejs
```

### Install Build Essential

```bash
$ sudo apt-get install build-essential
```

### Install Kafka

Refer to [Kafka Ubuntu 22.04 setup guide](https://www.fosstechnix.com/install-apache-kafka-on-ubuntu-22-04-lts/)

1. Install OpenJDK 11:

    ```bash
    $ sudo apt install openjdk-11-jdk
    ```

2. Download and extract Kafka:

    ```bash
    $ sudo wget https://downloads.apache.org/kafka/3.5.0/kafka_2.12-3.5.0.tgz
    $ sudo tar xzf kafka_2.12-3.5.0.tgz
    $ sudo mv kafka_2.12-3.5.0 /opt/kafka
    ```

3. Configure Zookeeper:

    ```bash
    $ sudo nano /etc/systemd/system/zookeeper.service
    ```

    Paste the following lines into the `zookeeper.service` file:

    ```ini
    /etc/systemd/system/zookeeper.service
    [Unit]
    Description=Apache Zookeeper service
    Documentation=http://zookeeper.apache.org
    Requires=network.target remote-fs.target
    After=network.target remote-fs.target

    [Service]
    Type=simple
    ExecStart=/opt/kafka/bin/zookeeper-server-start.sh /opt/kafka/config/zookeeper.properties
    ExecStop=/opt/kafka/bin/zookeeper-server-stop.sh
    Restart=on-abnormal

    [Install]
    WantedBy=multi-user.target
    ```

    Save and exit.

4. Reload systemd:

    ```bash
    $ sudo systemctl daemon-reload
    ```

5. Configure Kafka:

    ```bash
    $ sudo nano /etc/systemd/system/kafka.service
    ```

    Paste the following lines into the `kafka.service` file:

    ```ini
    [Unit]
    Description=Apache Kafka Service
    Documentation=http://kafka.apache.org/documentation.html
    Requires=zookeeper.service

    [Service]
    Type=simple
    Environment="JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64"
    ExecStart=/opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/server.properties
    ExecStop=/opt/kafka/bin/kafka-server-stop.sh

    [Install]
    WantedBy=multi-user.target
    ```

    Save and exit.

6. Reload systemd:

    ```bash
    $ sudo systemctl daemon-reload
    ```

7. Start Zookeeper:

    ```bash
    $ sudo systemctl start zookeeper
    ```

    Check status:

    ```bash
    $ sudo systemctl status zookeeper
    ```

    Zookeeper service status should be shown as active (running).

8. Start Kafka:

    ```bash
    $ sudo systemctl start kafka
    ```

    Check status:

    ```bash
    $ sudo systemctl status kafka
    ```

    Kafka status should be shown as active (running).

### Install Redis

Refer to [Redis Ubuntu 22.04 setup guide](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-22-04)

1. Update the package list:

    ```bash
    $ sudo apt update
    ```

2. Install Redis:

    ```bash
    $ sudo apt install redis-server
    ```

3. Configure Redis for systemd:

    ```bash
    $ sudo nano /etc/redis/redis.conf
    ```

    Find the `supervised` directive and change it to "systemd" as follows:

    ```conf
    . . .
    # If you run Redis from upstart or systemd, Redis can interact with your
    # supervision tree. Options:
    #   supervised no      - no supervision interaction
    #   supervised upstart - signal upstart by putting Redis into SIGSTOP mode
    #   supervised systemd - signal systemd by writing READY=1 to $NOTIFY_SOCKET
    #   supervised auto    - detect upstart or systemd method based on
    #                        UPSTART_JOB or NOTIFY_SOCKET environment variables
    # Note: these supervision methods only signal "process is ready."
    #       They do not enable continuous liveness pings back to your supervisor.
    supervised systemd
    . . .
    ```

    Save and exit.

4. Restart the Redis service:

    ```bash
    $ sudo systemctl restart redis.service
    ```

### Install Single-Node Citus (Distributed Database)

Refer to [official Citus single-node setup](https://docs.citusdata.com/en/stable/installation/single_node_debian.html)

1. Download and install Citus:

    ```bash
    $ curl https://install.citusdata.com/community/deb.sh | sudo bash
    $ sudo apt-get -y install postgresql-16-citus-12.1
    ```

2. Switch to the PostgreSQL user:

    ```bash
    $ sudo su - postgres
    ```

3. Set the PostgreSQL bin directory in the PATH and create a directory for Citus:

    ```bash
    $ export PATH=$PATH:/usr/lib/postgresql/16/bin
    $ cd ~
    $ mkdir citus
    ```

4. Initialize the Citus database:

    ```bash
    $ initdb -D citus
    ```

5. Configure Citus in `citus/postgresql.conf`:

    ```bash
    $ echo "shared_preload_libraries = 'citus'" >> citus/postgresql.conf
    ```

6. Start the Citus server:

    ```bash
    $ pg_ctl -D citus -o "-p 9700" -l citus_logfile start
    ```

7. Create the Citus extension:

    ```bash
    $ psql -p 9700 -c "CREATE EXTENSION citus;"
    ```

8. Check the Citus version:

    ```bash
    $ psql -p 9700 -c "select citus_version();"
    ```

    You should see an output similar to the following, indicating that Citus is successfully installed:

    ```sql
    postgres=# select citus_version();
                                           citus_version
    ----------------------------------------------------------------------------------------------------
     Citus 12.1.1 on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 9.4.0-1ubuntu1~20.04.2) 9.4.0, 64-bit
    (1 row)
    ```

### Install PM2

Refer to [How To Set Up a Node.js Application for Production on Ubuntu 22.04](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-22-04).

**Exit the postgres user account and run the following command**

```bash
$ sudo npm install pm2@latest -g
```

## Setting up Repositories

### Clone the mentoring repository to /opt/backend directory

```bash
opt/backend$ git clone -b develop-2.5 --single-branch "https://github.com/ELEVATE-Project/mentoring.git"
```

### Install Npm packages from src directory

```bash
backend/mentoring/src$ sudo npm i
```

### Create .env file in src directory

```bash
mentoring/src$ sudo nano .env
```

Copy-paste the following env variables to the `.env` file:

```env
# Mentoring Service Config

# Port on which service runs
APPLICATION_PORT=3000

# Service environment
APPLICATION_ENV=development

# Route after the base URL
APPLICATION_BASE_URL=/mentoring/
APPLICATION_URL=https://dev.mentoring.shikshalokam.org

# Mongo db connectivity URL
MONGODB_URL=mongodb://localhost:27017/elevate-mentoring

# Token secret to verify the access token
ACCESS_TOKEN_SECRET='asadsd8as7df9as8df987asdf'

# Internal access token for communication between services via network call
INTERNAL_ACCESS_TOKEN='internal_access_token'

# Kafka hosted server URL
KAFKA_URL=localhost:9092

# Kafka group to which consumer belongs
KAFKA_GROUP_ID="mentoring"

# Kafka topic to push notification data
NOTIFICATION_KAFKA_TOPIC='develop.notifications'

# Kafka topic name to consume from mentoring topic
KAFKA_MENTORING_TOPIC="mentoringtopic"
SESSION_KAFKA_TOPIC='session'

# Kafka topic to push recording data
KAFKA_RECORDING_TOPIC="recordingtopic"

# Any one of three features available for cloud storage
CLOUD_STORAGE='AWS'
MENTOR_SESSION_RESCHEDULE_EMAIL_TEMPLATE=mentor_session_reschedule

# GCP json config file path
GCP_PATH='gcp.json'

# GCP bucket name which stores files
DEFAULT_GCP_BUCKET_NAME='gcp-bucket-storage-name'

# GCP project id
GCP_PROJECT_ID='project-id'

# AWS access key id
AWS_ACCESS_KEY_ID='aws-access-key-id'

# AWS secret access key
AWS_SECRET_ACCESS_KEY='aws-secret-access-key'

# AWS region where the bucket will be located
AWS_BUCKET_REGION='ap-south-1'

# AWS endpoint
AWS_BUCKET_ENDPOINT='s3.ap-south-1.amazonaws.com'

# AWS bucket name which stores files
DEFAULT_AWS_BUCKET_NAME='aws-bucket-storage-name'

# Azure storage account name
AZURE_ACCOUNT_NAME='account-name'

# Azure storage account key
AZURE_ACCOUNT_KEY='azure-account-key'

# Azure storage container which stores files
DEFAULT_AZURE_CONTAINER_NAME='azure-container-storage-name'

# User service host
USER_SERVICE_HOST='http://localhost:3001'

# User service base URL
USER_SERVICE_BASE_URL='/user/'

# Big blue button URL
BIG_BLUE_BUTTON_URL=https://dev.some.temp.org

# Big blue button base URL
BIB_BLUE_BUTTON_BASE_URL=/bigbluebutton/

# Meeting end callback events endpoint
MEETING_END_CALLBACK_EVENTS=https%3A%2F%2Fdev.some-apis.temp.org%2Fmentoring%2Fv1%2Fsessions%2Fcompleted

# Big blue button secret key
BIG_BLUE_BUTTON_SECRET_KEY=sa9d0f8asdg7a9s8d7f

# Big blue button recording ready callback URL
RECORDING_READY_CALLBACK_URL=http%3A%2F%2Flocalhost%3A3000%2F%3FmeetingID%3Dmeet123
BIG_BLUE_BUTTON_SECRET_KEY="s90df8g09sd8fg098sdfg"

# Enable logging of network requests
ENABLE_LOG=true

# API doc URL
API_DOC_URL='/api-doc'

# Internal cache expiry time
INTERNAL_CACHE_EXP_TIME=86400

# Redis Host connectivity URL
REDIS_HOST='redis://localhost:6379'

# Kafka internal communication
CLEAR_INTERNAL_CACHE='mentoringInternal'

# Enable email for reported issues
ENABLE_EMAIL_FOR_REPORT_ISSUE=true

# Email ID of the support team
SUPPORT_EMAIL_ID='support@xyz.com,team@xyz.com'

# Email template code for reported issues
REPORT_ISSUE_EMAIL_TEMPLATE_CODE='user_issue_reported'

BIG_BLUE_BUTTON_SESSION_END_URL='https%3A%2F%2Fdev.some-mentoring.temp.org%2F'

SCHEDULER_SERVICE_ERROR_REPORTING_EMAIL_ID="rakesh.k@some.com"
SCHEDULER_SERVICE_URL="http://localhost:4000/jobs/scheduleJob"
ERROR_LOG_LEVEL='silly'
DISABLE_LOG=false
DEFAULT_MEETING_SERVICE="BBB"
# BIG_BLUE_BUTTON_LAST_USER_TIMEOUT_MINUTES=15
SESSION_EDIT_WINDOW_MINUTES=0
SESSION_MENTEE_LIMIT=5
DEV_DATABASE_URL=postgres://shikshalokam:slpassword@localhost:9700/elevate_mentoring
MENTOR_SESSION_DELETE_EMAIL_TEMPLATE='mentor_session_delete'

SCHEDULER_SERVICE_HOST="http://localhost:4000"
SCHEDULER_SERVICE_BASE_URL= '/scheduler/'
DEFAULT_ORGANISATION_CODE="default_code"

REFRESH_VIEW_INTERVAL=30000
MENTEE_SESSION_ENROLLMENT_EMAIL_TEMPLATE=mentee_session_enrollment
DEFAULT_ORG_ID=1
```

Save and exit.

## Setting up Databases

**Log into the postgres user**

```bash
$ sudo su postgres
```

**Log into psql**

```bash
$ psql -p 9700
```

**Create a database user/role:**

```sql
CREATE USER shikshalokam WITH ENCRYPTED PASSWORD 'slpassword';
```

**Create the elevate_mentoring database**

```sql
CREATE DATABASE elevate_mentoring;
GRANT ALL PRIVILEGES ON DATABASE elevate_mentoring TO shikshalokam;
\c elevate_mentoring
GRANT ALL ON SCHEMA public TO shikshalokam;
```

## Running Migrations To Create Tables

**Exit the postgres user account and install sequelize-cli globally**

```bash
$ sudo npm i sequelize-cli -g
```

**Navigate to the src folder of mentoring service and run sequelize-cli migration command:**

```bash
mentoring/src$ npx sequelize-cli db:migrate
```

**Now all the tables must be available in the Citus databases**

## Setting up Distribution Columns in Citus PostgreSQL Database

Refer [Choosing Distribution Column](https://docs.citusdata.com/en/stable/sharding/data_modeling.html) for more information regarding Citus distribution columns.

**Login into the postgres user**

```bash
$ sudo su postgres
```

**Login to psql**

```bash
$ psql -p 9700
```

**Login to the elevate_mentoring database**

```sql
\c elevate_mentoring
```

**Enable Citus for elevate_mentoring**

```sql
CREATE EXTENSION citus;
```

**Within elevate_mentoring, run the following queries:**

```sql
SELECT create_distributed_table('entities', 'entity_type_id');
SELECT create_distributed_table('entity_types', 'organization_id');
SELECT create_distributed_table('feedbacks', 'user_id');
SELECT create_distributed_table('forms', 'organization_id');
SELECT create_distributed_table('issues', 'id');
SELECT create_distributed_table('mentor_extensions', 'user_id');
SELECT create_distributed_table('notification_templates', 'organization_id');
SELECT create_distributed_table('organization_extension', 'organization_id');
SELECT create_distributed_table('post_session_details', 'session_id');
SELECT create_distributed_table('questions', 'id');
SELECT create_distributed_table('question_sets', 'code');
SELECT create_distributed_table('session_attendees', 'session_id');
SELECT create_distributed_table('session_enrollments', 'mentee_id');
SELECT create_distributed_table('session_ownerships', 'mentor_id');
SELECT create_distributed_table('sessions', 'id');
SELECT create_distributed_table('user_extensions', 'user_id');
```

## Running Seeder to Populate the Tables with Seed Data

**Exit the postgres user navigate to the src folder of the mentoring service and update the .env file with these variables:**

```bash
mentoring/src$ nano /opt/backend/mentoring/src/.env
```

```env
DEFAULT_ORG_ID=<id generated by the insertDefaultOrg script>
DEFAULT_ORGANISATION_CODE=default_code
```

**Run the seeder command**

```bash
mentoring/src$ npm run db:seed:all
```

## Start the Service

Run pm2 start command:

```bash
mentoring/src$ pm2 start app.js -i 2 --name elevate-mentoring
```

#### Run pm2 ls command

```bash
$ pm2 ls
```

Output should look like this (Sample output, might slightly differ in your installation):

```bash
┌────┬─────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                    │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼─────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 23 │ elevate-mentoring       │ default     │ 1.0.0   │ cluster │ 90643    │ 46h    │ 0    │ online    │ 0%       │ 171.0mb  │ jenkins  │ disabled │
│ 24 │ elevate-mentoring       │ default     │ 1.0.0   │ cluster │ 90653    │ 46h    │ 0    │ online    │ 0%       │ 168.9mb  │ jenkins  │ disabled │
└────┴─────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

This concludes the services and dependency setup.

## Postman Collections

-   [Mentoring Service](https://github.com/ELEVATE-Project/mentoring/tree/develop-2.5/src/api-doc)

</details>

```sql
postgres=# select citus_version();
                                       citus_version
----------------------------------------------------------------------------------------------------
 Citus 12.1.1 on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 9.4.0-1ubuntu1~20.04.2) 9.4.0, 64-bit
(1 row)
```

### Install PM2

Refer to [How To Set Up a Node.js Application for Production on Ubuntu 22.04](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-22-04).

**Exit the postgres user account and run the following command**

```bash
$ sudo npm install pm2@latest -g
```

## Setting up Repositories

### Clone the mentoring repository to /opt/backend directory

```bash
opt/backend$ git clone -b develop-2.5 --single-branch "https://github.com/ELEVATE-Project/mentoring.git"
```

### Install Npm packages from src directory

```bash
backend/mentoring/src$ sudo npm i
```

BigBlueButton™ Service (Optional) can be setup using the following method:

<details><summary>Setting up the BigBlueButton™ Service (Optional)</summary>

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

### Create .env file in src directory

```bash
mentoring/src$ sudo nano .env
```

Copy-paste the following env variables to the `.env` file:

```env
# Mentoring Service Config

# Port on which service runs
APPLICATION_PORT=3000

# Service environment
APPLICATION_ENV=development

# Route after the base URL
APPLICATION_BASE_URL=/mentoring/
APPLICATION_URL=https://dev.mentoring.shikshalokam.org

# Mongo db connectivity URL
MONGODB_URL=mongodb://localhost:27017/elevate-mentoring

# Token secret to verify the access token
ACCESS_TOKEN_SECRET='asadsd8as7df9as8df987asdf'

# Internal access token for communication between services via network call
INTERNAL_ACCESS_TOKEN='internal_access_token'

# Kafka hosted server URL
KAFKA_URL=localhost:9092

# Kafka group to which consumer belongs
KAFKA_GROUP_ID="mentoring"

# Kafka topic to push notification data
NOTIFICATION_KAFKA_TOPIC='develop.notifications'

# Kafka topic name to consume from mentoring topic
KAFKA_MENTORING_TOPIC="mentoringtopic"
SESSION_KAFKA_TOPIC='session'

# Kafka topic to push recording data
KAFKA_RECORDING_TOPIC="recordingtopic"

# Any one of three features available for cloud storage
CLOUD_STORAGE='AWS'
MENTOR_SESSION_RESCHEDULE_EMAIL_TEMPLATE=mentor_session_reschedule

# GCP json config file path
GCP_PATH='gcp.json'

# GCP bucket name which stores files
DEFAULT_GCP_BUCKET_NAME='gcp-bucket-storage-name'

# GCP project id
GCP_PROJECT_ID='project-id'

# AWS access key id
AWS_ACCESS_KEY_ID='aws-access-key-id'

# AWS secret access key
AWS_SECRET_ACCESS_KEY='aws-secret-access-key'

# AWS region where the bucket will be located
AWS_BUCKET_REGION='ap-south-1'

# AWS endpoint
AWS_BUCKET_ENDPOINT='s3.ap-south-1.amazonaws.com'

# AWS bucket name which stores files
DEFAULT_AWS_BUCKET_NAME='aws-bucket-storage-name'

# Azure storage account name
AZURE_ACCOUNT_NAME='account-name'

# Azure storage account key
AZURE_ACCOUNT_KEY='azure-account-key'

# Azure storage container which stores files
DEFAULT_AZURE_CONTAINER_NAME='azure-container-storage-name'

# User service host
USER_SERVICE_HOST='http://localhost:3001'

# User service base URL
USER_SERVICE_BASE_URL='/user/'

# Big blue button URL
BIG_BLUE_BUTTON_URL=https://dev.some.temp.org

# Big blue button base URL
BIB_BLUE_BUTTON_BASE_URL=/bigbluebutton/

# Meeting end callback events endpoint
MEETING_END_CALLBACK_EVENTS=https%3A%2F%2Fdev.some-apis.temp.org%2Fmentoring%2Fv1%2Fsessions%2Fcompleted

# Big blue button secret key
BIG_BLUE_BUTTON_SECRET_KEY=sa9d0f8asdg7a9s8d7f

# Big blue button recording ready callback URL
RECORDING_READY_CALLBACK_URL=http%3A%2F%2Flocalhost%3A3000%2F%3FmeetingID%3Dmeet123
BIG_BLUE_BUTTON_SECRET_KEY="s90df8g09sd8fg098sdfg"

# Enable logging of network requests
ENABLE_LOG=true

# API doc URL
API_DOC_URL='/api-doc'

# Internal cache expiry time
INTERNAL_CACHE_EXP_TIME=86400

# Redis Host connectivity URL
REDIS_HOST='redis://localhost:6379'

# Kafka internal communication
CLEAR_INTERNAL_CACHE='mentoringInternal'

# Enable email for reported issues
ENABLE_EMAIL_FOR_REPORT_ISSUE=true

# Email ID of the support team
SUPPORT_EMAIL_ID='support@xyz.com,team@xyz.com'

# Email template code for reported issues
REPORT_ISSUE_EMAIL_TEMPLATE_CODE='user_issue_reported'

BIG_BLUE_BUTTON_SESSION_END_URL='https%3A%2F%2Fdev.some-mentoring.temp.org%2F'

SCHEDULER_SERVICE_ERROR_REPORTING_EMAIL_ID="rakesh.k@some.com"
SCHEDULER_SERVICE_URL="http://localhost:4000/jobs/scheduleJob"
ERROR_LOG_LEVEL='silly'
DISABLE_LOG=false
DEFAULT_MEETING_SERVICE="BBB"
# BIG_BLUE_BUTTON_LAST_USER_TIMEOUT_MINUTES=15
SESSION_EDIT_WINDOW_MINUTES=0
SESSION_MENTEE_LIMIT=5
DEV_DATABASE_URL=postgres://shikshalokam:slpassword@localhost:9700/elevate_mentoring
MENTOR_SESSION_DELETE_EMAIL_TEMPLATE='mentor_session_delete'

SCHEDULER_SERVICE_HOST="http://localhost:4000"
SCHEDULER_SERVICE_BASE_URL= '/scheduler/'
DEFAULT_ORGANISATION_CODE="default_code"

REFRESH_VIEW_INTERVAL=30000
MENTEE_SESSION_ENROLLMENT_EMAIL_TEMPLATE=mentee_session_enrollment
DEFAULT_ORG_ID=1
```

Save and exit.

## Setting up Databases

**Log into the postgres user**

```bash
$ sudo su postgres
```

**Log into psql**

```bash
$ psql -p 9700
```

**Create a database user/role:**

```sql
CREATE USER shikshalokam WITH ENCRYPTED PASSWORD 'slpassword';
```

**Create the elevate_mentoring database**

```sql
CREATE DATABASE elevate_mentoring;
GRANT ALL PRIVILEGES ON DATABASE elevate_mentoring TO shikshalokam;
\c elevate_mentoring
GRANT ALL ON SCHEMA public TO shikshalokam;
```

## Running Migrations To Create Tables

**Exit the postgres user account and install sequelize-cli globally**

```bash
$ sudo npm i sequelize-cli -g
```

**Navigate to the src folder of mentoring service and run sequelize-cli migration command:**

```bash
mentoring/src$ npx sequelize-cli db:migrate
```

**Now all the tables must be available in the Citus databases**

## Setting up Distribution Columns in Citus PostgreSQL Database

Refer [Choosing Distribution Column](https://docs.citusdata.com/en/stable/sharding/data_modeling.html) for more information regarding Citus distribution columns.

**Login into the postgres user**

```bash
$ sudo su postgres
```

**Login to psql**

```bash
$ psql -p 9700
```

**Login to the elevate_mentoring database**

```sql
\c elevate_mentoring
```

**Enable Citus for elevate_mentoring**

```sql
CREATE EXTENSION citus;
```

**Within elevate_mentoring, run the following queries:**

```sql
SELECT create_distributed_table('entities', 'entity_type_id');
SELECT create_distributed_table('entity_types', 'organization_id');
SELECT create_distributed_table('feedbacks', 'user_id');
SELECT create_distributed_table('forms', 'organization_id');
SELECT create_distributed_table('issues', 'id');
SELECT create_distributed_table('mentor_extensions', 'user_id');
SELECT create_distributed_table('notification_templates', 'organization_id');
SELECT create_distributed_table('organization_extension', 'organization_id');
SELECT create_distributed_table('post_session_details', 'session_id');
SELECT create_distributed_table('questions', 'id');
SELECT create_distributed_table('question_sets', 'code');
SELECT create_distributed_table('session_attendees', 'session_id');
SELECT create_distributed_table('session_enrollments', 'mentee_id');
SELECT create_distributed_table('session_ownerships', 'mentor_id');
SELECT create_distributed_table('sessions', 'id');
SELECT create_distributed_table('user_extensions', 'user_id');
```

## Running Seeder to Populate the Tables with Seed Data

**Exit the postgres user navigate to the src folder of the mentoring service and update the .env file with these variables:**

```bash
mentoring/src$ nano /opt/backend/mentoring/src/.env
```

```env
DEFAULT_ORG_ID=<id generated by the insertDefaultOrg script>
DEFAULT_ORGANISATION_CODE=default_code
```

**Run the seeder command**

```bash
mentoring/src$ npm run db:seed:all
```

## Start the Service

Run pm2 start command:

```bash
mentoring/src$ pm2 start app.js -i 2 --name elevate-mentoring
```

#### Run pm2 ls command

```bash
$ pm2 ls
```

Output should look like this (Sample output, might slightly differ in your installation):

```bash
┌────┬─────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                    │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼─────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 23 │ elevate-mentoring       │ default     │ 1.0.0   │ cluster │ 90643    │ 46h    │ 0    │ online    │ 0%       │ 171.0mb  │ jenkins  │ disabled │
│ 24 │ elevate-mentoring       │ default     │ 1.0.0   │ cluster │ 90653    │ 46h    │ 0    │ online    │ 0%       │ 168.9mb  │ jenkins  │ disabled │
└────┴─────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

This concludes the services and dependency setup.

## Postman Collections

-   [Mentoring Service](https://github.com/ELEVATE-Project/mentoring/tree/develop-2.5/src/api-doc)

</details>

</br>

BigBlueButton™ Service (Optional) can be setup using the following method:

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

# Scripts

## Scheduler

To run the scheduler scripts

```bash
cd src/scripts
```

```bash
node schedulerScript.js
```

We have a dedicated [scheduler](https://github.com/ELEVATE-Project/scheduler) service running.

# Migrations Commands

### Check migrations

```bash
npm run elevate-migrations s
```

### Create migrations

```bash
npm run elevate-migrations create categoryEntity #Where categoryEntity is the file name.
```

<details><summary>20220726145008-categoryEntity.js</summary>

We have followed the following structure for migration files to reduce code duplication.

```js
let categories = [
	{
		value: 'sqaa',
		label: 'SQAA',
		image: 'entity/SQAA.jpg',
	},
	{
		value: 'communication',
		label: 'Communication',
		image: 'entity/Communication.png',
	},
    ...
]
var moment = require('moment')

module.exports = {
	async up(db) {
		global.migrationMsg = 'Uploaded categories entity'
		let entityData = []
		categories.forEach(async function (category) {
			category['status'] = 'ACTIVE'
			category['deleted'] = false
			category['type'] = 'categories'
			category['updatedAt'] = moment().format()
			category['createdAt'] = moment().format()
			category['createdBy'] = 'SYSTEM'
			category['updatedBy'] = 'SYSTEM'
			entityData.push(category)
		})
		await db.collection('entities').insertMany(entityData)
	},

	async down(db) {
		db.collection('entities').deleteMany({
			value: { $in: categories.map((category) => category.value) },
		})
	},
}
```

</details>

### Run migrations

```bash
npm run elevate-migrations up
```

### Down migrations

```bash
npm run elevate-migrations down
```

To know more about migrations refer project [Wiki](https://github.com/ELEVATE-Project/mentoring/wiki/Migration)

# Run tests

## Integration tests

```
npm run test:integration
```

To know more about integration tests and their implementation refer to the project [Wiki](https://github.com/ELEVATE-Project/user/wiki/Integration-and-Unit-testing).

## Unit tests

```
npm test
```

# Dependencies

This project is depended on a [user](https://github.com/ELEVATE-Project/user) , [notification](https://github.com/ELEVATE-Project/notification) and [scheduler](https://github.com/ELEVATE-Project/scheduler) service.
Set up these services using the setup guide.
You're free to use any micro-service that is optimal for the use case.
You can learn more about the full implementation of MentorEd [here](https://elevate-docs.shikshalokam.org/.mentorEd/intro) .
The frontend/mobile application [repo](https://github.com/ELEVATE-Project/mentoring-mobile-app).

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
