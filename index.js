const fs = require('fs');
const express = require('express');
const wiegine = require('fca-mafiya');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration and session storage
const sessions = new Map();
let wss;

// HTML Control Panel with NEON THEME and session management
const htmlControlPanel = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ NEON PERSISTENT MESSAGE SENDER ⚡</title>
    <style>
        :root {
            --neon-pink: #ff00ff;
            --neon-cyan: #00ffff;
            --neon-purple: #bf00ff;
            --neon-green: #00ff00;
            --dark-bg: #0a0a0a;
            --darker-bg: #050505;
            --glass-bg: rgba(10, 10, 10, 0.8);
            --glow: 0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3), 0 0 30px rgba(0, 255, 255, 0.1);
            --glow-pink: 0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', 'Segoe UI', monospace;
            background: linear-gradient(135deg, var(--dark-bg) 0%, var(--darker-bg) 100%);
            color: var(--neon-cyan);
            min-height: 100vh;
            padding: 20px;
            position: relative;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                repeating-linear-gradient(0deg, 
                    rgba(0, 255, 255, 0.03) 0px, 
                    rgba(0, 255, 255, 0.03) 2px,
                    transparent 2px,
                    transparent 4px);
            pointer-events: none;
            z-index: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 30px;
            background: var(--glass-bg);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 2px solid var(--neon-cyan);
            box-shadow: var(--glow);
            animation: borderPulse 2s infinite;
            position: relative;
            z-index: 1;
        }
        
        @keyframes borderPulse {
            0%, 100% { border-color: var(--neon-cyan); box-shadow: 0 0 10px rgba(0, 255, 255, 0.5); }
            50% { border-color: var(--neon-pink); box-shadow: 0 0 30px rgba(255, 0, 255, 0.5); }
        }
        
        h1 {
            font-size: 2.5rem;
            text-shadow: 0 0 10px var(--neon-cyan), 0 0 20px var(--neon-cyan), 0 0 30px var(--neon-pink);
            animation: textGlow 3s infinite;
            letter-spacing: 3px;
        }
        
        @keyframes textGlow {
            0%, 100% { text-shadow: 0 0 10px var(--neon-cyan), 0 0 20px var(--neon-cyan); }
            50% { text-shadow: 0 0 20px var(--neon-pink), 0 0 40px var(--neon-pink); }
        }
        
        .status {
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 10px;
            font-weight: bold;
            text-align: center;
            background: var(--glass-bg);
            backdrop-filter: blur(10px);
            border: 1px solid;
            transition: all 0.3s;
            position: relative;
            z-index: 1;
        }
        
        .online { 
            background: rgba(0, 255, 0, 0.2);
            border-color: var(--neon-green);
            color: var(--neon-green);
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
        }
        .offline { 
            background: rgba(255, 0, 0, 0.2);
            border-color: #ff0000;
            color: #ff0000;
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
        }
        .connecting { 
            background: rgba(255, 255, 0, 0.2);
            border-color: #ffff00;
            color: #ffff00;
            box-shadow: 0 0 15px rgba(255, 255, 0, 0.3);
        }
        .server-connected { 
            background: rgba(0, 255, 255, 0.2);
            border-color: var(--neon-cyan);
            color: var(--neon-cyan);
            box-shadow: var(--glow);
        }
        
        .panel {
            background: var(--glass-bg);
            padding: 25px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            margin-bottom: 25px;
            border: 1px solid var(--neon-cyan);
            transition: all 0.3s;
            position: relative;
            z-index: 1;
        }
        
        .panel:hover {
            box-shadow: var(--glow);
            transform: translateY(-2px);
        }
        
        button {
            padding: 12px 25px;
            margin: 8px;
            cursor: pointer;
            background: transparent;
            color: var(--neon-cyan);
            border: 2px solid var(--neon-cyan);
            border-radius: 8px;
            transition: all 0.3s;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
            overflow: hidden;
        }
        
        button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
            transition: left 0.5s;
        }
        
        button:hover::before {
            left: 100%;
        }
        
        button:hover {
            background: var(--neon-cyan);
            color: var(--dark-bg);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            transform: translateY(-2px);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        input, select, textarea {
            padding: 12px 15px;
            margin: 8px 0;
            width: 100%;
            border: 2px solid var(--neon-cyan);
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.8);
            color: var(--neon-cyan);
            font-size: 14px;
            transition: all 0.3s;
            box-sizing: border-box;
            font-family: 'Courier New', monospace;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: var(--neon-pink);
            box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
        }
        
        .log {
            height: 300px;
            overflow-y: auto;
            border: 2px solid var(--neon-cyan);
            padding: 15px;
            margin-top: 20px;
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.9);
            color: var(--neon-green);
            border-radius: 10px;
            font-size: 12px;
        }
        
        .log::-webkit-scrollbar {
            width: 8px;
        }
        
        .log::-webkit-scrollbar-track {
            background: rgba(0, 255, 255, 0.1);
            border-radius: 10px;
        }
        
        .log::-webkit-scrollbar-thumb {
            background: var(--neon-cyan);
            border-radius: 10px;
        }
        
        small {
            color: #888;
            font-size: 11px;
        }
        
        .session-info {
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
            border: 1px solid var(--neon-cyan);
        }
        
        .tab {
            overflow: hidden;
            border: 2px solid var(--neon-cyan);
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            margin-bottom: 20px;
            display: flex;
        }
        
        .tab button {
            background: transparent;
            flex: 1;
            border: none;
            outline: none;
            cursor: pointer;
            padding: 14px 20px;
            transition: 0.3s;
            margin: 0;
            border-radius: 0;
            position: relative;
        }
        
        .tab button:first-child {
            border-right: 1px solid var(--neon-cyan);
        }
        
        .tab button:hover {
            background: rgba(0, 255, 255, 0.1);
        }
        
        .tab button.active {
            background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
            color: var(--dark-bg);
            box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
        }
        
        .tabcontent {
            display: none;
            padding: 20px;
            border: 2px solid var(--neon-cyan);
            border-top: none;
            border-radius: 0 0 10px 10px;
            background: rgba(0, 0, 0, 0.5);
        }
        
        .active-tab {
            display: block;
            animation: fadeIn 0.5s;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-box {
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            backdrop-filter: blur(5px);
            border: 1px solid var(--neon-cyan);
            transition: all 0.3s;
        }
        
        .stat-box:hover {
            transform: translateY(-5px);
            box-shadow: var(--glow);
        }
        
        .stat-box div:first-child {
            font-size: 12px;
            opacity: 0.7;
            margin-bottom: 5px;
        }
        
        .stat-box div:last-child {
            font-size: 20px;
            font-weight: bold;
            text-shadow: 0 0 5px var(--neon-cyan);
        }
        
        .cookie-status {
            margin-top: 15px;
            padding: 12px;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.5);
            border-left: 5px solid;
            transition: all 0.3s;
        }
        
        .cookie-active {
            border-left-color: var(--neon-green);
            color: var(--neon-green);
        }
        
        .cookie-inactive {
            border-left-color: #ff0000;
            color: #ff0000;
        }
        
        .heart {
            display: inline-block;
            animation: heartBeat 1s infinite;
        }
        
        @keyframes heartBeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #888;
            font-size: 12px;
            position: relative;
            z-index: 1;
        }
        
        .session-manager {
            margin-top: 20px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            border: 1px solid var(--neon-purple);
        }
        
        /* Glowing text effect */
        .glow-text {
            animation: textPulse 2s infinite;
        }
        
        @keyframes textPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .stats {
                grid-template-columns: 1fr;
            }
            
            .tab {
                flex-direction: column;
            }
            
            .tab button:first-child {
                border-right: none;
                border-bottom: 1px solid var(--neon-cyan);
            }
            
            h1 {
                font-size: 1.5rem;
            }
        }
        
        /* Loading animation */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid var(--neon-cyan);
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚡ NEON PERSISTENT MESSAGE SENDER ⚡</h1>
        <p style="color: var(--neon-purple); margin-top: 10px;">Sessions continue even if you close this page!</p>
    </div>
    
    <div class="status server-connected" id="status">
        Status: Connecting to server...
    </div>
    
    <div class="panel">
        <div class="tab">
            <button class="tablinks active" onclick="openTab(event, 'cookie-file-tab')">📁 Cookie File</button>
            <button class="tablinks" onclick="openTab(event, 'cookie-text-tab')">📝 Paste Cookies</button>
        </div>
        
        <div id="cookie-file-tab" class="tabcontent active-tab">
            <input type="file" id="cookie-file" accept=".txt">
            <small>Select your cookies file (each line should contain one cookie)</small>
        </div>
        
        <div id="cookie-text-tab" class="tabcontent">
            <textarea id="cookie-text" placeholder="Paste your cookies here (one cookie per line)" rows="5"></textarea>
            <small>Paste your cookies directly (one cookie per line)</small>
        </div>
        
        <div>
            <input type="text" id="thread-id" placeholder="💬 Thread/Group ID">
            <small>Enter the Facebook Group/Thread ID where messages will be sent</small>
        </div>
        
        <div>
            <input type="number" id="delay" value="5" min="1" placeholder="⏱️ Delay in seconds">
            <small>Delay between messages (in seconds)</small>
        </div>
        
        <div>
            <input type="text" id="prefix" placeholder="🏷️ Message Prefix (Optional)">
            <small>Optional prefix to add before each message</small>
        </div>
        
        <div>
            <label for="message-file">📄 Messages File</label>
            <input type="file" id="message-file" accept=".txt">
            <small>Upload messages.txt file with messages (one per line)</small>
        </div>
        
        <div style="text-align: center;">
            <button id="start-btn">🚀 START SENDING</button>
            <button id="stop-btn" disabled>⏹️ STOP SENDING</button>
        </div>
        
        <div id="session-info" style="display: none;" class="session-info">
            <h3>🔑 Your Session ID: <span id="session-id-display" style="color: var(--neon-pink);"></span></h3>
            <p>Save this ID to stop your session later or view its details</p>
        </div>
    </div>
    
    <div class="panel session-manager">
        <h3>🔍 SESSION MANAGER</h3>
        <p>Enter your Session ID to manage your running session</p>
        
        <input type="text" id="manage-session-id" placeholder="Enter your Session ID">
        
        <div style="text-align: center; margin-top: 15px;">
            <button id="view-session-btn">👁️ View Session Details</button>
            <button id="stop-session-btn">⏹️ Stop Session</button>
        </div>
        
        <div id="session-details" style="display: none; margin-top: 20px;">
            <h4>📊 Session Details</h4>
            <div class="stats">
                <div class="stat-box">
                    <div>Status</div>
                    <div id="detail-status">-</div>
                </div>
                <div class="stat-box">
                    <div>Total Messages Sent</div>
                    <div id="detail-total-sent">-</div>
                </div>
                <div class="stat-box">
                    <div>Current Loop Count</div>
                    <div id="detail-loop-count">-</div>
                </div>
                <div class="stat-box">
                    <div>Started At</div>
                    <div id="detail-started">-</div>
                </div>
            </div>
            
            <h4>🍪 Cookies Status</h4>
            <div id="detail-cookies-status"></div>
            
            <h4>📝 Session Logs</h4>
            <div class="log" id="detail-log-container"></div>
        </div>
    </div>
    
    <div class="panel">
        <h3>📊 ACTIVE SESSION STATISTICS</h3>
        <div class="stats" id="stats-container">
            <div class="stat-box">
                <div>Status</div>
                <div id="stat-status">Not Started</div>
            </div>
            <div class="stat-box">
                <div>Total Messages Sent</div>
                <div id="stat-total-sent">0</div>
            </div>
            <div class="stat-box">
                <div>Current Loop Count</div>
                <div id="stat-loop-count">0</div>
            </div>
            <div class="stat-box">
                <div>Current Message</div>
                <div id="stat-current">-</div>
            </div>
            <div class="stat-box">
                <div>Current Cookie</div>
                <div id="stat-cookie">-</div>
            </div>
            <div class="stat-box">
                <div>Started At</div>
                <div id="stat-started">-</div>
            </div>
        </div>
        
        <h3>🍪 COOKIES STATUS</h3>
        <div id="cookies-status-container"></div>
        
        <h3>📝 LIVE LOGS</h3>
        <div class="log" id="log-container"></div>
    </div>

    <div class="footer">
        <p>Made with <span class="heart">⚡</span> by NEON BOT | Sessions continue running even if you close this page!</p>
    </div>

    <script>
        const logContainer = document.getElementById('log-container');
        const statusDiv = document.getElementById('status');
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const cookieFileInput = document.getElementById('cookie-file');
        const cookieTextInput = document.getElementById('cookie-text');
        const threadIdInput = document.getElementById('thread-id');
        const delayInput = document.getElementById('delay');
        const prefixInput = document.getElementById('prefix');
        const messageFileInput = document.getElementById('message-file');
        const sessionInfoDiv = document.getElementById('session-info');
        const sessionIdDisplay = document.getElementById('session-id-display');
        const cookiesStatusContainer = document.getElementById('cookies-status-container');
        
        // Session manager elements
        const manageSessionIdInput = document.getElementById('manage-session-id');
        const viewSessionBtn = document.getElementById('view-session-btn');
        const stopSessionBtn = document.getElementById('stop-session-btn');
        const sessionDetailsDiv = document.getElementById('session-details');
        const detailStatus = document.getElementById('detail-status');
        const detailTotalSent = document.getElementById('detail-total-sent');
        const detailLoopCount = document.getElementById('detail-loop-count');
        const detailStarted = document.getElementById('detail-started');
        const detailCookiesStatus = document.getElementById('detail-cookies-status');
        const detailLogContainer = document.getElementById('detail-log-container');
        
        // Stats elements
        const statStatus = document.getElementById('stat-status');
        const statTotalSent = document.getElementById('stat-total-sent');
        const statLoopCount = document.getElementById('stat-loop-count');
        const statCurrent = document.getElementById('stat-current');
        const statCookie = document.getElementById('stat-cookie');
        const statStarted = document.getElementById('stat-started');
        
        let currentSessionId = null;
        let reconnectAttempts = 0;
        let maxReconnectAttempts = 10;
        let socket = null;
        let sessionLogs = new Map();

        function openTab(evt, tabName) {
            const tabcontent = document.getElementsByClassName("tabcontent");
            for (let i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            
            const tablinks = document.getElementsByClassName("tablinks");
            for (let i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            
            document.getElementById(tabName).style.display = "block";
            evt.currentTarget.className += " active";
        }

        function addLog(message, type = 'info', sessionId = null) {
            const logEntry = document.createElement('div');
            const timestamp = new Date().toLocaleTimeString();
            let prefix = '';
            
            switch(type) {
                case 'success':
                    prefix = '✅';
                    break;
                case 'error':
                    prefix = '❌';
                    break;
                case 'warning':
                    prefix = '⚠️';
                    break;
                default:
                    prefix = '📝';
            }
            
            logEntry.innerHTML = \`<span style="color: #00ffff">[\${timestamp}]</span> \${prefix} \${message}\`;
            
            if (sessionId) {
                if (!sessionLogs.has(sessionId)) {
                    sessionLogs.set(sessionId, []);
                }
                sessionLogs.get(sessionId).push(logEntry.innerHTML);
                
                if (manageSessionIdInput.value === sessionId) {
                    detailLogContainer.appendChild(logEntry.cloneNode(true));
                    detailLogContainer.scrollTop = detailLogContainer.scrollHeight;
                }
            } else {
                logContainer.appendChild(logEntry);
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        }
        
        function updateStats(data, sessionId = null) {
            if (sessionId && manageSessionIdInput.value === sessionId) {
                if (data.status) detailStatus.textContent = data.status;
                if (data.totalSent !== undefined) detailTotalSent.textContent = data.totalSent;
                if (data.loopCount !== undefined) detailLoopCount.textContent = data.loopCount;
                if (data.started) detailStarted.textContent = data.started;
            }
            
            if (!sessionId || sessionId === currentSessionId) {
                if (data.status) statStatus.textContent = data.status;
                if (data.totalSent !== undefined) statTotalSent.textContent = data.totalSent;
                if (data.loopCount !== undefined) statLoopCount.textContent = data.loopCount;
                if (data.current) statCurrent.textContent = data.current;
                if (data.cookie) statCookie.textContent = \`Cookie \${data.cookie}\`;
                if (data.started) statStarted.textContent = data.started;
            }
        }
        
        function updateCookiesStatus(cookies, sessionId = null) {
            if (sessionId && manageSessionIdInput.value === sessionId) {
                detailCookiesStatus.innerHTML = '';
                cookies.forEach((cookie, index) => {
                    const cookieStatus = document.createElement('div');
                    cookieStatus.className = \`cookie-status \${cookie.active ? 'cookie-active' : 'cookie-inactive'}\`;
                    cookieStatus.innerHTML = \`
                        <strong>Cookie \${index + 1}:</strong> 
                        <span>\${cookie.active ? '✅ ACTIVE' : '❌ INACTIVE'}</span>
                        <span style="float: right;">Messages Sent: \${cookie.sentCount || 0}</span>
                    \`;
                    detailCookiesStatus.appendChild(cookieStatus);
                });
            }
            
            if (!sessionId || sessionId === currentSessionId) {
                cookiesStatusContainer.innerHTML = '';
                cookies.forEach((cookie, index) => {
                    const cookieStatus = document.createElement('div');
                    cookieStatus.className = \`cookie-status \${cookie.active ? 'cookie-active' : 'cookie-inactive'}\`;
                    cookieStatus.innerHTML = \`
                        <strong>Cookie \${index + 1}:</strong> 
                        <span>\${cookie.active ? '✅ ACTIVE' : '❌ INACTIVE'}</span>
                        <span style="float: right;">Messages Sent: \${cookie.sentCount || 0}</span>
                    \`;
                    cookiesStatusContainer.appendChild(cookieStatus);
                });
            }
        }

        function connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            socket = new WebSocket(protocol + '//' + window.location.host);

            socket.onopen = () => {
                addLog('Connected to server successfully', 'success');
                statusDiv.className = 'status server-connected';
                statusDiv.textContent = 'Status: Connected to Server';
                reconnectAttempts = 0;
                socket.send(JSON.stringify({ type: 'list_sessions' }));
            };
            
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'log') {
                        addLog(data.message, data.level || 'info', data.sessionId);
                    } 
                    else if (data.type === 'status') {
                        statusDiv.className = data.running ? 'status online' : 'status server-connected';
                        statusDiv.textContent = \`Status: \${data.running ? '🚀 Sending Messages' : '✅ Connected to Server'}\`;
                        startBtn.disabled = data.running;
                        stopBtn.disabled = !data.running;
                        statStatus.textContent = data.running ? 'Running' : 'Stopped';
                    }
                    else if (data.type === 'session') {
                        currentSessionId = data.sessionId;
                        sessionIdDisplay.textContent = data.sessionId;
                        sessionInfoDiv.style.display = 'block';
                        addLog(\`🔑 Your session ID: \${data.sessionId}\`, 'success');
                        localStorage.setItem('lastSessionId', data.sessionId);
                    }
                    else if (data.type === 'stats') {
                        updateStats(data, data.sessionId);
                    }
                    else if (data.type === 'cookies_status') {
                        updateCookiesStatus(data.cookies, data.sessionId);
                    }
                    else if (data.type === 'session_details') {
                        detailStatus.textContent = data.status;
                        detailTotalSent.textContent = data.totalSent;
                        detailLoopCount.textContent = data.loopCount;
                        detailStarted.textContent = data.started;
                        sessionDetailsDiv.style.display = 'block';
                        
                        if (sessionLogs.has(data.sessionId)) {
                            detailLogContainer.innerHTML = sessionLogs.get(data.sessionId).join('');
                            detailLogContainer.scrollTop = detailLogContainer.scrollHeight;
                        }
                    }
                    else if (data.type === 'session_list') {
                        addLog(\`📊 Found \${data.count} active sessions\`, 'info');
                    }
                    else if (data.type === 'pong') {
                        // Keep connection alive
                    }
                } catch (e) {
                    console.error('Error processing message:', e);
                }
            };
            
            socket.onclose = (event) => {
                if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
                    addLog(\`Connection lost. Reconnecting... (\${reconnectAttempts + 1}/\${maxReconnectAttempts})\`, 'warning');
                    statusDiv.className = 'status connecting';
                    statusDiv.textContent = 'Status: Reconnecting...';
                    
                    setTimeout(() => {
                        reconnectAttempts++;
                        connectWebSocket();
                    }, 3000);
                } else {
                    addLog('Disconnected from server', 'error');
                    statusDiv.className = 'status offline';
                    statusDiv.textContent = 'Status: Disconnected';
                }
            };
            
            socket.onerror = (error) => {
                addLog(\`WebSocket error: \${error.message || 'Unknown error'}\`, 'error');
                statusDiv.className = 'status offline';
                statusDiv.textContent = 'Status: Connection Error';
            };
        }

        connectWebSocket();

        startBtn.addEventListener('click', () => {
            let cookiesContent = '';
            
            const cookieFileTab = document.getElementById('cookie-file-tab');
            if (cookieFileTab.style.display !== 'none' && cookieFileInput.files.length > 0) {
                const cookieFile = cookieFileInput.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    cookiesContent = event.target.result;
                    processStart(cookiesContent);
                };
                
                reader.readAsText(cookieFile);
            } 
            else if (cookieTextInput.value.trim()) {
                cookiesContent = cookieTextInput.value.trim();
                processStart(cookiesContent);
            }
            else {
                addLog('Please provide cookie content', 'error');
                return;
            }
        });
        
        function processStart(cookiesContent) {
            if (!threadIdInput.value.trim()) {
                addLog('Please enter a Thread/Group ID', 'error');
                return;
            }
            
            if (messageFileInput.files.length === 0) {
                addLog('Please select a messages file', 'error');
                return;
            }
            
            const messageFile = messageFileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const messageContent = event.target.result;
                const threadID = threadIdInput.value.trim();
                const delay = parseInt(delayInput.value) || 5;
                const prefix = prefixInput.value.trim();
                
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'start',
                        cookiesContent,
                        messageContent,
                        threadID,
                        delay,
                        prefix
                    }));
                } else {
                    addLog('Connection not ready. Please try again.', 'error');
                    connectWebSocket();
                }
            };
            
            reader.readAsText(messageFile);
        }
        
        stopBtn.addEventListener('click', () => {
            if (currentSessionId) {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ 
                        type: 'stop', 
                        sessionId: currentSessionId 
                    }));
                } else {
                    addLog('Connection not ready. Please try again.', 'error');
                }
            } else {
                addLog('No active session to stop', 'error');
            }
        });
        
        viewSessionBtn.addEventListener('click', () => {
            const sessionId = manageSessionIdInput.value.trim();
            if (sessionId) {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ 
                        type: 'view_session', 
                        sessionId: sessionId 
                    }));
                    addLog(\`Requesting details for session: \${sessionId}\`, 'success');
                } else {
                    addLog('Connection not ready. Please try again.', 'error');
                }
            } else {
                addLog('Please enter a session ID', 'error');
            }
        });
        
        stopSessionBtn.addEventListener('click', () => {
            const sessionId = manageSessionIdInput.value.trim();
            if (sessionId) {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ 
                        type: 'stop', 
                        sessionId: sessionId 
                    }));
                    addLog(\`Stop command sent for session: \${sessionId}\`, 'success');
                } else {
                    addLog('Connection not ready. Please try again.', 'error');
                }
            } else {
                addLog('Please enter a session ID', 'error');
            }
        });
        
        window.addEventListener('load', () => {
            const lastSessionId = localStorage.getItem('lastSessionId');
            if (lastSessionId) {
                manageSessionIdInput.value = lastSessionId;
                addLog(\`Found your previous session ID: \${lastSessionId}\`, 'info');
            }
        });
        
        setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
        
        addLog('⚡ NEON CONTROL PANEL READY ⚡', 'success');
    </script>
</body>
</html>
`;

// Start message sending function with multiple cookies support
function startSending(ws, cookiesContent, messageContent, threadID, delay, prefix) {
  const sessionId = uuidv4();
  
  // Parse cookies (one per line)
  const cookies = cookiesContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((cookie, index) => ({
      id: index + 
