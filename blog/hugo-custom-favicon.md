---
title: "Hugo 常用修改"
date: 2019-04-04T17:50:09+08:00
draft: true
tags: ["use"]
categories: ["hugo"]
---

# favicon

使用``Hugo``搭建博客后，一般在使用了``Theme``后，会自带一个``favicon``，不过使用自己的会更(zhuang)好(13)。

其实使用这个很简单，自己准备一张图片。到这个网站去进行生成一下：[realfavicongenerator](<https://realfavicongenerator.net/>)，下载压缩包解压到使用主题的``static``目录下，我使用的是``even``主题，所以就是在``themes/even/static/``这个目录下，替换所有的解压文件，然后重新``hugo -D``即可。

# static file

在``static``目录下的文件，生成后，是直接使用根路径调用，如我在``static``目录下添加``wxpay.png``文件后，赞赏的图片路径直接使用``/wxpay.png``即可。

