import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();

    const mainContent = document.getElementById('main-content');
    const navButtons = document.querySelectorAll('.nav-btn');

    // Firebase Initialization
    const firebaseConfig = {
        apiKey: "AIzaSyBPE3oCwiUZiUggcID-Le-wy2EHGa-ZJDw",
        authDomain: "trx-earn-bott.firebaseapp.com",
        projectId: "trx-earn-bott",
        storageBucket: "trx-earn-bott.appspot.com",
        messagingSenderId: "682053542270",
        appId: "1:682053542270:web:780046a72f2142635d132f",
        measurementId: "G-12MGRKXTPD"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const sections = {
        wallet: `
            <div id="wallet-section" class="section active">
                <h2>Wallet</h2>
                <p>Balance: <span id="trx-balance">0</span> TRX</p>
                <input type="text" id="wallet-address" placeholder="Your TRX Wallet Address">
                <button id="set-wallet-btn">Set Address</button>
                <hr>
                <input type="number" id="withdrawal-amount" placeholder="Amount to withdraw">
                <button id="withdraw-btn">Withdraw</button>
                <p>Minimum withdrawal: 3.5 TRX</p>
            </div>`,
        earn: `
            <div id="earn-section" class="section">
                <h2>Earn TRX</h2>
                <p>Watch an ad to earn 0.005 TRX.</p>
                <button id="watch-ad-btn">Watch Ad</button>
                <p id="cooldown-timer"></p>
            </div>`,
        tasks: `
            <div id="tasks-section" class="section">
                <h2>Tasks</h2>
                <div id="task-list"></div>
            </div>`,
        referral: `
            <div id="referral-section" class="section">
                <h2>Referral Program</h2>
                <p>Your referral link:</p>
                <input type="text" id="referral-link" readonly>
                <button id="copy-link-btn">Copy Link</button>
                <p>Refer a user and earn 0.05 TRX after they watch 5 ads. You'll also get 10% of their future withdrawals.</p>
            </div>`
    };

    function showSection(sectionName) {
        mainContent.innerHTML = sections[sectionName];
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionName);
        });
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            showSection(section);
        });
    });

    // Show wallet section by default
    showSection('wallet');

    let currentUser = tg.initDataUnsafe?.user;
    let userData = {};

    async function getUserData(uid) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return userSnap.data();
        } else {
            // Create a new user with default values
            const newUser = {
                balance: 0,
                walletAddress: '',
                adViews: 0,
                tasksCompleted: [],
                referrals: [],
                referredBy: tg.initDataUnsafe?.start_param?.split('_')[1] || null,
                lastAdView: 0,
                referralBonusPaid: false
            };
            await setDoc(userRef, newUser);
            return newUser;
        }
    }

    async function updateBalanceUI() {
        const balanceSpan = document.getElementById('trx-balance');
        if (balanceSpan) {
            balanceSpan.textContent = userData.balance.toFixed(5);
        }
    }

    function handleAdWatch() {
        const watchAdBtn = document.getElementById('watch-ad-btn');
        const cooldownTimer = document.getElementById('cooldown-timer');
        if (!watchAdBtn) return;

        watchAdBtn.addEventListener('click', async () => {
            const now = Date.now();
            const cooldown = 15 * 1000; // 15 seconds

            if (now - userData.lastAdView < cooldown) {
                alert('Please wait for the cooldown to finish.');
                return;
            }

            watchAdBtn.disabled = true;
            cooldownTimer.textContent = 'Showing ad...';

            show_9682261().then(async () => {
                // Reward the user
                userData.balance += 0.005;
                userData.adViews += 1;
                userData.lastAdView = Date.now();

                const userRef = doc(db, 'users', currentUser.uid);
                // Check for referral verification
                if (userData.adViews === 5 && userData.referredBy && !userData.referralBonusPaid) {
                    const referrerRef = doc(db, 'users', userData.referredBy);
                    const referrerSnap = await getDoc(referrerRef);
                    if (referrerSnap.exists()) {
                        const referrerData = referrerSnap.data();
                        const newBalance = (referrerData.balance || 0) + 0.05;
                        await updateDoc(referrerRef, { balance: newBalance });
                        
                        // Mark bonus as paid for the current user
                        userData.referralBonusPaid = true;
                        console.log(`Referrer ${userData.referredBy} was paid 0.05 TRX.`);
                    }
                }

                await setDoc(userRef, userData, { merge: true });

                await updateBalanceUI();
                alert('You earned 0.005 TRX!');

                // Start cooldown timer
                let timeLeft = 15;
                cooldownTimer.textContent = `Next ad in ${timeLeft}s`;
                const interval = setInterval(() => {
                    timeLeft--;
                    cooldownTimer.textContent = `Next ad in ${timeLeft}s`;
                    if (timeLeft <= 0) {
                        clearInterval(interval);
                        cooldownTimer.textContent = '';
                        watchAdBtn.disabled = false;
                    }
                }, 1000);
            }).catch(() => {
                // Ad failed to show
                cooldownTimer.textContent = 'Ad failed to load. Please try again.';
                watchAdBtn.disabled = false;
            });
        });
    }

    function handleWallet() {
        const setWalletBtn = document.getElementById('set-wallet-btn');
        const walletAddressInput = document.getElementById('wallet-address');
        const withdrawBtn = document.getElementById('withdraw-btn');
        const withdrawalAmountInput = document.getElementById('withdrawal-amount');

        if (userData.walletAddress) {
            walletAddressInput.value = userData.walletAddress;
        }

        setWalletBtn.addEventListener('click', async () => {
            const newAddress = walletAddressInput.value.trim();
            // Basic validation for a TRX address (starts with 'T', 34 chars)
            if (newAddress.startsWith('T') && newAddress.length === 34) {
                userData.walletAddress = newAddress;
                const userRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userRef, { walletAddress: newAddress });
                alert('Wallet address updated!');
            } else {
                alert('Invalid TRX wallet address.');
            }
        });

        withdrawBtn.addEventListener('click', async () => {
            const amount = parseFloat(withdrawalAmountInput.value);
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid amount.');
                return;
            }
            if (!userData.walletAddress) {
                alert('Please set your wallet address first.');
                return;
            }
            if (amount < 3.5) {
                alert('Minimum withdrawal amount is 3.5 TRX.');
                return;
            }
            if (amount > userData.balance) {
                alert('Insufficient balance.');
                return;
            }

            // Create a withdrawal request
            const withdrawalRequest = {
                userId: currentUser.uid,
                username: tg.initDataUnsafe?.user?.username || tg.initDataUnsafe?.user?.first_name,
                amount: amount,
                walletAddress: userData.walletAddress,
                status: 'pending',
                timestamp: new Date()
            };

            await addDoc(collection(db, 'withdrawals'), withdrawalRequest);
            
            // Deduct balance from user's account
            userData.balance -= amount;
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { balance: userData.balance });

            await updateBalanceUI();
            alert(`Withdrawal request for ${amount} TRX submitted! It will be processed after admin approval.`);
            withdrawalAmountInput.value = '';
        });
    }

    function handleReferral() {
        const referralLinkInput = document.getElementById('referral-link');
        const copyLinkBtn = document.getElementById('copy-link-btn');
        // Replace with your actual bot username
        const botUsername = 'TrxEarnBot_bot'; 
        const referralLink = `https://t.me/${botUsername}?start=${currentUser.uid}`;
        referralLinkInput.value = referralLink;

        copyLinkBtn.addEventListener('click', () => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(referralLink).then(() => {
                    alert('Referral link copied!');
                }).catch(err => {
                    alert('Failed to copy link.');
                });
            } else {
                // Fallback for older browsers
                referralLinkInput.select();
                document.execCommand('copy');
                alert('Referral link copied!');
            }
        });
    }

    async function handleTasks() {
        const taskListDiv = document.getElementById('task-list');
        if (!taskListDiv) return;
        taskListDiv.innerHTML = 'Loading tasks...';

        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (tasks.length === 0) {
            taskListDiv.innerHTML = '<p>No tasks available right now. Check back later!</p>';
            return;
        }

        taskListDiv.innerHTML = ''; // Clear loading message
        tasks.forEach(task => {
            const isCompleted = userData.tasksCompleted?.includes(task.id);
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            taskElement.innerHTML = `
                <h4>${task.title}</h4>
                <p>Reward: ${task.reward} TRX</p>
                <button class="task-action-btn" onclick="window.open('${task.link}', '_blank')" ${isCompleted ? 'disabled' : ''}>
                    ${isCompleted ? 'Completed' : 'Go to Task'}
                </button>
                <button class="task-verify-btn" data-task-id="${task.id}" data-reward="${task.reward}" ${isCompleted ? 'style="display:none;"' : ''}>
                    Verify
                </button>
            `;
            taskListDiv.appendChild(taskElement);
        });

        taskListDiv.querySelectorAll('.task-verify-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const button = e.currentTarget;
                const taskId = button.dataset.taskId;
                const reward = parseFloat(button.dataset.reward);

                // For now, verification is optimistic. A real implementation
                // would involve a backend check.
                userData.balance += reward;
                if (!userData.tasksCompleted) userData.tasksCompleted = [];
                userData.tasksCompleted.push(taskId);

                const userRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userRef, {
                    balance: userData.balance,
                    tasksCompleted: userData.tasksCompleted
                });

                alert(`Task complete! You earned ${reward} TRX.`);
                // Re-render tasks to show the completed state
                handleTasks(); 
                updateBalanceUI();
            });
        });
    }

    // Modify showSection to attach event listeners
    const originalShowSection = showSection;
    showSection = async (sectionName) => {
        originalShowSection(sectionName);
        // No need to re-fetch data here, it's already fresh from init
        // userData = await getUserData(currentUser.uid);
        await updateBalanceUI();

        if (sectionName === 'earn') {
            handleAdWatch();
        } else if (sectionName === 'wallet') {
            handleWallet();
        } else if (sectionName === 'referral') {
            handleReferral();
        } else if (sectionName === 'tasks') {
            handleTasks();
        }
    };

    // --- Main App Initialization ---
    async function initializeApp() {
        document.querySelector('.loading-container').style.display = 'flex';

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            document.body.innerHTML = '<div class="loading-container"><h1>Authentication error. Please launch the app from the Telegram bot.</h1></div>';
            console.error("Firebase auth token not found in URL.");
            return;
        }

        try {
            const auth = getAuth();
            const userCredential = await signInWithCustomToken(auth, token);
            currentUser = userCredential.user;
            console.log("Firebase sign-in successful, UID:", currentUser.uid);

            userData = await getUserData(currentUser.uid);
            if (!userData) {
                console.error("User data not found in Firestore for UID:", currentUser.uid);
                document.body.innerHTML = '<div class="loading-container"><h1>Error: Could not load user data.</h1></div>';
                return;
            }

            await updateBalanceUI();
            showSection('wallet'); // Show wallet by default

        } catch (error) {
            console.error("Firebase sign-in or data fetch error:", error);
            document.body.innerHTML = `<div class="loading-container"><h1>Login failed. Please restart the app from Telegram.</h1><p>${error.message}</p></div>`;
        } finally {
            document.querySelector('.loading-container').style.display = 'none';
            document.getElementById('app').style.display = 'block';
        }
    }

    initializeApp();
});
