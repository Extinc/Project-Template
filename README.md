# Sonarqube & SonarScnanner

1. Sonarqube server is inside docker compose
2. Scanner cli service can be duplicated based on the number of project 
    - change the mount path
3. Update `SONAR_TOKEN` in docker compose
4. To get the token go to sonarqube server `localhost:9001` 
    - My Account > Security > Generate Tokens 
5. To Configure language for project
    - Create Project > Quality Profiles

# Kafka

1. Kafka UI for broker : UI for Apache Kafka, Kafdrop, Lenses



<!-- # Others

- [Commands](./docs/commands.md) -->

# Commands
1. To <b>start</b>  for specific services
```bash
docker compose up <service-name> -d
```

2. To <b>start</b> for specific profiles
```bash
docker compose --profile <profile-name> up -d
```

3. To <b>stop</b> services and <b>remove</b> services volumes
```bash
docker compose down -v <service-name>
```

# Notes

1. If a Docker Compose service is assigned to a profile and depends on other services, those dependent services must be included in the same profile(s).



# Common Issues
1. If database unable to detect role.
    - check if changed any data need to remove volume to reset the data.

2. Kafkdrop unable to connect.
    - check the  listener hosts to see if it is using the service name.