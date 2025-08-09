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
        appId: "1:682053542270:web:780046a72f2142635d132f",
    };
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // --- Page Navigation ---
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-btn');
    
    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        navButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.page === pageId) button.classList.add('active');
        });
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => showPage(button.dataset.page));
    });

    // --- DOM Elements ---
    const trxBalance = document.getElementById('trx-balance');
    const walletInput = document.getElementById('wallet-input');
    const setWalletBtn = document.getElementById('set-wallet-btn');
    const withdrawBtn = document.getElementById('withdraw-btn');
    const watchAdBtn = document.getElementById('watch-ad-btn');
    const adCooldownTimer = document.getElementById('ad-cooldown-timer');
    const taskList = document.getElementById('task-list');
    const referralLinkInput = document.getElementById('referral-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const verifiedReferrals = document.getElementById('verified-referrals');
    const referralEarnings = document.getElementById('referral-earnings');

    // --- App State ---
    let currentUser = tg.initDataUnsafe?.user;
    let userData = {};

    if (!currentUser) {
        document.body.innerHTML = "<h1 style='text-align: center; margin-top: 50px;'>Please open this app through Telegram.</h1>";
        return;
    }
    const userId = currentUser.id.toString();

    // --- Core Functions ---
    async function initializeUser() {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            userData = userSnap.data();
        } else {
            const referredBy = tg.initDataUnsafe?.start_param || null;
            userData = {
                balance: 0,
                walletAddress: '',
                adViews: 0,
                tasksCompleted: [],
                referrals: [],
                referredBy: referredBy,
                lastAdView: 0,
                referralBonusPaid: false
            };
            await setDoc(userRef, userData);
        }
        updateUI();
        loadTasks();
    }

    function updateUI() {
        trxBalance.textContent = (userData.balance || 0).toFixed(5);
        walletInput.value = userData.walletAddress || '';
        referralLinkInput.value = `https://t.me/TrxEarnBot_bot?start=${userId}`;
        verifiedReferrals.textContent = (userData.referrals || []).length;
        // referralEarnings would need to be calculated and stored separately
    }

    async function loadTasks() {
        const tasksCol = collection(db, 'tasks');
        const taskSnapshot = await getDocs(tasksCol);
        taskList.innerHTML = '';
        taskSnapshot.forEach(doc => {
            const task = doc.data();
            if (!userData.tasksCompleted.includes(doc.id)) {
                const taskElement = document.createElement('div');
                taskElement.className = 'task-card';
                taskElement.innerHTML = `
                    <div>
                        <h2>${task.name}</h2>
                        <p>${task.description}</p>
                    </div>
                    <button class="claim-task-btn" data-task-id="${doc.id}" data-reward="${task.reward}" data-url="${task.url}">Claim ${task.reward} TRX</button>
                `;
                taskList.appendChild(taskElement);
            }
        });
    }

    // --- Event Listeners ---
    setWalletBtn.addEventListener('click', async () => {
        const newAddress = walletInput.value.trim();
        // Basic validation for a TRX address (starts with 'T', 34 chars)
        if (newAddress.startsWith('T') && newAddress.length === 34) {
            await updateDoc(doc(db, 'users', userId), { walletAddress: newAddress });
            userData.walletAddress = newAddress;
            updateUI(); // Refresh the UI to show the new address
            alert('Wallet address updated!');
        } else {
            alert('Invalid TRX wallet address. It must start with T and be 34 characters long.');
        }
    });

    withdrawBtn.addEventListener('click', async () => {
        const withdrawalAmountInput = document.getElementById('withdrawal-amount');
        const amount = parseFloat(withdrawalAmountInput.value);

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount to withdraw.');
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
        if (!userData.walletAddress) {
            alert('Please set your wallet address first.');
            return;
        }

        // All checks passed, proceed with withdrawal request
        await addDoc(collection(db, 'withdrawals'), {
            userId: userId,
            amount: amount,
            walletAddress: userData.walletAddress,
            status: 'pending',
            timestamp: serverTimestamp()
        });

        userData.balance -= amount;
        await updateDoc(doc(db, 'users', userId), { balance: userData.balance });
        
        updateUI();
        withdrawalAmountInput.value = ''; // Clear the input field
        alert('Withdrawal request submitted!');
    });

    watchAdBtn.addEventListener('click', () => {
        const now = Date.now();
        const cooldown = 15 * 1000;
        if (now - (userData.lastAdView || 0) < cooldown) {
            alert('Please wait for the cooldown.');
            return;
        }

        if (typeof show_9682261 === 'function') {
            show_9682261().then(async () => {
                const batch = writeBatch(db);
                const userRef = doc(db, 'users', userId);

                // 1. Reward user
                userData.balance += 0.005;
                userData.adViews += 1;
                userData.lastAdView = now;
                batch.update(userRef, {
                    balance: userData.balance,
                    adViews: userData.adViews,
                    lastAdView: userData.lastAdView
                });

                // 2. Check for referral verification
                if (userData.adViews === 5 && userData.referredBy && !userData.referralBonusPaid) {
                    const referrerRef = doc(db, 'users', userData.referredBy);
                    const referrerSnap = await getDoc(referrerRef);
                    if (referrerSnap.exists()) {
                        const referrerData = referrerSnap.data();
                        batch.update(referrerRef, { balance: (referrerData.balance || 0) + 0.05 });
                        batch.update(userRef, { referralBonusPaid: true });
                        userData.referralBonusPaid = true;
                    }
                }
                await batch.commit();
                updateUI();
                alert('You earned 0.005 TRX!');
                startAdCooldown();
            });
        } else {
             alert('Ad SDK not available.');
        }
    });

    taskList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('claim-task-btn')) {
            const button = e.target;
            const taskId = button.dataset.taskId;
            const reward = parseFloat(button.dataset.reward);
            const url = button.dataset.url;

            window.open(url, '_blank');
            
            // Note: No real way to verify task completion automatically.
            // We'll trust the user for now.
            userData.balance += reward;
            userData.tasksCompleted.push(taskId);
            await updateDoc(doc(db, 'users', userId), {
                balance: userData.balance,
                tasksCompleted: userData.tasksCompleted
            });
            updateUI();
            button.closest('.task-card').remove();
            alert(`Task complete! You earned ${reward} TRX.`);
        }
    });

    copyLinkBtn.addEventListener('click', () => {
        referralLinkInput.select();
        document.execCommand('copy');
        alert('Referral link copied!');
    });

    function startAdCooldown() {
        let cooldown = 15;
        watchAdBtn.disabled = true;
        adCooldownTimer.textContent = `Next ad in ${cooldown}s`;
        const interval = setInterval(() => {
            cooldown--;
            adCooldownTimer.textContent = `Next ad in ${cooldown}s`;
            if (cooldown <= 0) {
                clearInterval(interval);
                adCooldownTimer.textContent = '';
                watchAdBtn.disabled = false;
            }
        }, 1000);
    }

    // --- Initial Load ---
    await initializeUser();
    showPage('wallet-section');
});
