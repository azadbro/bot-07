// This is a setup script to be run once from your local machine with Node.js
// Make sure to install firebase-admin: npm install firebase-admin

const admin = require('firebase-admin');
const serviceAccount = require('../bot/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const tasks = [
  {
    title: 'Join our News Channel',
    type: 'join_channel',
    link: 'https://t.me/your_news_channel', // Replace with your channel link
    reward: 0.1,
    channelId: '@your_news_channel' // Replace with your channel username
  },
  {
    title: 'Check out our Partner Bot',
    type: 'open_bot',
    link: 'https://t.me/your_partner_bot', // Replace with your bot link
    reward: 0.08
  }
];

async function uploadTasks() {
  const tasksCollection = db.collection('tasks');
  console.log('Uploading tasks...');
  for (const task of tasks) {
    await tasksCollection.add(task);
    console.log(`  Added task: ${task.title}`);
  }
  console.log('Tasks uploaded successfully!');
}

uploadTasks().then(() => process.exit(0));
