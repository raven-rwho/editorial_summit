import { existsSync, readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

async function fixContentlayerAssertions() {
  try {
    // .contentlayer 폴더가 존재하는지 확인
    if (!existsSync('.contentlayer')) {
      console.log('No .contentlayer folder found')
      return
    }

    // .contentlayer 폴더의 모든 .mjs 파일 찾기
    const files = await glob('.contentlayer/**/*.mjs')

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
