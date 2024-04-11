export const projects: Project[] = [
  {
    title: '阿彪的小站',
    description: '🦖 基于 Docusaurus 静态网站生成器实现个人博客',
    preview: '/img/project/blog.png',
    website: 'https://honlyc.com',
    source: 'https://github.com/honlyc/blog',
    tags: ['opensource', 'design', 'favorite'],
    type: 'web',
  },
  {
    title: '一键式后台开发项目',
    description: '基于 Kratos 的快速开发框架',
    preview: '/img/project/atreus-admin.png',
    website: 'https://github.com/go-atreus/atreus-server',
    source: 'https://github.com/go-atreus/atreus-server',
    tags: ['opensource', 'favorite'],
    type: 'web',
  },
  {
    title: 'go-atreus-admin',
    description: ' Kratos + RBAC + React 编写的一款前后端分离的权限管理系统',
    preview: '/img/project/nest-vben-admin.png',
    website: 'http://atreus.honlyc.com',
    source: 'https://github.com/go-atreus/atreus-server',
    tags: ['opensource', 'favorite', 'product', 'large'],
    type: 'web',
  },
  // toy
  // {
  //   title: 'Image Hosting',
  //   description: '🖼️ 使用 Supabase 搭建一个简易图床',
  //   preview: '/img/project/image-hosting.png',
  //   website: 'https://image.kuizuo.cn',
  //   source: 'https://github.com/kuizuo/image-hosting',
  //   tags: ['opensource'],
  //   type: 'web',
  // },
  // {
  //   title: 'Vitesse Nuxt3 Strapi',
  //   description: '一个 Vitesse Nuxt3 Strapi 的模板，灵感来源 Vitesse',
  //   preview: '/img/project/vitesse-nuxt3-strapi.png',
  //   website: 'https://vitesse-nuxt3-strapi.vercel.app',
  //   source: 'https://github.com/kuizuo/vitesse-nuxt3-strapi',
  //   tags: ['opensource'],
  //   type: 'web',
  // },
  // personal
  {
    title: 'go-tools',
    description: 'golang 工具包',
    preview: '/img/project/vscode-extension.png',
    website: 'https://github.com/go-atreus/tools',
    source: 'https://github.com/go-atreus/tools',
    tags: ['opensource'],
    type: 'personal',
  },
  // {
  //   title: '@kuizuo/utils',
  //   description: '整理 JavaScript / TypeScript 的相关工具函数',
  //   website: 'https://www.npmjs.com/package/@kuizuo/utils',
  //   tags: ['opensource', 'personal'],
  //   type: 'personal',
  // },
  // {
  //   title: '@kuizuo/eslint-config',
  //   description: '来自 antfu 的 ESLint 配置文件',
  //   website: 'https://github.com/kuizuo/eslint-config',
  //   tags: ['opensource', 'personal'],
  //   type: 'personal',
  // },
  // commerce
  // {
  //   title: 'link-admin',
  //   description: '基于 nest-vben-admin 编写的一次性充值链接销售系统',
  //   preview: '/img/project/link-admin.png',
  //   website: 'http://link.kuizuo.cn',
  //   tags: ['product', 'large'],
  //   type: 'commerce',
  // },
  // {
  //   title: 'youni',
  //   description: '基于 nest-vben-admin 编写的一次性充值链接销售系统',
  //   preview: '/img/project/link-admin.png',
  //   website: 'http://link.kuizuo.cn',
  //   tags: ['product', 'large'],
  //   type: 'commerce',
  // },
  // other
]

export type Tag = {
  label: string
  description: string
  color: string
}

export type TagType = 'favorite' | 'opensource' | 'product' | 'design' | 'large' | 'personal'

export type ProjectType = 'web' | 'app' | 'commerce' | 'personal' | 'toy' | 'other'

export const projectTypeMap = {
  web: '网站',
  app: '应用',
  commerce: '商业项目',
  personal: '个人',
  toy: '玩具',
  other: '其他',
}

export type Project = {
  title: string
  description: string
  preview?: string
  website: string
  source?: string | null
  tags: TagType[]
  type: ProjectType
}

export const Tags: Record<TagType, Tag> = {
  favorite: {
    label: '喜爱',
    description: '我最喜欢的网站，一定要去看看!',
    color: '#e9669e',
  },
  opensource: {
    label: '开源',
    description: '开源项目可以提供灵感!',
    color: '#39ca30',
  },
  product: {
    label: '产品',
    description: '与产品相关的项目!',
    color: '#dfd545',
  },
  design: {
    label: '设计',
    description: '设计漂亮的网站!',
    color: '#a44fb7',
  },
  large: {
    label: '大型',
    description: '大型项目，原多于平均数的页面',
    color: '#8c2f00',
  },
  personal: {
    label: '个人',
    description: '个人项目',
    color: '#12affa',
  },
}

export const TagList = Object.keys(Tags) as TagType[]

export const groupByProjects = projects.reduce(
  (group, project) => {
    const { type } = project
    group[type] = group[type] ?? []
    group[type].push(project)
    return group
  },
  {} as Record<ProjectType, Project[]>,
)
