import { spawn } from 'child_process'
import { resolve } from 'path'

function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: true })
    child.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`))
    })
  })
}

export async function preview() {
  const projectRoot = process.cwd()
  console.log('🏗  Building gallery data...')
  await runCommand('npm', ['run', 'build:data'], projectRoot)

  console.log('📦 Building frontend...')
  await runCommand('npm', ['run', 'build:app'], projectRoot)

  console.log('\n✓ Preview running at http://localhost:4173\n')
  spawn('npm', ['run', 'preview'], { cwd: projectRoot, stdio: 'inherit', shell: true })
}
