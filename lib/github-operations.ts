import { generateCompleteMarkdown, generateSlug } from './markdown-generator'

interface GitHubFileResponse {
  sha: string
  path: string
}

/**
 * Commit markdown file to GitHub repository using GitHub API
 * This works in serverless environments like Vercel
 */
export async function commitMarkdownToGitHub(
  markdownContent: string,
  title: string,
  summary: string,
  imageData?: { url: string; alt: string; credit: string; localPath?: string }
): Promise<{ success: boolean; filePath?: string; commitHash?: string; error?: string }> {
  try {
    console.log('\n=== GITHUB API OPERATIONS START ===')

    // Validate required environment variables
    const githubToken = process.env.GITHUB_TOKEN
    const githubOwner = process.env.GITHUB_OWNER
    const githubRepo = process.env.GITHUB_REPO
    const githubBranch = process.env.GITHUB_BRANCH || 'main'

    if (!githubToken || !githubOwner || !githubRepo) {
      throw new Error(
        'Missing required environment variables: GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO must be set'
      )
    }

    console.log(`[GITHUB] Repository: ${githubOwner}/${githubRepo}`)
    console.log(`[GITHUB] Branch: ${githubBranch}`)

    // Generate a slug from the title for the filename
    const baseSlug = generateSlug(title)
    console.log(`[GITHUB] Generated slug from title: "${title}" → "${baseSlug}"`)

    // Check if file exists and append timestamp if needed
    const fileName = await getUniqueFileName(
      githubToken,
      githubOwner,
      githubRepo,
      githubBranch,
      baseSlug
    )
    const filePath = `data/posts/${fileName}`
    console.log(`[GITHUB] File path: ${filePath}`)

    // Generate complete markdown with frontmatter and embedded image
    console.log(`[GITHUB] Generating complete markdown file...`)
    const fullContent = generateCompleteMarkdown(markdownContent, title, summary, imageData)

    // Create or update the file on GitHub
    console.log(`[GITHUB] Creating file on GitHub...`)
    const result = await createOrUpdateFile(
      githubToken,
      githubOwner,
      githubRepo,
      githubBranch,
      filePath,
      fullContent,
      `Add meeting summary: ${title}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`
    )

    console.log(`[GITHUB] ✓ File created successfully`)
    console.log(`[GITHUB] Commit SHA: ${result.sha}`)
    console.log('=== GITHUB API OPERATIONS COMPLETE ===\n')

    return {
      success: true,
      filePath: filePath,
      commitHash: result.sha,
    }
  } catch (error) {
    console.error('\n=== GITHUB API OPERATIONS FAILED ===')
    console.error('[GITHUB] ❌ Error:', error)
    console.error('=== END GITHUB ERROR ===\n')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Check if a file exists and generate a unique filename if needed
 */
async function getUniqueFileName(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  baseSlug: string
): Promise<string> {
  const fileName = `${baseSlug}.mdx`
  const filePath = `data/posts/${fileName}`

  try {
    // Try to fetch the file
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (response.ok) {
      // File exists, append timestamp
      const timestamp = Date.now()
      const uniqueFileName = `${baseSlug}-${timestamp}.mdx`
      console.log(`[GITHUB] ⚠️  File already exists! Using unique name: ${uniqueFileName}`)
      return uniqueFileName
    } else {
      // File doesn't exist, use original name
      console.log(`[GITHUB] ✓ Filename is unique: ${fileName}`)
      return fileName
    }
  } catch (error) {
    console.log(`[GITHUB] ✓ Filename is unique: ${fileName}`)
    return fileName
  }
}

/**
 * Create or update a file in GitHub repository
 */
async function createOrUpdateFile(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
  commitMessage: string
): Promise<GitHubFileResponse> {
  // Get the current file SHA if it exists (needed for updates)
  let sha: string | undefined

  try {
    console.log(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`)
    const getResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (getResponse.ok) {
      const data = await getResponse.json()
      sha = data.sha
      console.log(`[GITHUB] File exists, will update (SHA: ${sha})`)
    }
  } catch {
    // File doesn't exist, that's fine
    console.log(`[GITHUB] File does not exist, will create new`)
  }

  // Create or update the file
  const body = {
    message: commitMessage,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch: branch,
    ...(sha && { sha }), // Include SHA only if updating existing file
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    )
  }

  const data = await response.json()
  return {
    sha: data.commit.sha,
    path: data.content.path,
  }
}
