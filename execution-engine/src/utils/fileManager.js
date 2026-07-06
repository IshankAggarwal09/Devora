import fs from 'fs/promises';
import path from 'path';

export const createTempDirectory = async (uuid) => {
  const dirPath = path.join('/tmp', 'devora-runs', uuid);
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
};

export const writeSourceFile = async (dirPath, language, code) => {
  let fileName = '';
  if (language === 'cpp') {
    fileName = 'main.cpp';
  } else if (language === 'java') {
    fileName = 'Main.java';
  } else {
    throw new Error(`Unsupported language: ${language}`);
  }
  const filePath = path.join(dirPath, fileName);
  await fs.writeFile(filePath, code);
  return filePath;
};

export const cleanupTempDirectory = async (dirPath) => {
  if (dirPath) {
    await fs.rm(dirPath, { recursive: true, force: true });
  }
};
