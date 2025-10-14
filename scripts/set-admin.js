// This script assigns the 'admin' role to a user by creating a document in the 'roles_admin' collection.
// To run this script, you need to have Node.js and Firebase Admin SDK installed.
// 1. Make sure you are in your project directory in the terminal.
// 2. Run `npm install firebase-admin`.
// 3. Set up authentication by running `gcloud auth application-default login`.
// 4. Execute the script with the user's email: `node scripts/set-admin.js <user_email>`
//    Example: `node scripts/set-admin.js desbature@example.com`

const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK.
// It will automatically use the credentials from `gcloud auth application-default login`.
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.GCLOUD_PROJECT,
});

const db = admin.firestore();
const auth = admin.auth();

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Error: Please provide the user\'s email as an argument.');
  console.log('Usage: node scripts/set-admin.js <user_email>');
  process.exit(1);
}

async function setAdminRole(email) {
  try {
    // Get the user by email to find their UID
    const user = await auth.getUserByEmail(email);
    const { uid } = user;

    // Create a document in the roles_admin collection with the user's UID
    const adminRoleRef = db.collection('roles_admin').doc(uid);
    await adminRoleRef.set({ isAdmin: true });

    console.log(`Successfully granted admin role to user: ${email} (UID: ${uid})`);
    console.log('Please log out and log back into the application to see the changes.');
  } catch (error) {
    console.error(`Error setting admin role for ${email}:`, error.message);
    if (error.code === 'auth/user-not-found') {
      console.error('Please make sure the user has signed up in the application first.');
    }
  }
}

setAdminRole(userEmail);
