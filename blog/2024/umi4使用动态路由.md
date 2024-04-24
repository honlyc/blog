---
title: "umi4使用动态路由"
date: 2024-04-24 22:03:53
authors: honlyc
tags: ['antd' 'web']
---

# 背景
升级到 `umi4` 后，自定义的 `BasicLayout` 拿不到 `routes` 了。导致无法自定义更新 `routes`。不得不另寻他路来实现动态路由。

# 整体思路

主要通过 `render` 和 `patchClientRoutes` 进行，其中 `render` 负责在渲染前从远端请求路由信息，`patchClientRoutes` 负责更新路由信息。

:::warning
注意点：由于这里使用了`render`进行数据拉取，如果不是`SSO`方式进行登录的话，需要在登录成功后手动`reload()`页面才能成功拉取到。
:::

# 代码实现

`routes.ts`文件：
```ts
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './User/Login',
      },
    ],
  },
  // 这个不能少，否则会在动态路由中报错。主要是给动态路由一个原始数据
  {
    path: '/welcome',
    name: 'welcome',
    icon: 'smile',
    access: 'admin',
    component: './Welcome',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
```


`app.tsx`文件添加：

```ts
let roleRoutes: any[] = []

const getRoleRoutes = () => {
  return fetchMenu().then(res => {
    roleRoutes = res.routes
  }).catch(err => {
    console.error(err)
  })
}

const loopRouteItem = (menus: any[], pId: number | string): RouteItem[] => {
  return menus.flatMap((item) => {
    let Component: React.ComponentType<any> | null = null;
    if (item.uri !== '') {
      // 防止配置了路由，但本地暂未添加对应的页面，产生的错误
      Component = React.lazy(() => new Promise((resolve, reject) => {
        import(`@/pages/${item.uri}`)
          .then(module => resolve(module))
          .catch((error) => {
            console.error(error)
            resolve(import(`@/pages/exception/404.tsx`))
          })
      }))
    }
    if (item.type === 0) {
      return [
        {
          path: item.path,
          name: item.title,
          icon: item.icon,
          id: item.id,
          parentId: pId,
          children: [
            {
              path: item.path,
              element: <Navigate to={item.children[0].path} replace />,
            },
            ...loopRouteItem(item.children, item.id)
          ]
        }
      ]
    } else {
      return [
        {
          path: item.path,
          name: item.title,
          icon: item.icon,
          id: item.id,
          parentId: pId,
          element: (
            // lazy 加载的页面需要使用 Suspense 防止空白
            <React.Suspense fallback={<div>Loading...</div>}>
              {Component && <Component />}
            </React.Suspense>
          )
        }
      ]
    }
  })
}

export const patchClientRoutes = ({ routes }: any) => {
  // 这里获取的是 routes.ts 中配置自定义 layout
  const routerIndex = routes.findIndex((item: any) => item.path === '/')
  const parentId = routes[routerIndex].id

  if (roleRoutes) {
    const newRoutes = routes[routerIndex]['routes']

    // 往路由中动态添加
    newRoutes.push(
      ...loopRouteItem(roleRoutes, parentId)
    )
  }

}

export const render = async (oldRender: Function) => {
  // 如果请求太慢，可选：自己实现一个加载器效果
  document.querySelector('#root')!.innerHTML = `<div>loading...</div>`
  const token = Token.get()
  // 判断是否登录
  if(token){
    // 这里是实际获取路由的方法
    await getRoleRoutes()
  }
  
  oldRender()
}
```

# 总结
与 `umi3` 使用 `BasicLayout` 相比，这种方式虽然在登录成功需要 `reload()` 这种比较怪异的操作，但整理而言还是能够接受的。



