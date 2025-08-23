# 🗳️ SuperPoll

**A Modern, Secure Real-time Polling Platform**

SuperPoll is a cutting-edge polling application that combines real-time voting, advanced security measures, and AI-powered insights to deliver the most robust polling experience available.

![SuperPoll Banner](https://img.shields.io/badge/SuperPoll-Live%20Polling-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTFIMTVNOSAxNUgxM00xNyAzSDdDNS44OTU0MyAzIDUgMy44OTU0MyA1IDVWMTlMMTIgMTJIMTdDMTguMTA0NiAxMiAxOSAxMS4xMDQ2IDE5IDEwVjVDMTkgMy44OTU0MyAxOC4xMDQ2IDMgMTcgM1oiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K)

## 🌟 Features

### 📊 Core Polling Features
- **Real-time Voting**: Live vote updates using WebSocket connections
- **Flexible Poll Creation**: Support for 2-4 options with customizable settings
- **Quick Create Mode**: Instant poll creation with AI-powered option parsing
- **Poll Expiration**: Automatic expiration with customizable time limits
- **Results Control**: Hide results until voting or show live results
- **QR Code Generation**: Easy poll sharing with auto-generated QR codes

### 🔒 Advanced Security System

#### Multi-Layer Vote Protection
1. **Device Fingerprinting** (Primary)
   - 15+ device characteristics collection
   - Screen resolution, timezone, language, platform
   - Canvas & WebGL fingerprinting
   - Hardware concurrency & memory detection
   - Survives cookie clearing & browser changes

2. **Cookie-based Tokens** (Secondary)
   - Unique vote tokens per poll
   - HttpOnly secure cookies
   - Cross-origin support with proper SameSite settings

3. **IP-based Rate Limiting** (Tertiary)
   - Smart network-level protection
   - Max 3 votes per IP per hour (shared networks)
   - Subnet-based detection for corporate networks

4. **Database Constraints**
   - `@@unique([pollId, deviceHash])` - Device-based uniqueness
   - `@@unique([pollId, tokenHash])` - Cookie-based uniqueness
   - `@@unique([pollId, idempotencyKey])` - Duplicate submission prevention

#### Rate Limiting & DDoS Protection
- **General API**: 300 requests per 15 minutes
- **Voting Specific**: 5 votes per minute (strict)
- **Suspicious Activity Detection**: Automated bot detection
- **Redis-based Caching**: High-performance rate limiting

### 🤖 AI-Powered Features
- **Smart Insights**: AI-generated poll analysis and trends
- **Advanced Analytics**: Voting patterns and participation analysis
- **Quick Create Parser**: Natural language to poll options conversion
- **Anomaly Detection**: Automated suspicious voting pattern detection

### 🎨 User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live vote counts and viewer statistics
- **Social Media Integration**: OG meta tags for rich link previews
- **Creator Dashboard**: Advanced poll management and analytics
- **Share Panel**: Multiple sharing options with QR codes

### 📈 Analytics & Insights
- **Vote Statistics**: Detailed voting breakdowns and percentages
- **Timing Analysis**: Vote momentum and participation patterns
- **Geographic Insights**: IP-based voting distribution
- **Trend Detection**: AI-powered voting trend analysis

## 🏗️ Architecture

### Frontend (React + Vite)
```
Frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route components
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utilities (API, fingerprinting)
│   └── assets/        # Static assets
├── public/            # Public assets
└── package.json       # Dependencies
```

**Tech Stack:**
- **React 19** - Modern React with concurrent features
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client with interceptors
- **Lucide React** - Beautiful icons

### Backend (Node.js + Express)
```
Server/
├── controllers/       # Business logic
├── routes/           # API endpoints
├── middleware/       # Security & validation
├── prisma/          # Database schema & migrations
├── utils/           # Utilities (crypto, insights)
└── socket/          # WebSocket handlers
```

**Tech Stack:**
- **Node.js** - JavaScript runtime
- **Express 5** - Web framework
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching & rate limiting
- **Socket.io** - Real-time communication
- **Canvas** - QR code & image generation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Redis server (optional, for production)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YashSakhareliya/SuperPoll.git
cd SuperPoll
```

2. **Setup Backend**
```bash
cd Server
npm install
cp .env.example .env
# Configure your environment variables
npx prisma migrate dev
npm run dev
```

3. **Setup Frontend**
```bash
cd ../Frontend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/superpoll"
REDIS_URL="redis://localhost:6379"
SECRET_KEY="your-secret-key-here"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

#### Frontend (.env)
```env
VITE_API_URL="http://localhost:3000"
```

## 📡 API Documentation

### Poll Management
- `POST /api/polls` - Create new poll
- `GET /api/polls/:id` - Get poll details
- `PUT /api/polls/:id/settings` - Update poll settings
- `DELETE /api/polls/:id` - Delete poll

### Voting System
- `POST /api/polls/:id` - Cast vote (with fingerprint)
- `POST /api/polls/:id/vote-status` - Check vote status

### Analytics
- `GET /api/polls/:id/stats` - Get poll statistics
- `GET /api/polls/:id/insights` - Get AI insights

### Utilities
- `GET /api/polls/:id/qr` - Generate QR code
- `GET /og/poll/:id` - OG meta tags

## 🔐 Security Features

### Vote Integrity
- **One Vote Per Device**: Advanced fingerprinting prevents multiple votes
- **Cookie Persistence**: Maintains vote state across sessions  
- **IP Rate Limiting**: Prevents mass voting from single networks
- **Transaction Safety**: Database transactions ensure data consistency

### DDoS Protection
- **Multi-tier Rate Limiting**: Different limits for different endpoints
- **Redis-based Tracking**: High-performance request tracking
- **Suspicious Activity Detection**: Automated bot and spam detection
- **Proxy Trust**: Proper IP detection behind proxies

### Data Security
- **CORS Protection**: Strict cross-origin policies
- **Helmet Security**: Security headers and XSS protection
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

## 🌐 Deployment

### Production Setup

#### Backend (Railway/Heroku)
```bash
# Build and deploy
npm run build
npm run db:deploy
npm start
```

#### Frontend (Vercel/Netlify)
```bash
# Build for production
npm run build
```

### Environment Configuration
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Set secure cookie settings
- Enable Redis for production rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Performance

- **Real-time Updates**: < 100ms latency for vote updates
- **Fingerprint Generation**: < 50ms average collection time
- **Database Queries**: Optimized with proper indexing
- **Rate Limiting**: Redis-based for high throughput
- **Bundle Size**: Optimized frontend bundle < 500KB

## 🛡️ Security Audit

SuperPoll implements industry-leading security practices:

- ✅ **OWASP Top 10 Protection**
- ✅ **Advanced Bot Detection**
- ✅ **Multi-layer Vote Validation**
- ✅ **Real-time Anomaly Detection**
- ✅ **Secure Cookie Handling**
- ✅ **CSRF Protection**
- ✅ **XSS Prevention**
- ✅ **SQL Injection Prevention**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Yash Sakhareliya**
- GitHub: [@YashSakhareliya](https://github.com/YashSakhareliya)
- Project: [SuperPoll](https://github.com/YashSakhareliya/SuperPoll)

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for secure, real-time polling
- Community feedback and contributions

---

**SuperPoll** - *Where every vote counts, and security never compromises* 🗳️✨
