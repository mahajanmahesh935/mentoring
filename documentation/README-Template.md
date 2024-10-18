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

{{DOCKER_COMPOSE_DOCUMENTATION}}

</details>

<details>
<summary>Natively Installed Services & Dependencies </summary>

{{PM2_DOCUMENTATION}}

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

-   [Mentoring Service](https://github.com/ELEVATE-Project/mentoring/tree/master/documentation/{{MENTORED_VERSION}}/postman-collections/mentoring)
-   [User Service](https://github.com/ELEVATE-Project/mentoring/tree/master/documentation/{{MENTORED_VERSION}}/postman-collections/mentoring)
-   [Notification Service](https://github.com/ELEVATE-Project/mentoring/tree/master/documentation/{{MENTORED_VERSION}}/postman-collections/mentoring)
-   [Scheduler Service](https://github.com/ELEVATE-Project/mentoring/tree/master/documentation/{{MENTORED_VERSION}}/postman-collections/mentoring)

# Dependencies

This project relies on the following services:

-   [User Service](https://github.com/ELEVATE-Project/user)
-   [Notification Service](https://github.com/ELEVATE-Project/notification)
-   [Scheduler Service](https://github.com/ELEVATE-Project/scheduler)
-   [Interface Service](https://github.com/ELEVATE-Project/interface-service)

Please follow the setup guide provided with each service to ensure proper configuration. While these are the recommended services, feel free to utilize any alternative microservices that better suit your project's requirements.

For a comprehensive overview of the implementation, refer to the [Mentor Documentation](https://elevate-docs.shikshalokam.org/mentor/intro).

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
