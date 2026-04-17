#!/usr/bin/env node
import { init } from './commands/init.js'
import { preview } from './commands/preview.js'

const command = process.argv[2]

switch (command) {
  case 'init':
    await init()
    break
  case 'preview':
    await preview()
    break
  default:
    console.log('Usage: vibe-gallery <command>')
    console.log('')
    console.log('Commands:')
    console.log('  init     Interactive setup wizard — generates gallery.config.yaml')
    console.log('  preview  Build and preview your gallery locally')
    process.exit(command ? 1 : 0)
}
