import fs from 'fs';
import path from 'path';

export interface PhpFileRecord {
  filename: string;
  category: string;
  description: string;
  content: string;
}

export function getPhpSourceFiles(): PhpFileRecord[] {
  const phpDir = path.join(process.cwd(), 'php');
  const files: PhpFileRecord[] = [];

  const list: Array<{ relativePath: string; category: string; description: string }> = [
    {
      relativePath: 'schema.sql',
      category: 'Database Schema',
      description: 'Complete MySQL DDL with 16 normalized tables, foreign keys, indexes, triggers, and seed data.',
    },
    {
      relativePath: 'config/db.php',
      category: 'Core Database & Auth',
      description: 'PDO database connection, transaction wrapper, session authentication, and CSRF protection.',
    },
    {
      relativePath: 'oauth_google.php',
      category: 'Google OAuth 2.0 Auth',
      description: 'Google Account Login, server-side code exchange, user provisioning, account linking, and CSRF token state validation.',
    },
    {
      relativePath: 'business.php',
      category: 'Business Management',
      description: 'Multi-business dashboard, Add Business controller with business limit enforcement.',
    },
    {
      relativePath: 'admin.php',
      category: 'Admin Panel',
      description: 'Admin panel controlling global business limits, per-user limits, and business status.',
    },
    {
      relativePath: 'bank_accounts.php',
      category: 'Banking & Shared Accounts',
      description: 'Multi-business bank accounts, shared bank account conversion, and bank statement logic.',
    },
    {
      relativePath: 'README.md',
      category: 'Documentation',
      description: 'Installation guide, MySQL setup, and architecture summary.',
    },
  ];

  for (const item of list) {
    try {
      const fullPath = path.join(phpDir, item.relativePath);
      if (fs.existsSync(fullPath)) {
        files.push({
          filename: item.relativePath,
          category: item.category,
          description: item.description,
          content: fs.readFileSync(fullPath, 'utf-8'),
        });
      }
    } catch (e) {
      console.error('Error reading PHP file:', item.relativePath, e);
    }
  }

  return files;
}
