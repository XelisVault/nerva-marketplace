# Testing

The tests can be most easily run by running `python3 -m pytest` from within an interactive shell on the rest microservices container.

Docker example:
```
$ docker ps
CONTAINER ID   IMAGE                                           COMMAND                  CREATED          STATUS         PORTS                                         NAMES
de9a06c4c744   infrastructure-db                               "docker-entrypoint.s…"   8 minutes ago    Up 8 minutes   0.0.0.0:3306->3306/tcp, [::]:3306->3306/tcp   infrastructure-db-1
15eb4cfe05b1   infrastructure-marketplace_rest_microservices   "/bin/sh -c 'python3…"   8 minutes ago    Up 8 minutes   0.0.0.0:8001->8001/tcp, [::]:8001->8001/tcp   infrastructure-marketplace_rest_microservices-1
8405a449e9a9   redis:alpine                                    "docker-entrypoint.s…"   12 minutes ago   Up 8 minutes   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp   infrastructure-redis-1

$ docker exec -it infrastructure-marketplace_rest_microservices-1 bash

root@15eb4cfe05b1:/app# python3 -m pytest tests
```