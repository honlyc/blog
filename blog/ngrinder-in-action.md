---
title: "nGrinder 压测工具的使用"
date: 2021-03-02T10:22:00+08:00
draft: true
tags: ["test"]
categories: ["java","ngrinder"]
---

# 前言

我们在程序上线前，应该做好完备的测试工作：单元测试、集成测试等，同样的，压力测试也是一个重要指标，每次上线时的压力测试，可以直观地反应出程序修改后的运行状态及是否能够承受线上环境的压力。

常用的压力测试工具有很多，我这里是用的``nGrinder``，我会从搭建、使用、脚本等几个方面来一一介绍``nGrinder``是如何使用的。

# 搭建

我这里是基于``Docker``和``docker-compose``来搭建的，一是搭建简单，只需要一个``docker-compose.yml``文件即可，二是后面扩展``agent``时，能够快速管理及使用。

直接上文件吧，``docker-compose.yml``文件：

```yaml
version: "2"
services:
  ngrinder-controller:
    image: ngrinder/controller:3.5.3
    ports:
      - 9002:80
      - 16001:16001
      - 12000-12009:12000-12009
      - 9010-9019:9010-9019
  ngrinder-agent:
    image: ngrinder/agent:3.5.3
    links:
      - ngrinder-controller
    command:
      - ngrinder-controller:80
```

我用的版本是``3.5.5``，如果需求要用其他版本，直接修改即可。

使用``docker-compose up -d``跑起来就行啦。

# 使用

在程序运行起来后，可以直接访问``ip:9002``，这里注意，因为原本默认的``80``端口，在服务器上一般不会直接使用，所以我用了``9002:80``来进行映射，所以是访问``ip:9002``。

## 登录

![image-20210302103543243](http://img.honlyc.com/image-20210302103543243.png)

看到这个界面，我们第一步就完成啦，直接使用默认账号：``admin``，密码：``admin``登录即可。密码最好是登录后自己修改一下，防止随意登录，因为是压测系统，如果随意使用的话，极有可能造成系统压力加大。

登录后的界面：

![image-20210302103901507](http://img.honlyc.com/image-20210302103901507.png)

主要是上面两个标签：

``Performance Test``：指我们所有的测试，点击可以看到我们运行过的所有测试，后面我会详细讲解；

``Script``：这里是我们测试需要用到的脚本，脚本现在是支持``Groovy``、``Jython``和``Groovy Gradle Project``三种，具体使用我会在后面详细讲解；

## 创建 Script

要运行一个测试，我们需要先创建一个``Script``，用于测试时调用。点击上方的``Script``即可：

![image-20210302104624306](http://img.honlyc.com/image-20210302104624306.png)

这里可以用来创建``Script``，也可以创建文件夹，来便于区分和管理。同时，我们可以看到右侧的``SVN``，``nGrinder``内置了一个``SVN``来管理我们的``Script``，可以有效地区分每个测试用例所使用的``Script``版本，不至于在改了``Script``后，不知道哪些测试用了哪些``Script``。

同时，也可以用来做对比测试。

点击``Create a script``，就可以创建了：

![image-20210302150413984](http://img.honlyc.com/image-20210302150413984.png)

填写对应的参数即可。

## 运行测试

在创建完``Script``后，我们就可以创建测试了，点``Performance Test`` -> ``Create Test``：

![image-20210302150617351](http://img.honlyc.com/image-20210302150617351.png)

依次填写对应的信息，

``Test Name``：测试名称，可以填写业务相关的信息，如：service-{api}-test；

``Agent``：使用多少个``agent``进行运行，当前我这里只有一个，所以最大只能填``1``，如果想要更大的并发，就需要部署多个``agent``来支撑了；

``Vuser per agent``：表示每个``agent``使用多少个虚拟用户，其实就相当于多少个请求，后面可以配置使用多少个线程及进程；

``Script``：选择我们刚刚创建好的脚本即可；

``Duration``：是表示测试持续多久；

填写完之后，点右上的``Save and Start``就可以运行了。

# 运行结果

![image-20210302151457049](http://img.honlyc.com/image-20210302151457049.png)

在结果展示里面，我们就可以看到整个的``TPS``、平均响应时间、执行的测试数量、错误数量等信息了。