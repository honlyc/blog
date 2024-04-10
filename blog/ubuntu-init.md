---
title: "Ubuntu Init"
date: 2019-07-23T09:53:35+08:00
draft: true
---

[TOC]

# sudo 不需要输入密码

```shell
sudo vi /etc/sudoers
```

找到``%sudo ALL=(ALL:ALL) ALL``这一行，修改为：``%sudo ALL=(ALL:ALL) NOPASSWD:ALL``;

这样，所有``sudo``组内的用户使用``sudo``就不需要输入密码啦。

