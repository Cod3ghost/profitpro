'use server';

import { analyzeProfitTrends } from '@/ai/flows/profit-trend-analysis';
import type { Sale, SalesAgent } from '@/lib/types';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

// Helper function to initialize Firebase Admin SDK
function initializeAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }

  // Check if we have environment variables for service account
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    // Initialize with explicit credentials from environment variables
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      }),
    });
  }

  // Fallback: This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // for authentication, which is automatically set in the App Hosting environment.
  return initializeApp();
}


export async function getProfitTrendAnalysis(salesData: Sale[]): Promise<string> {
  if (!salesData || salesData.length === 0) {
    return 'No sales data available to analyze.';
  }

  try {
    // Calculate basic statistics
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.totalRevenue, 0);
    const totalProfit = salesData.reduce((sum, sale) => sum + sale.profit, 0);
    const totalCost = salesData.reduce((sum, sale) => sum + sale.totalCost, 0);
    const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(2);

    // Group by product
    const productSales = salesData.reduce((acc, sale) => {
      if (!acc[sale.productId]) {
        acc[sale.productId] = { count: 0, revenue: 0, profit: 0 };
      }
      acc[sale.productId].count += sale.quantity;
      acc[sale.productId].revenue += sale.totalRevenue;
      acc[sale.productId].profit += sale.profit;
      return acc;
    }, {} as Record<string, { count: number; revenue: number; profit: number }>);

    // Find best performing products
    const sortedProducts = Object.entries(productSales)
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 3);

    // Group by date for trend analysis
    const last30Days = salesData.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return saleDate >= thirtyDaysAgo;
    });

    const recentRevenue = last30Days.reduce((sum, sale) => sum + sale.totalRevenue, 0);
    const recentProfit = last30Days.reduce((sum, sale) => sum + sale.profit, 0);

    // Generate analysis report
    let analysis = `📊 PROFIT TREND ANALYSIS\n\n`;
    analysis += `🎯 OVERALL PERFORMANCE\n`;
    analysis += `• Total Sales: ${salesData.length} transactions\n`;
    analysis += `• Total Revenue: ₦${totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n`;
    analysis += `• Total Profit: ₦${totalProfit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n`;
    analysis += `• Profit Margin: ${profitMargin}%\n\n`;

    analysis += `📈 RECENT TRENDS (Last 30 Days)\n`;
    analysis += `• Transactions: ${last30Days.length}\n`;
    analysis += `• Revenue: ₦${recentRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n`;
    analysis += `• Profit: ₦${recentProfit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n\n`;

    analysis += `🏆 TOP PERFORMING PRODUCTS\n`;
    sortedProducts.forEach(([ productId, stats], index) => {
      analysis += `${index + 1}. Product ${productId.substring(0, 8)}...\n`;
      analysis += `   • Units Sold: ${stats.count}\n`;
      analysis += `   • Revenue: ₦${stats.revenue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n`;
      analysis += `   • Profit: ₦${stats.profit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n\n`;
    });

    analysis += `💡 KEY INSIGHTS\n`;
    if (profitMargin >= 40) {
      analysis += `• Excellent profit margin! Your business is highly profitable.\n`;
    } else if (profitMargin >= 25) {
      analysis += `• Good profit margin. Room for optimization.\n`;
    } else {
      analysis += `• Profit margin could be improved. Consider reviewing costs.\n`;
    }

    const avgTransactionValue = totalRevenue / salesData.length;
    analysis += `• Average Transaction Value: ₦${avgTransactionValue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n`;

    if (last30Days.length > salesData.length / 2) {
      analysis += `• 📈 Sales activity is increasing! Most sales are recent.\n`;
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing profit trends:', error);
    return 'An error occurred while analyzing profit trends. Please try again.';
  }
}

export async function createUser(
  user: Omit<SalesAgent, 'id'>,
  password: string,
  role: 'admin' | 'agent'
): Promise<{ success: boolean; message: string }> {
  try {
    const app = initializeAdminApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    // Validate password
    if (!password || password.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long.'
      };
    }

    // Create user in Firebase Authentication with provided password
    const userRecord = await auth.createUser({
      email: user.email,
      password: password,
      displayName: `${user.firstName} ${user.lastName}`,
    });

    // Create user profile in Firestore
    await firestore.collection('users').doc(userRecord.uid).set({
      ...user,
      role: role, // Store role in user profile
    });

    // If admin role, create admin role document
    if (role === 'admin') {
      await firestore.collection('roles_admin').doc(userRecord.uid).set({ isAdmin: true });
    }

    const roleLabel = role === 'admin' ? 'Admin' : 'Sales Agent';
    return {
      success: true,
      message: `${roleLabel} ${user.firstName} ${user.lastName} created successfully.\n\nLogin credentials:\nEmail: ${user.email}\nPassword: ${password}\n\nPlease share these credentials securely.`
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, message: error.message || 'Failed to create user.' };
  }
}

export async function updateUser(
  uid: string,
  updates: Partial<SalesAgent>,
  newRole?: 'admin' | 'agent'
): Promise<{ success: boolean; message: string }> {
  try {
    const app = initializeAdminApp();
    const firestore = getFirestore(app);

    // Update user profile in Firestore
    const updateData: any = { ...updates };
    if (newRole) {
      updateData.role = newRole;
    }

    await firestore.collection('users').doc(uid).update(updateData);

    // Handle role change
    if (newRole) {
      const adminRoleRef = firestore.collection('roles_admin').doc(uid);

      if (newRole === 'admin') {
        // Grant admin role
        await adminRoleRef.set({ isAdmin: true });
      } else {
        // Revoke admin role
        await adminRoleRef.delete();
      }
    }

    return {
      success: true,
      message: 'User updated successfully.'
    };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, message: error.message || 'Failed to update user.' };
  }
}

export async function deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
  try {
    const app = initializeAdminApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    // Delete from Firebase Authentication
    await auth.deleteUser(uid);

    // Delete user profile from Firestore
    await firestore.collection('users').doc(uid).delete();

    // Delete admin role if exists
    await firestore.collection('roles_admin').doc(uid).delete();

    return {
      success: true,
      message: 'User deleted successfully.'
    };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, message: error.message || 'Failed to delete user.' };
  }
}

export async function setAdminRole(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const app = initializeAdminApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    // Get the user by email to find their UID
    const user = await auth.getUserByEmail(email);
    const { uid } = user;

    // Create a document in the roles_admin collection with the user's UID
    await firestore.collection('roles_admin').doc(uid).set({ isAdmin: true });

    return {
      success: true,
      message: `Successfully granted admin role to user: ${email} (UID: ${uid}). Please log out and log back in to see the changes.`
    };
  } catch (error: any) {
    console.error('Error setting admin role:', error);
    if (error.code === 'auth/user-not-found') {
      return {
        success: false,
        message: 'User not found. Please make sure the user has signed up in the application first.'
      };
    }
    return { success: false, message: error.message || 'Failed to set admin role.' };
  }
}
