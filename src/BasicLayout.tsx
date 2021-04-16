import React, { Suspense } from 'react'

import ProLayout, { PageLoading, MenuDataItem } from '@ant-design/pro-layout'

const BasicLayout: React.FC = ({ children }) => {

  return (
    <ProLayout
      route={{
        routes: [
          {
            path: '/home',
            name: '收藏',
            icon: 'icon-shoucang1',
          },
          {
            path: '/home/overview',
            name: 'FaceBook',
            icon: 'icon-facebook',
          },
          {
            path: '/home/search',
            name: 'Twitter',
            icon: 'icon-twitter',
          },
        ],
      }}
      location={{
        pathname: ''
      }}
      onMenuHeaderClick={e => console.log(e)}
      // menuItemRender={(item, dom) =>
      //   item.path ? <Link to={item.path}>{dom}</Link> : dom
      // }
      fixSiderbar={true}
      layout='top'
      contentStyle={{
        margin: 0,
      }}
      headerHeight={64}
      title='ECSOSO官网'
      menuHeaderRender={logo => logo}
    >
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </ProLayout>
  )
}

export default BasicLayout
