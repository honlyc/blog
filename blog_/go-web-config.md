---
title: "Go Web 读取配置文件"
date: 2019-04-06T22:08:54+08:00
draft: true
tags: ["web","golang","viper"]
categories: ["golang"]
---

# Viper 简介

[viper](https://github.com/spf13/viper)是``spf13``大神开发的开源配置解决方案，另外``docker`` ``kubernetes``等项目都在用的命令行解决方案[cobra](https://github.com/spf13/cobra)也是出自他之手。

``Viper``主要的特性有:

* setting defaults 

  > 设置默认值

* reading from JSON, TOML, YAML, HCL, and Java properties config file

  > 可以读取``JSON`` ``TOML`` ``YAML`` ``HCL`` 和 ``Java Properties``配置文件

* live watching and re-reading of config files (optional)

  > 监控配置文件改动，并热加载配置文件

* reading from environment variables

  > 从环境变量读取配置

* reading from remote config systems (etcd or Consul), and watching changes

  > 从远程配置中心读取配置（etcd or consul），并监控改动

* reading from command line flags

  > 从命令行 flag 读取配置

* reading from buffer

  > 从缓存中读取配置

* setting explicit values

  > 支持直接配置值

# 初始化配置

首先在主函数中增加配置初始化入口

```go
package main

import (
	"github.com/spf13/pflag"
	"h-blog/config"
	"h-blog/server"
)

var (
	conf = pflag.StringP("config", "c", "", "h-blog config file path.")
)

func main() {
	pflag.Parse()

	// init config
	if err := config.Init(*conf); err != nil {
		panic(err)
	}
	server.Start()
}

```

在``main``函数中主要是定义了一个``flag``来作为配置文件的路径和文件名。可以使用命令行来进行传值，如``./h-blog -c config.yml``也可以为空，默认是读取``conf``文件夹下的``config.yml``文件。

其中``config.Init(*conf)``主要是用来初始化配置，并进行``watch``，热加载配置文件。

```go
func Init(cfg string) error {
	c := Config{
		Name: cfg,
	}

	// 初始化配置文件
	if err := c.initConfig(); err != nil {
		return err
	}

	// 监控配置文件变化并热加载程序
	c.watchConfig()

	return nil
}
```

其中，``initConfig``是用来初始化配置的

```go
func (c *Config) initConfig() error {
	if c.Name != "" {
		viper.SetConfigFile(c.Name) // 如果指定了配置文件，则解析指定的配置文件
	} else {
		viper.AddConfigPath("conf") // 如果没有指定配置文件，则解析默认的配置文件
		viper.SetConfigName("config")
	}
	viper.SetConfigType("yml")     // 设置配置文件格式为YML
	viper.AutomaticEnv()            // 读取匹配的环境变量
	viper.SetEnvPrefix("HBLOG") // 读取环境变量的前缀为HBLOG
	replacer := strings.NewReplacer(".", "_") // 这里是把YML文件中的 . 替换成环境变量中的 _ 
	viper.SetEnvKeyReplacer(replacer)
	if err := viper.ReadInConfig(); err != nil { // viper解析配置文件
		return err
	}

	return nil
}
```

1. 首先判断是否有从命令行传进来的文件名，没有指定则使用默认的``conf/config.yml``.

2. 设置配置文件的格式为``yml``

3. 设置读取匹配的环境变量

4. 设置环境变量的前缀和变量符号的替换

   > 如果``yml``文件中为：
   >
   > ```yml
   > addr: :8080
   > db:
   >   name: blog
   > ```
   >
   > 则可以通过环境变量
   >
   > ```bash
   > export HBLOG_ADDR=:5000
   > export HBLOG_DB_NAME=blog
   > ```
   >
   > 来对这个值进行设置，所有``yml``中的``.``都通过``_``来替代。这种方式在``kubernetes``中用得比较多

5. 读取配置

而``watchConfig()``则主要是用来监控配置的变化，已达到热更新，也就是不用重启程序，即可读取到最新的配置，极大地便利了配置的更新和问题的调试。

```go
// 监控配置文件变化并热加载程序
func (c *Config) watchConfig() {
	viper.WatchConfig()
	viper.OnConfigChange(func(e fsnotify.Event) {
        // 这里可以做相应的操作
		log.Printf("Config file changed: %s", e.Name)
	})
}
```

# 读取配置

``Viper``在初始化后，就可以直接使用了，用起来也是非常简单。可以直接通过``viper.GetString()`` ``viper.GetInt()`` ``viper.GetBool()`` 等方法直接获取。

如：使用``gin``模块时，有几种模式``debug`` ``release`` ``test``可以选择。我们在配置文件中进行配置：

```yml
runmode: debug	# 开发模式, debug, release, test
```

在代码中则直接使用即可：

```go
gin.SetMode(viper.GetString("runmode"))
```

如果是多级配置，同样可以直接使用``viper.GetString("db.name")``来获取。

# Viper 深度用法

## 读取环境变量作为配置

前面也有说到``viper``初始化时两个重要的配置：

```go
viper.AutomaticEnv()            // 读取匹配的环境变量
viper.SetEnvPrefix("HBLOG") // 读取环境变量的前缀为HBLOG
replacer := strings.NewReplacer(".", "_")
viper.SetEnvKeyReplacer(replacer)
```

这其实主要就是通过从环境变量中读取配置，现在越来越多的应用都部署在``kubernetes``这种容器集群中，这样就可以直接通过环境变量类进行配置，``viper``可以直接读取配置。

# 小结

这篇主要是介绍了``viper``开源配置解决方案的常见用法，以及如何与``web``项目结合起来使用，还介绍了``viper``读取环境变量的用法。

## 参考

[【Go API 开发实战 6】基础 2：配置文件读取](https://mp.weixin.qq.com/s?__biz=MjM5ODYwMjI2MA==&mid=2649741516&idx=7&sn=6119fd491a0397c25b4aad05e70d64fa&chksm=bed34bb789a4c2a1906602332c0959f2084849bb2ef9f6876cb0a12fb7b923bd0ba52a2b62be&mpshare=1&scene=1&srcid=#rd)