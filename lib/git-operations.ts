import { simpleGit, SimpleGit } from 'simple-git'
import path from 'path'
import fs from 'fs/promises'
import { generateCompleteMarkdown, generateSlug } from './markdown-generator'

export async function commitMarkdownToRepo(
  markdownContent: string,
  title: string,
  summary: string,
  imageData?: { url: string; alt: string; credit: string; localPath?: string }
): Promise<{ success: boolean; filePath?: string; commitHash?: string; error?: string }> {
  try {
    console.log('\n=== GIT OPERATIONS START ===')
    const git: SimpleGit = simpleGit()

    // Configure git user (required for commits)
    const gitUserName = process.env.GIT_USER_NAME || 'Claude Code Bot'
    const gitUserEmail = process.env.GIT_USER_EMAIL || 'claude-code@anthropic.com'

    console.log(`[GIT] Setting user config:`)
    console.log(`  git config user.name "${gitUserName}"`)
    console.log(`  git config user.email "${gitUserEmail}"`)
    await git.addConfig('user.name', gitUserName)
    await git.addConfig('user.email', gitUserEmail)

    // Generate a slug from the title for the filename
    const baseSlug = generateSlug(title)
    console.log(`[GIT] Generated slug from title: "${title}" → "${baseSlug}"`)

    // Ensure unique filename by checking if file exists and appending timestamp if needed
    const postsDir = path.join(process.cwd(), 'data', 'posts')
    let fileName = `${baseSlug}.mdx`
    let filePath = path.join(postsDir, fileName)

    // Check if file exists and append timestamp to make it unique
    try {
      await fs.access(filePath)
      // File exists, append timestamp
      const timestamp = Date.now()
      fileName = `${baseSlug}-${timestamp}.mdx`
      filePath = path.join(postsDir, fileName)
      console.log(`[GIT] ⚠️  File already exists! Using unique name: ${fileName}`)
    } catch {
      // File doesn't exist, use original name
      console.log(`[GIT] ✓ Filename is unique: ${fileName}`)
    }

    // Generate complete markdown with frontmatter and embedded image
    console.log(`[GIT] Generating complete markdown file...`)
    const fullContent = generateCompleteMarkdown(markdownContent, title, summary, imageData)

    // Write the file
    console.log(`[GIT] Writing file: ${filePath}`)
    await fs.writeFile(filePath, fullContent, 'utf8')
    console.log(`[GIT] ✓ File written successfully`)

    // Stage the file and any downloaded images
    console.log(`[GIT] Staging files:`)
    console.log(`  git add ${filePath}`)
    await git.add(filePath)

    if (imageData?.localPath) {
      const imageFullPath = path.join(process.cwd(), 'public', imageData.localPath)
      console.log(`  git add ${imageFullPath}`)
      await git.add(imageFullPath)
      console.log(`[GIT] ✓ Staged markdown file and image`)
    } else {
      console.log(`[GIT] ✓ Staged markdown file (no image)`)
    }

    // Commit the file
    const commitMessage = `Add meeting summary: ${title}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`

    console.log(`[GIT] Creating commit:`)
    console.log(`  git commit -m "${commitMessage.split('\n')[0]}..."`)
    const commitResult = await git.commit(commitMessage)
    console.log(`[GIT] ✓ Commit created: ${commitResult.commit}`)
    console.log('=== GIT OPERATIONS COMPLETE ===\n')

    return {
      success: true,
      filePath: `data/posts/${fileName}`,
      commitHash: commitResult.commit,
    }
  } catch (error) {
    console.error('\n=== GIT OPERATIONS FAILED ===')
    console.error('[GIT] ❌ Error:', error)
    console.error('=== END GIT ERROR ===\n')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function checkGitStatus(): Promise<{ isClean: boolean; status: string }> {
  try {
    console.log('[GIT] Running: git status')
    const git: SimpleGit = simpleGit()
    const status = await git.status()

    console.log('[GIT] Status:', status.isClean() ? 'clean' : 'dirty')
    return {
      isClean: status.isClean(),
      status: JSON.stringify(status, null, 2),
    }
  } catch (error) {
    console.error('[GIT] ❌ Error checking git status:', error)
    return {
      isClean: false,
      status: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
