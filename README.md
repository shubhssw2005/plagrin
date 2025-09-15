# Plagrin AI Detector

A web application that detects whether images or videos might be AI-generated using the Sightengine API.

## 🚀 Live Demo

- **Frontend**: [https://plagrin.vercel.app](https://plagrin.vercel.app)
- **Backend API**: [https://plagrin-backend.onrender.com](https://plagrin-backend.onrender.com)

## 📋 Features

- **Image Analysis**: Upload JPG, PNG, WebP, GIF files for AI detection
- **Video Analysis**: Upload MP4, MOV, WebM files for AI detection
- **Reference Comparison**: Optional trustworthy reference image upload
- **PDF Context**: Upload reference PDFs for better analysis context
- **Real-time Results**: Get instant analysis with confidence scores

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Sightengine    │
│   (Vercel)      │───▶│   (Render)      │───▶│     API         │
│                 │    │                 │    │                 │
│ - Static HTML   │    │ - Express.js    │    │ - AI Detection  │
│ - CSS/JS        │    │ - File Upload   │    │ - Analysis      │
│ - File Upload   │    │ - API Proxy     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Structure and semantics
- **CSS3** - Styling and responsive design
- **Vanilla JavaScript** - File handling and API communication
- **Deployed on**: Vercel

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Multer** - File upload handling
- **node-fetch** - HTTP requests to Sightengine
- **CORS** - Cross-origin resource sharing
- **Deployed on**: Render

## 🚀 Local Development

### Prerequisites
- Node.js (v18 or higher)
- Sightengine API credentials

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/shubhssw2005/plagrin.git
   cd plagrin
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file with your Sightengine credentials
   echo "SIGHTENGINE_API_USER=your_api_user" > .env
   echo "SIGHTENGINE_API_SECRET=your_api_secret" >> .env
   echo "SIGHTENGINE_MODELS=text-content" >> .env
   
   # Start the backend server
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   
   # Serve static files (choose one method)
   python3 -m http.server 8080
   # OR
   npx serve -p 8080
   ```

4. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8787

## 🌐 Deployment

### Backend Deployment (Render)

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `SIGHTENGINE_API_USER`: Your Sightengine API user
     - `SIGHTENGINE_API_SECRET`: Your Sightengine API secret
     - `SIGHTENGINE_MODELS`: `text-content`

### Frontend Deployment (Vercel)

1. **Connect your GitHub repository to Vercel**
2. **Configure the project:**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (project root)
   - **Build Command**: Leave empty
   - **Output Directory**: `frontend`

The `vercel.json` configuration will automatically serve the frontend files.

## 📁 Project Structure

```
plagrin/
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Styling
│   └── script.js           # Frontend JavaScript
├── backend/
│   ├── server.js           # Express server
│   ├── package.json        # Backend dependencies
│   └── .env               # Environment variables (not in git)
├── vercel.json            # Vercel deployment config
├── .env                   # Root environment variables (not in git)
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🔧 API Endpoints

### Health Check
```
GET /api/health
Response: { "ok": true }
```

### Image Analysis
```
POST /api/check-image
Content-Type: multipart/form-data
Body: { media: File }
Response: Sightengine analysis results
```

## 🔒 Environment Variables

### Backend (.env)
```env
SIGHTENGINE_API_USER=your_api_user_here
SIGHTENGINE_API_SECRET=your_api_secret_here
SIGHTENGINE_MODELS=text-content
PORT=8787
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational purposes only and may not be 100% accurate. For reliable content provenance, look for embedded content credentials (C2PA) or platform-signed watermarks.

## 🙏 Acknowledgments

- [Sightengine](https://sightengine.com/) for AI detection API
- [Vercel](https://vercel.com/) for frontend hosting
- [Render](https://render.com/) for backend hosting