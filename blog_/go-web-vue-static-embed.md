---
title: "Gin 和 Vue 项目打包静态文件"
date: 2019-04-16T17:14:49+08:00
draft: true
categories: ["golang"]
tags: ["vue","static file"]
---

在使用 Go 语言带来的便利时，我们往往也热衷于打包成单一的可执行文件，这样不仅方便传输，也便于维护。

如果是普通的``Go``程序，倒是直接可以编译成可执行文件，但是当使用``web``项目时，外部``html`` ``js`` ``css``等文件，就没法直接编译了，这就需要用到一些静态文件打包的方法。

可以直接在[awesome-go-resource-embedding](https://github.com/avelino/awesome-go#resource-embedding)看到有很多内嵌资源的方法，我这里只举例几个自己用过的，其他的你们可以自己去看看。

## go-bindata

刚说好的在上面的``awesome``里面找，结果一上来就是一个没列入在内的[go-bindata](https://github.com/jteeuwen/go-bindata)，这个项目并没有在``awesome``里面，可能是时间比较久，又没有再更新，不过我最终却是选用的这个，原因后面我会说到。

### 使用

首先，看看我的目录结构：

```bash
├── conf
│   └── config.yml
├── config
│   └── config.go
├── devops_ui
│   ├── build
│   ├── config
│   ├── favicon.ico
│   ├── index.html
│   ├── LICENSE
│   ├── node_modules
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   ├── README-zh.md
│   ├── src
│   └── static
├── dist
│   ├── favicon.ico
│   ├── index.html
│   └── static
```

其中，需要内嵌的静态文件有：

* ``conf``：是放置配置文件的
* ``dist``：是``vue``项目打包后的输出目录

安装``go-bindata``:

```bash
go get -u github.com/jteeuwen/go-bindata/...
```

打包静态文件：

```bas
go-bindata -o=./asset/asset.go -pkg=asset conf/... dist/...
```

> ``-o``: 表示输出的目录
>
> ``-pkg``： 表示输出的包名
>
> ``conf/... dist/...``: 后面跟需要打包的文件夹，不要忘了三个点

同样，也可以通过[go-bindata-assetfs](https://github.com/elazarl/go-bindata-assetfs)来进行打包，兼容``http.FiltSystem``，这样也更为方便：

```bash
go-bindata-assetfs -o ./asset/asset.go -pkg asset -prefix dist -modtime 1480000000 ./dist/...
```

**注意**：``-prefix dist``配置是用来忽略``dist``。详情请看[这里](<https://github.com/jteeuwen/go-bindata#path-prefix-stripping>)

### 在``Gin``中使用

```go
fs := assetfs.AssetFS{
		Asset:     asset.Asset,
		AssetDir:  asset.AssetDir,
		AssetInfo: asset.AssetInfo,
	}
r.StaticFS("/static", &fs)
```

