import { Feed } from 'feed'
import BLOG from '@/blog.config'
import ReactDOMServer from 'react-dom/server'
import { getPostBlocks } from '@/lib/notion'
import { NotionRenderer } from 'react-notion-x'
import dynamic from 'next/dynamic'

const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then((m) => m.Code)
)
const Equation = dynamic(() =>
  import('react-notion-x/build/third-party/equation').then((m) => m.Equation)
)
const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(
    (m) => m.Collection
  )
)
const CollectionRow = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(
    (m) => m.CollectionRow
  )
)

const mapPageUrl = (id) => 'https://www.notion.so/' + id.replace(/-/g, '')

const createFeedContent = async (post) => {
  const content = ReactDOMServer.renderToString(
    <NotionRenderer
      recordMap={await getPostBlocks(post.id)}
      components={{
        equation: Equation,
        code: Code,
        collection: Collection,
        collectionRow: CollectionRow
      }}
      mapPageUrl={mapPageUrl}
    />
  )
  const regexExp =
    /<div class="notion-collection-row"><div class="notion-collection-row-body"><div class="notion-collection-row-property"><div class="notion-collection-column-title"><svg.*?class="notion-collection-column-title-icon">.*?<\/svg><div class="notion-collection-column-title-body">.*?<\/div><\/div><div class="notion-collection-row-value">.*?<\/div><\/div><\/div><\/div>/g
  return content.replace(regexExp, '')
}

export async function generateRss (posts) {
  const year = new Date().getFullYear()
  const feed = new Feed({
    title: BLOG.title,
    description: BLOG.description,
    id: `${BLOG.link}/${BLOG.path}`,
    link: `${BLOG.link}/${BLOG.path}`,
    language: BLOG.lang,
    favicon: `${BLOG.link}/favicon.svg`,
    copyright: `All rights reserved ${year}, ${BLOG.author}`,
    author: {
      name: BLOG.author,
      email: BLOG.email,
      link: BLOG.link
    }
  })
  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: `${BLOG.link}/${post.slug}`,
      link: `${BLOG.link}/${post.slug}`,
      description: post.summary,
      content: await createFeedContent(post),
      date: new Date(post?.date?.start_date || post.createdTime)
    })
  }
  return feed.atom1()
}
