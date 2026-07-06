import { exec, spawn } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export const compileCode = async (uuid, dirPath, language) => {
  let command = '';
  if (language === 'cpp') {
    command = `docker run --rm -v ${dirPath}:/app devora-executor-cpp:latest g++ main.cpp -o main`;
  } else if (language === 'java') {
    command = `docker run --rm -v ${dirPath}:/app devora-executor-java:latest javac Main.java`;
  } else {
    throw new Error(`Unsupported language for compilation: ${language}`);
  }

  try {
    const { stdout, stderr } = await execPromise(command, { timeout: 10000 });
    return { success: true, stderr };
  } catch (error) {
    return { success: false, stderr: error.stderr || error.message };
  }
};

export const runCode = (uuid, dirPath, language, input, timeLimit, memoryLimit) => {
  return new Promise((resolve) => {
    let image = '';
    let runCommand = [];
    if (language === 'cpp') {
      image = 'devora-executor-cpp:latest';
      runCommand = ['./main'];
    } else if (language === 'java') {
      image = 'devora-executor-java:latest';
      runCommand = ['java', 'Main'];
    }

    const containerName = `devora-run-${uuid}`;

    const args = [
      'run',
      '-i',
      '--rm',
      `--name=${containerName}`,
      '--network=none',
      `--memory=${memoryLimit}m`,
      '--cpus=0.5',
      '--pids-limit=64',
      '--read-only',
      '-v',
      `${dirPath}:/app`,
      image,
      ...runCommand,
    ];

    const child = spawn('docker', args);

    let stdout = '';
    let stderr = '';
    
    let isTimeout = false;
    const timer = setTimeout(() => {
      isTimeout = true;
      exec(`docker rm -f ${containerName}`, () => {});
    }, timeLimit);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (isTimeout) {
        resolve({ verdict: 'timeout', stdout, stderr, exitCode: 137 });
      } else if (code !== 0) {
        resolve({ verdict: 'runtime_error', stdout, stderr, exitCode: code });
      } else {
        resolve({ verdict: 'success', stdout, stderr, exitCode: code });
      }
    });

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
};
