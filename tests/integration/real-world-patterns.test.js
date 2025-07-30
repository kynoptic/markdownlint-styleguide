/**
 * @integration
 * Tests against real-world markdown patterns discovered in popular repositories.
 * This test suite captures common patterns without requiring external dependencies.
 */
import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceRule from '../../src/rules/sentence-case-heading.js';
import backtickRule from '../../src/rules/backtick-code-elements.js';

/**
 * Real-world markdown patterns collected from popular repositories
 */
const REAL_WORLD_PATTERNS = {
  // From Next.js documentation
  nextjs: `# Getting Started with Next.js

## Installation and Setup

To get started with Next.js, run the following commands:

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

### API Routes

Create API routes in the pages/api directory:

- Create a new file: pages/api/hello.js
- Export a default function that handles the request
- Use the req and res objects to handle HTTP requests

### Static Generation vs Server-side Rendering

Next.js supports both static generation and server-side rendering:

1. **Static Generation (SSG)**: Pages are pre-rendered at build time
2. **Server-side Rendering (SSR)**: Pages are rendered on each request
3. **Client-side Rendering (CSR)**: Content is rendered in the browser

## Configuration

Edit your next.config.js file to customize webpack settings:

\`\`\`javascript
module.exports = {
  webpack: (config) => {
    return config;
  },
};
\`\`\``,

  // From React documentation
  react: `# React Documentation

## Components and Props

React components are JavaScript functions that return JSX:

\`\`\`jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
\`\`\`

### Functional vs Class Components

- **Functional Components**: Use hooks for state and lifecycle
- **Class Components**: Use this.state and lifecycle methods

## State Management

### useState Hook

The useState hook lets you add state to functional components:

\`\`\`jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

### useEffect Hook

Use useEffect to perform side effects in functional components:

1. Data fetching
2. Setting up subscriptions  
3. Manually changing the DOM

## Best Practices

- Keep components small and focused
- Use PropTypes for type checking
- Follow the DRY principle (Don't Repeat Yourself)
- Use React.memo for performance optimization`,

  // From GitHub README patterns
  github: `# Project Name

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Quick Start

### Prerequisites

- Node.js 14.x or later
- npm 6.x or later
- Git 2.x or later

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/user/repo.git
   cd repo
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## 📚 Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)  
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: git checkout -b feature/amazing-feature
3. Commit your changes: git commit -m 'Add amazing feature'
4. Push to the branch: git push origin feature/amazing-feature
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.`,

  // From API documentation
  api: `# REST API Documentation

## Authentication

All API endpoints require authentication using Bearer tokens:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.example.com/users
\`\`\`

## Endpoints

### GET /api/users

Retrieves a list of users.

**Parameters:**
- limit (optional): Number of users to return (default: 10)
- offset (optional): Number of users to skip (default: 0)

**Response:**
\`\`\`json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "total": 100
}
\`\`\`

### POST /api/users

Creates a new user.

**Request Body:**
\`\`\`json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secure_password"
}
\`\`\`

## Error Handling

The API returns standard HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

### Error Response Format

\`\`\`json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "The email field is required"
  }
}
\`\`\``,

  // From tutorial/blog content
  tutorial: `# Building a REST API with Node.js and Express

## Table of Contents

1. [Setting Up the Project](#setting-up-the-project)
2. [Creating the Server](#creating-the-server)
3. [Database Integration](#database-integration)
4. [Authentication & Authorization](#authentication--authorization)
5. [Testing Your API](#testing-your-api)

## Setting Up the Project

First, create a new directory for your project:

\`\`\`bash
mkdir my-api
cd my-api
npm init -y
\`\`\`

Install the required dependencies:

\`\`\`bash
npm install express mongoose bcrypt jsonwebtoken
npm install -D nodemon jest supertest
\`\`\`

## Creating the Server

Create an app.js file in your project root:

\`\`\`javascript
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
\`\`\`

### Environment Variables

Create a .env file:

\`\`\`
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapi
JWT_SECRET=your-secret-key
\`\`\`

**Important:** Never commit your .env file to version control!

## Database Integration

### Setting up MongoDB

1. Install MongoDB locally or use MongoDB Atlas
2. Create a models/User.js file:

\`\`\`javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('User', userSchema);
\`\`\`

## Testing Your API

Use a tool like Postman or curl to test your endpoints:

\`\`\`bash
# Test the root endpoint
curl http://localhost:3000/

# Create a new user
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'
\`\`\`

## Deployment

### Using PM2

1. Install PM2 globally: npm install -g pm2
2. Start your app: pm2 start app.js
3. Monitor with: pm2 monit

### Using Docker

Create a Dockerfile:

\`\`\`dockerfile
FROM node:16

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
\`\`\`

Build and run:

\`\`\`bash
docker build -t my-api .
docker run -p 3000:3000 my-api
\`\`\`

## Conclusion

You now have a basic REST API setup! Next steps:

- Add input validation
- Implement rate limiting
- Add comprehensive logging
- Set up monitoring and alerts`
};

/**
 * Test a rule against real-world content and return full lint results
 */
async function testRuleAgainstContent(rule, content, ruleName) {
  const results = await lint({
    customRules: [rule],
    strings: { content },
    resultVersion: 3
  });

  const violations = results.content || [];
  const ruleViolations = violations.filter(v => 
    v.ruleNames.includes(ruleName) || v.ruleNames.some(name => name.includes(ruleName.split('-')[0]))
  );

  return {
    violations: ruleViolations,
    violationCount: ruleViolations.length,
    contentLength: content.length,
    contentLines: content.split('\n').length,
    fullResults: results.content // Include full results for snapshot testing
  };
}

describe('Real-World Pattern Tests', () => {
  describe('Sentence Case Heading Rule - Snapshot Tests', () => {
    for (const [source, content] of Object.entries(REAL_WORLD_PATTERNS)) {
      test(`${source} documentation patterns`, async () => {
        const results = await testRuleAgainstContent(sentenceRule, content, 'sentence-case-heading');
        
        // Snapshot the full lint results to catch any unintended changes
        expect(results.fullResults).toMatchSnapshot(`sentence-case-${source}`);
        
        // Basic sanity checks
        expect(results.contentLength).toBeGreaterThan(0);
        expect(Array.isArray(results.fullResults)).toBe(true);
      });
    }
  });

  describe('Backtick Code Elements Rule - Snapshot Tests', () => {
    for (const [source, content] of Object.entries(REAL_WORLD_PATTERNS)) {
      test(`${source} documentation patterns`, async () => {
        const results = await testRuleAgainstContent(backtickRule, content, 'backtick-code-elements');
        
        // Snapshot the full lint results to catch any unintended changes
        expect(results.fullResults).toMatchSnapshot(`backtick-${source}`);
        
        // Basic sanity checks
        expect(results.contentLength).toBeGreaterThan(0);
        expect(Array.isArray(results.fullResults)).toBe(true);
      });
    }
  });

  describe('Combined Rule Analysis - Snapshot Tests', () => {
    test('all rules against all patterns', async () => {
      const combinedResults = {};
      
      for (const [source, content] of Object.entries(REAL_WORLD_PATTERNS)) {
        const results = await lint({
          customRules: [sentenceRule, backtickRule],
          strings: { content },
          resultVersion: 3
        });

        const violations = results.content || [];

        combinedResults[source] = {
          sentenceViolations: violations.filter(v => v.ruleNames.includes('sentence-case-heading')),
          backtickViolations: violations.filter(v => v.ruleNames.includes('backtick-code-elements')),
          meta: {
            contentLength: content.length,
            contentLines: content.split('\n').length
          }
        };
      }
      
      // Snapshot the combined analysis to detect any behavioral changes
      expect(combinedResults).toMatchSnapshot('combined-rule-analysis');
    });
  });
});