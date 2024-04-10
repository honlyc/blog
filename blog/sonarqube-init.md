---
title: "Sonarqube 初步使用"
date: 2021-10-09T15:03:40+08:00
draft: true
---

直接上``docker-compose.yml``

```yml
version: "2"
services:
  sonarqube:
    image: sonarqube:lts
    container_name: sonarqube
    depends_on:
      - db
    environment:
      SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: "true"
      SONAR_JDBC_URL: jdbc:postgresql://db:5432/sonar
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar
    volumes:
      - ./data:/opt/sonarqube/data
      - ./extensions:/opt/sonarqube/extensions
      - ./logs:/opt/sonarqube/logs
    ports:
      - 9002:9000
  db:
    image: postgres:12
    restart: always
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar
    volumes:
      - ./postgresql_data:/var/lib/postgresql/data
```

# 遇到问题

1. ``postgresql``报错：

   一开始用的是``postgresql:12``，死活启动不起来，报错：``/docker-entrypoint-initdb.d/ ``权限错误，换成``postgres:12-alpine``后就好了。

   根本原因应该不是版本问题，是``volumes``初始化问题，因为再换回``12``又同样可以了。

2. ``sonarqube``报错：``could not find java in ES_JAVA_HOME at /usr/lib/jvm/java-11-openjdk/bin/java``

   这是因为新版的问题，一开始用的``sonarqube:commutity``的版本，换回``sonarqube:lts``就好了。

   或者配置``seccomp-profile``，详细的可以看[这里](https://jira.sonarsource.com/browse/SONAR-15167)和[这里](https://community.sonarsource.com/t/sonarqube-container-latest-does-not-start/46498)

3. ``gradle sonarqube``报错：``Unable to load component class org.sonar.scanner.report.MetadataPublisher``

   这是因为``jdk``版本和``sonarqube``要求的版本不一致，会有提示：``SonarScanner will require Java 11 to run, starting in SonarQube 9.x``，换成高版本``jdk``即可。

4. ``sonarqube``中的``ce.log``报错：``duplicate **key** value violates unique constraint "rules_parameters_unique"``

   参考[这里](https://community.sonarsource.com/t/docker-container-boot-failed-after-update-and-rollback/21387/3)，我一开始用的版本是``14``，需要把``postgres``的版本降到``12``才行。

5. 
