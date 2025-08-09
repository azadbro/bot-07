import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const tg = window.Telegram.WebApp;
    tg.ready();

    // --- Firebase Initialization ---
    const firebaseConfig = {
        apiKey: "AIzaSyBPE3oCwiUZiUggcID-Le-wy2EHGa-ZJDw",
        authDomain: "trx-earn-bott.firebaseapp.com",
        projectId: "trx-earn-bott",
        storageBucket: "trx-earn-bott.appspot.com",
        messagingSenderId: "682053542270",
        appId: "1:682053542270:web:780046a72f2142635d132f"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const userId = tg.initDataUnsafe?.user?.id.toString() || 'test_user_123'; // Fallback for testing
    let userData = {};

    // --- UI Element References ---
    const pages = document.querySelectorAll('.page');
    const navBtns = document.querySelectorAll('.nav-btn');
    const trxBalance = document.getElementById('trx-balance');
    const walletInput = document.getElementById('wallet-input');
    const setWalletBtn = document.getElementById('set-wallet-btn');
    const withdrawalAmountInput = document.getElementById('withdrawal-amount');
    const withdrawBtn = document.getElementById('withdraw-btn');
    const watchAdBtn = document.getElementById('watch-ad-btn');
    const adCooldownTimer = document.getElementById('ad-cooldown-timer');
    const referralLinkInput = document.getElementById('referral-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const verifiedReferrals = document.getElementById('verified-referrals');
    const taskList = document.getElementById('task-list');

    // --- Page Navigation ---
    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.dataset.page;
            showPage(pageId);
            navBtns.forEach(navBtn => navBtn.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // --- Core Functions ---
    async function initializeUser() {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                userData = userSnap.data();
            } else {
                userData = {
                    userId: userId,
                    balance: 0,
                    walletAddress: '',
                    adViews: 0,
                    tasksCompleted: [],
                    referrals: [],
                    referredBy: tg.initDataUnsafe?.start_param || null,
                    lastAdView: 0,
                    referralBonusPaid: false
                };
                await setDoc(userRef, userData);
            }
            if (!Array.isArray(userData.tasksCompleted)) userData.tasksCompleted = [];
            updateUI();
            loadTasks();
        } catch (error) {
            console.error("Error initializing user:", error);
            alert("Error: Could not load your data. Please try restarting the app.");
        }
    }

    function updateUI() {
        trxBalance.textContent = (userData.balance || 0).toFixed(5);
        walletInput.value = userData.walletAddress || '';
        referralLinkInput.value = `https://t.me/TrxEarnBot_bot?start=${userId}`;
        verifiedReferrals.textContent = (userData.referrals || []).length;
    }

    async function loadTasks() {
        try {
            const tasksCol = collection(db, 'tasks');
            const taskSnapshot = await getDocs(tasksCol);
            taskList.innerHTML = '';
            taskSnapshot.forEach(doc => {
                const task = doc.data();
                if (!userData.tasksCompleted.includes(doc.id)) {
                    const taskElement = document.createElement('div');
                    taskElement.className = 'task-card';
                    taskElement.innerHTML = `
                        <h3>${task.title}</h3>
                        <p>${task.description}</p>
                        <p>Reward: ${task.reward} TRX</p>
                        <button class="claim-task-btn" data-id="${doc.id}" data-reward="${task.reward}" data-link="${task.link}">Claim Reward</button>
                    `;
                    taskList.appendChild(taskElement);
                }
            });
        } catch (error) {
            console.error("Error loading tasks:", error);
        }
    }

    // --- Event Listeners ---
    setWalletBtn.addEventListener('click', async () => {
        const newAddress = walletInput.value.trim();
        if (!newAddress.startsWith('T') || newAddress.length !== 34) {
            alert('Invalid TRX wallet address.');
            return;
        }
        try {
            await updateDoc(doc(db, 'users', userId), { walletAddress: newAddress });
            userData.walletAddress = newAddress;
            updateUI();
            alert('Wallet address updated!');
        } catch (error) {
            console.error("Error setting wallet address:", error);
            alert('Error: Could not save wallet address.');
        }
    });

    withdrawBtn.addEventListener('click', async () => {
        const amount = parseFloat(withdrawalAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        if (amount < 3.5) {
            alert('Minimum withdrawal is 3.5 TRX.');
            return;
        }
        if (amount > userData.balance) {
            alert('Insufficient balance.');
            return;
        }
        if (!userData.walletAddress) {
            alert('Please set your wallet address first.');
            return;
        }
        try {
            const batch = writeBatch(db);
            const userRef = doc(db, 'users', userId);
            const withdrawalRef = doc(collection(db, 'withdrawals'));

            batch.set(withdrawalRef, {
                userId: userId,
                amount: amount,
                walletAddress: userData.walletAddress,
                status: 'pending',
                timestamp: serverTimestamp()
            });

            userData.balance -= amount;
            batch.update(userRef, { balance: userData.balance });

            await batch.commit();
            updateUI();
            withdrawalAmountInput.value = '';
            alert('Withdrawal request submitted!');
        } catch (error) {
            console.error("Error submitting withdrawal:", error);
            alert('Error: Could not submit withdrawal request.');
        }
    });

    watchAdBtn.addEventListener('click', () => {
        const now = Date.now();
        const cooldown = 15 * 1000;
        if (now - (userData.lastAdView || 0) < cooldown) {
            alert('Please wait for the cooldown to finish.');
            return;
        }

        if (typeof show_9682261 === 'function') {
            show_9682261().then(async () => {
                try {
                    const adReward = 0.005;
                    const batch = writeBatch(db);
                    const userRef = doc(db, 'users', userId);

                    userData.adViews = (userData.adViews || 0) + 1;
                    userData.lastAdView = now;
                    userData.balance = (userData.balance || 0) + adReward;

                    batch.update(userRef, {
                        balance: userData.balance,
                        adViews: userData.adViews,
                        lastAdView: userData.lastAdView
                    });

                    if (userData.adViews === 5 && userData.referredBy && !userData.referralBonusPaid) {
                        const referrerRef = doc(db, 'users', userData.referredBy);
                        const referrerSnap = await getDoc(referrerRef);
                        if (referrerSnap.exists()) {
                            const referralBonus = 0.05;
                            batch.update(referrerRef, { 
                                balance: (referrerSnap.data().balance || 0) + referralBonus,
                                referrals: [...(referrerSnap.data().referrals || []), userId]
                            });
                            batch.update(userRef, { referralBonusPaid: true });
                            userData.referralBonusPaid = true;
                        }
                    }

                    await batch.commit();
                    updateUI();
                    alert('You have been rewarded 0.005 TRX!');
                    startAdCooldown();
                } catch (error) {
                    console.error("Error processing ad reward:", error);
                    alert('Error: Could not process reward.');
                }
            });
        } else {
            alert('Ad SDK not available.');
        }
    });

    taskList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('claim-task-btn')) {
            const taskId = e.target.dataset.id;
            const reward = parseFloat(e.target.dataset.reward);
            const link = e.target.dataset.link;

            window.open(link, '_blank');

            try {
                userData.balance += reward;
                userData.tasksCompleted.push(taskId);

                await updateDoc(doc(db, 'users', userId), {
                    balance: userData.balance,
                    tasksCompleted: userData.tasksCompleted
                });

                updateUI();
                e.target.closest('.task-card').remove();
                alert(`Task complete! You earned ${reward} TRX.`);
            } catch (error) {
                console.error("Error claiming task:", error);
                alert('Error: Could not claim task reward.');
            }
        }
    });

    copyLinkBtn.addEventListener('click', () => {
        referralLinkInput.select();
        document.execCommand('copy');
        alert('Referral link copied!');
    });

    function startAdCooldown() {
        let timeLeft = 15;
        watchAdBtn.disabled = true;
        adCooldownTimer.style.display = 'inline';
        adCooldownTimer.textContent = `(${timeLeft}s)`;

        const interval = setInterval(() => {
            timeLeft--;
            adCooldownTimer.textContent = `(${timeLeft}s)`;
            if (timeLeft <= 0) {
                clearInterval(interval);
                adCooldownTimer.style.display = 'none';
                watchAdBtn.disabled = false;
            }
        }, 1000);
    }

    // --- Initial Load ---
    await initializeUser();
    showPage('wallet-section');
    navBtns[0].classList.add('active');
});
