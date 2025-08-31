# Contributing to SuperPoll 🗳️

Thank you for your interest in contributing to SuperPoll! This document provides guidelines and instructions for contributing to our modern, secure real-time polling platform.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contributing Workflow](#contributing-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Testing](#testing)
- [Deployment](#deployment)
- [Getting Help](#getting-help)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **PostgreSQL** (for local database)
- **Redis** (for caching and real-time features)

### Fork and Clone the Repository

1. **Fork the repository** on GitHub by clicking the "Fork" button
2. **Clone your fork** to your local machine:

```bash
git clone https://github.com/YOUR_USERNAME/SuperPoll.git
cd SuperPoll
```

3. **Add the upstream remote** to keep your fork synced:

```bash
git remote add upstream https://github.com/YashSakhareliya/SuperPoll.git
```

4. **Create and switch to the develop branch**:

```bash
git checkout -b develop origin/develop
```

## ⚙️ Development Setup

### Backend Setup (Server)

1. **Navigate to the server directory**:
```bash
cd Server
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/superpoll"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
PORT=3001
NODE_ENV=development
```

4. **Set up the database**:
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:deploy
```

5. **Start the development server**:
```bash
npm run dev
```

The backend server will be available at `http://localhost:3001`

### Frontend Setup

1. **Navigate to the frontend directory**:
```bash
cd Frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit the `.env` file:
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

4. **Start the development server**:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
SuperPoll/
├── Frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── assets/          # Static assets
│   ├── public/              # Public assets
│   └── package.json
├── Server/                   # Node.js + Express backend
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Express middleware
│   ├── routes/              # API routes
│   ├── socket/              # WebSocket handlers
│   ├── utils/               # Server utilities
│   ├── prisma/              # Database schema and migrations
│   └── package.json
└── README.md
```

## 🔄 Contributing Workflow

### Important: Always Use the `develop` Branch

**⚠️ IMPORTANT: All pull requests must be made to the `develop` branch, NOT the `main` branch.**

The `main` branch is reserved for stable releases only.

### Step-by-Step Workflow

1. **Sync your fork with the upstream repository**:
```bash
git checkout develop
git fetch upstream
git merge upstream/develop
git push origin develop
```

2. **Create a new feature branch**:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/documentation-update
```

3. **Make your changes**:
   - Write clean, well-documented code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Commit your changes**:
```bash
git add .
git commit -m "feat: add new polling feature"
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

5. **Push to your fork**:
```bash
git push origin feature/your-feature-name
```

6. **Create a Pull Request**:
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - **Set the base branch to `develop`** (not `main`)
   - Fill out the PR template
   - Wait for review

## 📝 Coding Standards

### JavaScript/React Standards

- Use **ES6+** features
- Follow **React Hooks** patterns
- Use **functional components** over class components
- Implement proper **error handling**
- Use **TypeScript** where applicable

### Code Style

- Use **2 spaces** for indentation
- Use **semicolons**
- Use **single quotes** for strings
- Use **camelCase** for variables and functions
- Use **PascalCase** for components and classes

### Frontend Specific

- Use **Tailwind CSS** for styling
- Follow **component composition** patterns
- Implement **responsive design**
- Use **React Router** for navigation
- Handle **loading states** and **error boundaries**

### Backend Specific

- Use **Express.js** best practices
- Implement proper **error handling middleware**
- Use **Prisma ORM** for database operations
- Follow **RESTful API** conventions
- Implement **rate limiting** and **security measures**

## 🔍 Pull Request Guidelines

### Before Submitting

- [ ] Ensure your code follows the coding standards
- [ ] Run linting: `npm run lint`
- [ ] Test your changes locally
- [ ] Update documentation if needed
- [ ] Ensure your branch is up to date with `develop`

### PR Requirements

1. **Clear Title**: Use descriptive titles following conventional commit format
2. **Detailed Description**: Explain what changes you made and why
3. **Screenshots**: Include screenshots for UI changes
4. **Testing Notes**: Describe how to test your changes
5. **Breaking Changes**: Clearly mark any breaking changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All tests pass

## Screenshots (if applicable)
[Add screenshots here]

## Additional Notes
[Any additional information]
```

## 🧪 Testing

### Running Tests

Frontend:
```bash
cd Frontend
npm run test
```

Backend:
```bash
cd Server
npm run test
```

### Writing Tests

- Write **unit tests** for utilities and pure functions
- Write **integration tests** for API endpoints
- Write **component tests** for React components
- Mock external dependencies appropriately

## 🚀 Deployment

### Environment Setup

The project uses different environments:
- **Development**: Local development with hot reload
- **Staging**: Testing environment (develop branch)
- **Production**: Live environment (main branch)

### Database Migrations

When making database changes:

1. Create a new migration:
```bash
cd Server
npx prisma migrate dev --name your-migration-name
```

2. Test the migration locally
3. Include migration files in your PR

## 🆘 Getting Help

### Resources

- **Documentation**: Check the README.md for basic setup
- **Issues**: Search existing GitHub issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Don't hesitate to ask for help in your PR

### Communication

- **Be Respectful**: Maintain a friendly and professional tone
- **Be Patient**: Reviews may take time
- **Be Descriptive**: Provide context in issues and PRs
- **Ask Questions**: If something is unclear, ask!

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and configured correctly
2. **Redis Connection**: Make sure Redis is installed and running
3. **Port Conflicts**: Check if ports 3001 and 5173 are available
4. **Environment Variables**: Verify all required env vars are set

## 🎯 Areas for Contribution

We welcome contributions in these areas:

### High Priority
- **Security improvements**
- **Performance optimizations**
- **Bug fixes**
- **Accessibility improvements**

### Medium Priority
- **New polling features**
- **UI/UX enhancements**
- **Mobile responsiveness**
- **API improvements**

### Low Priority
- **Documentation updates**
- **Code refactoring**
- **Test coverage improvements**
- **Developer experience enhancements**

## 📊 Project Roadmap

Check our [GitHub Issues](https://github.com/YashSakhareliya/SuperPoll/issues) and [Project Board](https://github.com/YashSakhareliya/SuperPoll/projects) for:
- Current priorities
- Planned features
- Bug reports
- Enhancement requests

## 🏆 Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **Release notes** for significant contributions
- **Special mentions** in project updates

---

## 📄 License

By contributing to SuperPoll, you agree that your contributions will be licensed under the same license as the project.

---

**Happy Contributing! 🎉**

If you have any questions or need help getting started, feel free to open an issue or reach out to the maintainers.
