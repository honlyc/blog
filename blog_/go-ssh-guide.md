---
title: "使用 Go 来进行远程执行命令"
date: 2019-04-03T15:42:14+08:00
draft: true
---

1. 封装一个``Cli``类，来作为主要执行的对象

   ```go
   type Cli struct {
   	IP         string      //IP地址
   	Username   string      //用户名
   	Password   string      //密码
   	Port       int         //端口号
   	client     *ssh.Client //ssh客户端
   	LastResult string      //最近一次Run的结果
   }
   ```

   参考：

   > [Go语言远程执行ssh命令简单封装(支持带交互命令)](https://www.cnblogs.com/chenqionghe/p/8267326.html)