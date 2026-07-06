import crypto from 'crypto';
import { createTempDirectory, writeSourceFile, cleanupTempDirectory } from '../utils/fileManager.js';
import { compileCode, runCode } from '../utils/docker.js';

export const executeCode = async (req, res) => {
  const { language, code, input = '', timeLimit = 2000, memoryLimit = 256 } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: 'Language and code are required' });
  }

  const uuid = crypto.randomUUID();
  let dirPath = null;
  const startTime = Date.now();

  try {
    dirPath = await createTempDirectory(uuid);

    await writeSourceFile(dirPath, language, code);

    const compileResult = await compileCode(uuid, dirPath, language);
    if (!compileResult.success) {
      return res.json({
        verdict: 'compile_error',
        stdout: '',
        stderr: compileResult.stderr,
        exitCode: 1,
        executionTime: Date.now() - startTime,
      });
    }

    const runResult = await runCode(uuid, dirPath, language, input, timeLimit, memoryLimit);
    
    return res.json({
      verdict: runResult.verdict,
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      exitCode: runResult.exitCode,
      executionTime: Date.now() - startTime,
    });

  } catch (error) {
    console.error('Execution Error:', error);
    return res.status(500).json({
      verdict: 'system_error',
      stdout: '',
      stderr: error.message,
      exitCode: -1,
      executionTime: Date.now() - startTime,
    });
  } finally {
    await cleanupTempDirectory(dirPath);
  }
};
