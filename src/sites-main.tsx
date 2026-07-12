import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SiteGuide from './pages/SiteGuide.tsx'
import type { PlatformId } from '@/core/types'

// GitHub Pagesはパスルーティングできないため、サイト別ガイドは sites/<platformId>.html の
// 静的ファイルとして並べる(#45)。20数ページがほぼ同一の骨格を共有するため、entryファイルを
// サイトごとに複製せず、この1本を共有してhtml側の data-platform 属性からIDを渡す
const platformId = document.body.dataset.platform as PlatformId

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteGuide platformId={platformId} />
  </StrictMode>,
)
