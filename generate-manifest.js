#!/usr/bin/env node

/**
 * Script to generate manifest.json for quiz tests
 * 
 * Usage: node generate-manifest.js
 * 
 * This script scans the public/tests folder for .questionary files
 * and generates a manifest.json with metadata for each test.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const TESTS_DIR = path.join(__dirname, 'public', 'tests')
const MANIFEST_PATH = path.join(TESTS_DIR, 'manifest.json')

function extractMetadata(content) {
  const lines = content.split('\n')
  
  const title = lines.find(l => l.startsWith('###'))?.replace('###', '').trim() || 'Untitled'
  const subtitle = lines.find(l => l.startsWith('##'))?.replace('##', '').trim() || ''
  
  const durationLine = lines.find(l => l.startsWith('@duration'))
  const duration = durationLine ? durationLine.split(':')[1]?.trim() : '15min'
  
  const difficultyLine = lines.find(l => l.startsWith('@difficulty'))
  const difficulty = difficultyLine ? difficultyLine.split(':')[1]?.trim() : 'medio'
  
  const topicsLine = lines.find(l => l.startsWith('@topics'))
  const topics = topicsLine ? topicsLine.split(':')[1]?.split(',').map(s => s.trim()) : []
  
  return { title, subtitle, duration, difficulty, topics }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function generateManifest() {
  console.log('🔍 Scanning for .questionary files...')
  
  // Ensure tests directory exists
  if (!fs.existsSync(TESTS_DIR)) {
    console.error(`❌ Directory not found: ${TESTS_DIR}`)
    console.log('💡 Please create the public/tests directory first')
    process.exit(1)
  }
  
  // Read all files in tests directory
  const files = fs.readdirSync(TESTS_DIR)
  const questionaryFiles = files.filter(file => file.endsWith('.questionary'))
  
  if (questionaryFiles.length === 0) {
    console.warn('⚠️  No .questionary files found')
    console.log('💡 Add some .questionary files to public/tests/')
  }
  
  console.log(`📝 Found ${questionaryFiles.length} test file(s)`)
  
  // Process each file
  const tests = []
  
  for (const filename of questionaryFiles) {
    const filePath = path.join(TESTS_DIR, filename)
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const stats = fs.statSync(filePath)
      const metadata = extractMetadata(content)
      
      tests.push({
        filename,
        title: metadata.title,
        subtitle: metadata.subtitle,
        duration: metadata.duration,
        difficulty: metadata.difficulty,
        topics: metadata.topics,
        lastModified: stats.mtime.toISOString(),
        size: formatFileSize(stats.size)
      })
      
      console.log(`   ✓ ${filename}`)
      console.log(`      Title: ${metadata.title}`)
      console.log(`      Topics: ${metadata.topics.join(', ') || 'None'}`)
      
    } catch (error) {
      console.error(`   ✗ Error processing ${filename}:`, error.message)
    }
  }
  
  // Create manifest object
  const manifest = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    totalTests: tests.length,
    tests: tests
  }
  
  // Write manifest.json
  try {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
    console.log(`\n✅ Manifest generated successfully!`)
    console.log(`📄 Location: ${MANIFEST_PATH}`)
    console.log(`📊 Total tests: ${tests.length}`)
  } catch (error) {
    console.error('❌ Error writing manifest.json:', error.message)
    process.exit(1)
  }
}

// Run the script
try {
  generateManifest()
} catch (error) {
  console.error('❌ Fatal error:', error.message)
  process.exit(1)
}
