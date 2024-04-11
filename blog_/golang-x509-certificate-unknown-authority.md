---
title: "解决 Golang https 请求时，x509: certificate signed by unknown authority 问题"
date: 2019-08-23T14:17:17+08:00
draft: true
---

在使用``http``请求``https://**``网站时，报了``x509: certificate signed by unknown authority``这个错误。经查阅，是由于目标网站的``CA``证书在本机没有，这类问题有几种解决方式：

## 1. 使用``TLS``

网上通常的方式是通过设置``tls``来跳过证书检测，即：

```go
timeout = time.Duration(10 * time.Second) //超时时间50ms
client  = &http.Client{
    Timeout: timeout,
    Transport: &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
}
```

这样，使用``client``就不会再报该错误了。但此方法是跳过了检测，在某些场景并不适用，就只能使用其他方式了。

## 2. 添加证书到本机上

在各个``OS``中，添加根证书的方式是不同的。对于``Linux``系统来说，使用

```bash
sudo cp {client}/cacert.pem /etc/ssl/certs
```

这就是手动把``CA``证书添加到本机的证书链，再进行请求，就可以成功访问了。

但这种方式存在一定弊端就是如果你客户端部署在多台机器，就得手动每台都添加；并且，还需要有``root``权限才能做，通常我们开发是没有服务器的``root``权限的。

这样，我们还可以使用第三种方式来解决

## 3. 请求内嵌证书

类似第一种方式，我们同样是配置``TLS``，但这次我们不进行跳过，而是直接将``*.pem``文件配置给``client``，这样既保证能够访问，又不是直接地跳过。

```go
rootCA := `*.pem 文件的内容`
roots := x509.NewCertPool()
ok := roots.AppendCertsFromPEM([]byte(rootCA))
if !ok {
    panic("failed to parse root certificate")
}
client  = &http.Client{
    Transport: &http.Transport{
		TLSClientConfig: &tls.Config{RootCAs: roots},
	}
}
```

这样，就大功告成啦。

# 总结

当然，这三种方式都并不是互斥的，每一种都有不同的使用场景。

如果你是写了一个爬虫，那你肯定只需也只能使用第一种跳过的方式，这样可以更为高效地爬取。

如果你能够拿到证书，但是没有``root``权限，但是又要求使用证书，就得用第三种方式了。

而一般如果有运维部门帮你给每台服务器都添加证书，当然他们只能使用第二种，这样，你的程序完全可以不用考虑这个问题了。

