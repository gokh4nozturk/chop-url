#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';

const program = new Command();

interface WaitlistUser {
  id: number;
  email: string;
  name: string;
  company?: string;
  use_case: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// const API_URL = process.env.API_URL || 'http://localhost:8787';
const API_URL = 'http://localhost:8787';

async function fetchWaitlist(): Promise<WaitlistUser[]> {
  const response = await fetch(`${API_URL}/api/admin/waitlist`);
  const data = (await response.json()) as { waitListUsers: WaitlistUser[] };
  return data.waitListUsers;
}

async function approveUser(email: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/admin/waitlist/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error || 'Failed to approve user');
  }
}

async function listUsers() {
  const spinner = ora('Fetching waitlist users...').start();

  try {
    const users = await fetchWaitlist();
    spinner.stop();

    if (users.length === 0) {
      console.log(chalk.yellow('\nNo pending users in waitlist.'));
      return;
    }

    console.log(chalk.green('\nPending Waitlist Users:'));
    for (const user of users) {
      console.log(`
        ${chalk.blue('Email:')} ${user.email}
        ${chalk.blue('Name:')} ${user.name}
        ${chalk.blue('Company:')} ${user.company || 'N/A'}
        ${chalk.blue('Use Case:')} ${user.use_case}
        ${chalk.blue('Created At:')} ${new Date(
          user.created_at
        ).toLocaleString()}
        ${chalk.gray('---')}
      `);
    }
  } catch (error) {
    spinner.fail('Failed to fetch waitlist users');
    console.error(chalk.red(error));
    process.exit(1);
  }
}

async function approveUserInteractive() {
  try {
    const users = await fetchWaitlist();

    if (users.length === 0) {
      console.log(chalk.yellow('\nNo pending users in waitlist.'));
      return;
    }

    const { selectedUser } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedUser',
        message: 'Select a user to approve:',
        choices: users.map((user) => ({
          name: `${user.name} (${user.email}) - ${
            user.company || 'No company'
          }`,
          value: user.email,
        })),
      },
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to approve ${selectedUser}?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Operation cancelled'));
      return;
    }

    const spinner = ora('Approving user...').start();

    await approveUser(selectedUser);

    spinner.succeed(chalk.green('User approved successfully!'));
  } catch (error) {
    console.error(chalk.red('Failed to approve user:'), error);
    process.exit(1);
  }
}

program
  .name('waitlist')
  .description('CLI tool for managing Chop URL waitlist')
  .version('1.0.0');

program
  .command('list')
  .description('List all pending waitlist users')
  .action(listUsers);

program
  .command('approve')
  .description('Approve a waitlist user interactively')
  .action(approveUserInteractive);

program.parse();
