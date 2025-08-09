// This file should not contain any Firebase Admin credentials.
// The admin panel frontend should make API calls to your secure backend (bot/main.py)
// to perform administrative tasks.

console.log("Admin panel script loaded. Remember to implement API calls to your backend.");

// Example of how you might fetch data from your backend:
/*
async function getUsers() {
  try {
    const response = await fetch('YOUR_BACKEND_API_ENDPOINT/users');
    const users = await response.json();
    console.log(users);
    // Code to display users in the admin panel
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}
*/

import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, deleteDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Use the same Firebase config as the main app
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

// --- Withdrawals ---
async function loadWithdrawals() {
    const withdrawalList = document.getElementById('withdrawal-list');
    withdrawalList.innerHTML = 'Loading...';
    const querySnapshot = await getDocs(collection(db, 'withdrawals'));
    withdrawalList.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const req = doc.data();
        if (req.status !== 'pending') return;
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <span>
                <strong>${req.username}</strong> (${req.amount} TRX) -> ${req.walletAddress}
            </span>
            <span class="actions">
                <button class="approve-btn" data-id="${doc.id}">Approve</button>
                <button class="reject-btn" data-id="${doc.id}" data-user-id="${req.userId}" data-amount="${req.amount}">Reject</button>
            </span>
        `;
        withdrawalList.appendChild(item);
    });

    // Add event listeners
    withdrawalList.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const withdrawalId = e.target.dataset.id;
            const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
            const withdrawalSnap = await getDoc(withdrawalRef);

            if (!withdrawalSnap.exists()) return;

            const withdrawalData = withdrawalSnap.data();
            const userId = withdrawalData.userId;
            const amount = withdrawalData.amount;

            const userRef = doc(db, 'users', userId.toString());
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().referredBy) {
                const referrerId = userSnap.data().referredBy;
                const commission = amount * 0.10;

                const referrerRef = doc(db, 'users', referrerId);
                const referrerSnap = await getDoc(referrerRef);
                if (referrerSnap.exists()) {
                    const newBalance = referrerSnap.data().balance + commission;
                    await updateDoc(referrerRef, { balance: newBalance });
                    console.log(`Paid ${commission} TRX commission to referrer ${referrerId}`);
                }
            }

            // Approve the withdrawal
            await updateDoc(withdrawalRef, { status: 'approved' });
            console.log(`Approved withdrawal ${withdrawalId}`);
            loadWithdrawals(); // Refresh the list
        });
    });

    withdrawalList.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const { id, userId, amount } = e.target.dataset;
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const newBalance = userSnap.data().balance + parseFloat(amount);
                const batch = writeBatch(db);
                batch.update(userRef, { balance: newBalance });
                batch.update(doc(db, 'withdrawals', id), { status: 'rejected' });
                await batch.commit();
                loadWithdrawals(); // Refresh list
            }
        });
    });
}

// --- User Management ---
async function loadUsers() {
    const userList = document.getElementById('user-list');
    userList.innerHTML = 'Loading...';
    const querySnapshot = await getDocs(collection(db, 'users'));
    userList.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const user = doc.data();
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <span>
                <strong>${doc.id}</strong> - Balance: ${user.balance.toFixed(5)} TRX
                ${user.isBlocked ? ' (BLOCKED)' : ''}
            </span>
            <span class="actions">
                <button class="block-btn" data-id="${doc.id}" data-blocked="${user.isBlocked || false}">
                    ${user.isBlocked ? 'Unblock' : 'Block'}
                </button>
            </span>
        `;
        userList.appendChild(item);
    });

    userList.querySelectorAll('.block-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const docId = e.target.dataset.id;
            const isBlocked = e.target.dataset.blocked === 'true';
            await updateDoc(doc(db, 'users', docId), { isBlocked: !isBlocked });
            loadUsers(); // Refresh list
        });
    });
}

// --- Task Management ---
async function loadTasks() {
    const taskList = document.getElementById('task-list-admin');
    taskList.innerHTML = 'Loading...';
    const querySnapshot = await getDocs(collection(db, 'tasks'));
    taskList.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const task = doc.data();
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <span><strong>${task.title}</strong> (${task.reward} TRX)</span>
            <span class="actions">
                <button class="delete-btn" data-id="${doc.id}">Delete</button>
            </span>
        `;
        taskList.appendChild(item);
    });

    taskList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const docId = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this task?')) {
                await deleteDoc(doc(db, 'tasks', docId));
                loadTasks(); // Refresh list
            }
        });
    });
}

document.getElementById('add-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const newTask = {
        title: form['task-title'].value,
        type: form['task-type'].value,
        link: form['task-link'].value,
        reward: parseFloat(form['task-reward'].value)
    };
    await addDoc(collection(db, 'tasks'), newTask);
    form.reset();
    loadTasks(); // Refresh list
});

// --- Initial Load ---
function init() {
    loadWithdrawals();
    loadUsers();
    loadTasks();
}

init();
