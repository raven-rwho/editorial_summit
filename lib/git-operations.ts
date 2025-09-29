import { simpleGit, SimpleGit } from 'simple-git'
import path from 'path'
import fs from 'fs/promises'

export async function commitMarkdownToRepo(
  markdownContent: string,
  title: string
): Promise<{ success: boolean; filePath?: string; commitHash?: string; error?: string }> {
  try {
    const git: SimpleGit = simpleGit()

    // Configure git user (required for commits)
    const gitUserName = process.env.GIT_USER_NAME || 'Claude Code Bot'
    const gitUserEmail = process.env.GIT_USER_EMAIL || 'claude-code@anthropic.com'

    await git.addConfig('user.name', gitUserName)
    await git.addConfig('user.email', gitUserEmail)

    // Generate a slug from the title for the filename
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Add metadata to the markdown content
    const frontMatter = `---
title: "${title}"
date: "${new Date().toISOString()}"
tags: ["Summit", "transcript"]
draft: false
summary: "Meeting summary generated from transcript"
---

`

    const fullContent = frontMatter + markdownContent

    // Create the file path in the data/posts directory
    const fileName = `${slug}.mdx`
    const filePath = path.join(process.cwd(), 'data', 'posts', fileName)

    // Write the file
    await fs.writeFile(filePath, fullContent, 'utf8')

    // Stage the file
    await git.add(filePath)

    // Commit the file
    const commitMessage = `Add meeting summary: ${title}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`

    const commitResult = await git.commit(commitMessage)

    return {
      success: true,
      filePath: `data/posts/${fileName}`,
      commitHash: commitResult.commit,
    }
  } catch (error) {
    console.error('Error committing to repo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function checkGitStatus(): Promise<{ isClean: boolean; status: string }> {
  try {
    const git: SimpleGit = simpleGit()
    const status = await git.status()

    return {
      isClean: status.isClean(),
      status: JSON.stringify(status, null, 2),
    }
  } catch (error) {
    console.error('Error checking git status:', error)
    return {
      isClean: false,
      status: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
