---
title: "Portainer in Action"
date: 2021-03-03T11:35:27+08:00
draft: true
tags: ["docker","portainer"]
categories: ["docker","swarm"]
---

# 前言

在使用``Docker``时，尽管我们可以使用``docker-compose``来进行编排，但终归是命令行，一旦应用多起来，管理方面就成了很大问题。

但如果直接上``k8s``这种呢，又有太多不确定性，所以就需要一个简单、轻量级、可控的管理工具，这里，我们使用了``Portainer``，接下来，我们一起来看看如何使用，以及不同场景下的适配。

# 初步使用

``Portainer``本身的搭建是非常简单的，同样也可以基于``Docker``部署，那我们就直接上文件吧：

```yaml
version: '3.2'

services:
  agent:
    image: portainer/agent
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/volumes:/var/lib/docker/volumes
    networks:
      - agent_network
    deploy:
      mode: global
      placement:
        constraints: [node.platform.os == linux]

  portainer:
    image: portainer/portainer
    command: -H tcp://tasks.agent:9001 --tlsskipverify
    ports:
      - "9000:9000"
      - "8000:8000"
    volumes:
      - portainer_data:/data
    networks:
      - agent_network
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints: [node.role == manager]

networks:
  agent_network:
    driver: overlay
    attachable: true

volumes:
  portainer_data:
```

