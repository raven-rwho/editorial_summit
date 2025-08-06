import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

function findMjsFiles(dir) {
  const files = []

  function traverse(currentDir) {
    const items = readdirSync(currentDir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = join(currentDir, item.name)

      if (item.isDirectory()) {
        traverse(fullPath)
      } else if (item.name.endsWith('.mjs')) {
        files.push(fullPath)
      }
    }
  }

  traverse(dir)
  return files
}

async function fixContentlayerAssertions() {
  try {
    // .contentlayer 폴더가 존재하는지 확인
    if (!existsSync('.contentlayer')) {
      console.log('No .contentlayer folder found')
      return
    }

    // .contentlayer 폴더의 모든 .mjs 파일 찾기
    const files = findMjsFiles('.contentlayer')

    for (const file of files) {
      const content = readFileSync(file, 'utf8')

      // assert { type: 'json' }를 with { type: 'json' }로 변경
      const fixedContent = content.replace(
        /assert\s*\{\s*type:\s*['"]json['"]\s*\}/g,
        "with { type: 'json' }"
      )

      if (content !== fixedContent) {
        writeFileSync(file, fixedContent)
        console.log(`Fixed import assertions in: ${file}`)
      }
    }

    console.log('Contentlayer import assertions fix completed!')
  } catch (error) {
    console.error('Error fixing contentlayer assertions:', error)
  }
}

fixContentlayerAssertions()
