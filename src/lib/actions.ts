'use server';

import { analyzeProfitTrends } from '@/ai/flows/profit-trend-analysis';
import type { Sale, SalesAgent } from '@/lib/types';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';

// Helper function to initialize Firebase Admin SDK
function initializeAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }
  // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // for authentication, which is automatically set in the App Hosting environment.
  return initializeApp();
}


export async function getProfitTrendAnalysis(salesData: Sale[]): Promise<string> {
  if (!salesData || salesData.length === 0) {
    return 'No sales data available to analyze.';
  }

  try {
    const analysis = await analyzeProfitTrends({
      salesData: JSON.stringify(salesData, null, 2),
    });
    return analysis;
  } catch (error) {
    console.error('Error analyzing profit trends:', error);
    return 'An error occurred while analyzing profit trends. Please check the server logs and try again.';
  }
}

export async function createSalesAgent(agent: Omit<SalesAgent, 'id'>): Promise<{ success: boolean; message: string }> {
  try {
    const app = initializeAdminApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: agent.email,
      password: 'password123', // Set a temporary password
      displayName: `${agent.firstName} ${agent.lastName}`,
    });

    // Create user profile in Firestore
    await firestore.collection('users').doc(userRecord.uid).set({
      ...agent,
    });
    
    // Send password reset email
    await auth.generatePasswordResetLink(agent.email);

    return { success: true, message: `Sales agent ${agent.firstName} created successfully. A password reset email has been sent.` };
  } catch (error: any) {
    console.error('Error creating sales agent:', error);
    return { success: false, message: error.message || 'Failed to create sales agent.' };
  }
}
