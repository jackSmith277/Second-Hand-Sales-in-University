# A Java demo application

This demo repository is used to show how to streamline build and deployment using pipelines in CodeArts.

## Basic Information

+ Language: **Java**
+ Template: a Java web project based on Spring Boot
+ Function: basic scaffolding code for development of Java web applications

## How to Build

### Environment Dependency

Build Dependency
* JDK 8 (OpenJDK is fine) 
* **Maven 3.3** Build Tool

### How to Download Code

Clone code in the environment.
Install the following tools:
* [Maven 3.3]
* [JDK 1.8]

### Build Procedure

In the repository root directory

* Run the following command:
```bash
mvn clean install
```
* Build:
```bash
mvn clean compile
```
* Execute unit test cases:
```bash
mvn test
```
* Execute integration test cases:
```bash
mvn verify
```

* Package:
```bash
mvn package
```

* Install to the local Maven repository:
```bash
mvn install
```

## Build Task

* Build with Maven

* Upload software package to the release repository.

## How to Execute

### Local Execution

Run the following command to start the application:

```bash
java -jar ./target/javaWebDemo-1.0.jar
```

Visit http://localhost:8080/.


## Pipeline

- Whether Automatic Pipeline Creation Is Supported: **Supported**

- Pipeline Structure

> Start Stage
+ Source code repository

> Build Stage
+ Build task
+ Code check task

> Deployment Stage
+ Deployment task
+ API test task

