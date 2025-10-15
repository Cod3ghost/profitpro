'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { SalesAgent } from '@/lib/types';

export async function createUser(
  user: Omit<SalesAgent, 'id'>,
  password: string,
  role: 'admin' | 'agent'
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createAdminClient();

    // Validate password
    if (!password || password.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long.'
      };
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      return { success: false, message: authError.message };
    }

    // Create user profile in database
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: role,
      });

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, message: profileError.message };
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
    const supabase = createAdminClient();

    // Update user profile in database
    const updateData: any = {};
    if (updates.firstName) updateData.first_name = updates.firstName;
    if (updates.lastName) updateData.last_name = updates.lastName;
    if (updates.email) updateData.email = updates.email;
    if (newRole) updateData.role = newRole;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', uid);

    if (error) {
      return { success: false, message: error.message };
    }

    // Update email in auth if changed
    if (updates.email) {
      await supabase.auth.admin.updateUserById(uid, {
        email: updates.email,
      });
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
    const supabase = createAdminClient();

    // Delete from Supabase Auth (this will cascade delete from users table due to FK)
    const { error } = await supabase.auth.admin.deleteUser(uid);

    if (error) {
      return { success: false, message: error.message };
    }

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
    const supabase = createAdminClient();

    // Get user by email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !users) {
      return {
        success: false,
        message: 'User not found. Please make sure the user has signed up in the application first.'
      };
    }

    // Update role to admin
    const { error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', users.id);

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Successfully granted admin role to user: ${email}. Please log out and log back in to see the changes.`
    };
  } catch (error: any) {
    console.error('Error setting admin role:', error);
    return { success: false, message: error.message || 'Failed to set admin role.' };
  }
}

export async function createProduct(
  name: string,
  costPrice: number,
  sellingPrice: number,
  stock: number,
  imageUrl: string,
  imageHint: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('products')
      .insert({
        name,
        cost_price: costPrice,
        selling_price: sellingPrice,
        stock,
        image_url: imageUrl,
        image_hint: imageHint,
      });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Product "${name}" created successfully.`
    };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return { success: false, message: error.message || 'Failed to create product.' };
  }
}

export async function updateProduct(
  productId: string,
  name: string,
  costPrice: number,
  sellingPrice: number,
  stock: number
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('products')
      .update({
        name,
        cost_price: costPrice,
        selling_price: sellingPrice,
        stock,
      })
      .eq('id', productId);

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Product "${name}" updated successfully.`
    };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return { success: false, message: error.message || 'Failed to update product.' };
  }
}

export async function deleteProduct(productId: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Product deleted successfully.'
    };
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return { success: false, message: error.message || 'Failed to delete product.' };
  }
}

export async function fetchUsers(): Promise<{ success: boolean; users?: SalesAgent[]; message?: string }> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    const mappedUsers = data.map((u) => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: u.role,
    }));

    return { success: true, users: mappedUsers as SalesAgent[] };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { success: false, message: error.message || 'Failed to fetch users.' };
  }
}

export async function recordSale(
  productId: string,
  quantity: number,
  salesAgentId: string
): Promise<{ success: boolean; message: string; totalRevenue?: number }> {
  try {
    const supabase = createAdminClient();

    // Start a transaction by fetching product within a single request
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Product fetch error:', productError);
      return { success: false, message: productError?.message || 'Product not found.' };
    }

    // Check stock
    if (product.stock < quantity) {
      return {
        success: false,
        message: `Insufficient stock. Only ${product.stock} units available.`
      };
    }

    // Calculate sale values
    const totalRevenue = product.selling_price * quantity;
    const totalCost = product.cost_price * quantity;
    const profit = totalRevenue - totalCost;

    // Update product stock
    const newStock = product.stock - quantity;
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (updateError) {
      console.error('Product update error:', updateError);
      return { success: false, message: updateError.message || 'Failed to update product stock.' };
    }

    // Record the sale
    const { error: saleError } = await supabase
      .from('sales')
      .insert({
        product_id: productId,
        product_name: product.name,
        quantity,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        profit,
        sales_agent_id: salesAgentId,
      });

    if (saleError) {
      console.error('Sale insert error:', saleError);
      // Rollback: restore product stock
      await supabase
        .from('products')
        .update({ stock: product.stock })
        .eq('id', productId);
      return { success: false, message: saleError.message || 'Failed to record sale.' };
    }

    return {
      success: true,
      message: 'Sale recorded successfully.',
      totalRevenue
    };
  } catch (error: any) {
    console.error('Error recording sale:', error);
    return { success: false, message: error.message || 'Failed to record sale.' };
  }
}

export async function updateSale(
  saleId: string,
  quantity: number,
  productId: string,
  oldQuantity: number
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createAdminClient();

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return { success: false, message: 'Product not found.' };
    }

    // Calculate new stock (restore old quantity, then deduct new quantity)
    const stockChange = oldQuantity - quantity;
    const newStock = product.stock + stockChange;

    if (newStock < 0) {
      return { success: false, message: `Insufficient stock. Only ${product.stock + oldQuantity} units available.` };
    }

    // Update product stock
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (stockError) {
      return { success: false, message: stockError.message };
    }

    // Recalculate sale values
    const totalRevenue = product.selling_price * quantity;
    const totalCost = product.cost_price * quantity;
    const profit = totalRevenue - totalCost;

    // Update sale record
    const { error: saleError } = await supabase
      .from('sales')
      .update({
        quantity,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        profit,
      })
      .eq('id', saleId);

    if (saleError) {
      // Rollback stock change
      await supabase
        .from('products')
        .update({ stock: product.stock })
        .eq('id', productId);
      return { success: false, message: saleError.message };
    }

    return { success: true, message: 'Sale updated successfully.' };
  } catch (error: any) {
    console.error('Error updating sale:', error);
    return { success: false, message: error.message || 'Failed to update sale.' };
  }
}

export async function deleteSale(
  saleId: string,
  productId: string,
  quantity: number
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createAdminClient();

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return { success: false, message: 'Product not found.' };
    }

    // Restore stock
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: product.stock + quantity })
      .eq('id', productId);

    if (stockError) {
      return { success: false, message: stockError.message };
    }

    // Delete sale record
    const { error: saleError } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId);

    if (saleError) {
      // Rollback stock change
      await supabase
        .from('products')
        .update({ stock: product.stock })
        .eq('id', productId);
      return { success: false, message: saleError.message };
    }

    return { success: true, message: 'Sale deleted successfully.' };
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    return { success: false, message: error.message || 'Failed to delete sale.' };
  }
}
