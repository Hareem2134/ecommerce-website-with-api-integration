import { createClient } from 'next-sanity';

// Importing environment variables
import { apiVersion, dataset, projectId } from '../env';

// Initialize the Sanity client
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || projectId, // Fallback to hardcoded values
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || dataset, // Fallback to hardcoded values
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || apiVersion, // Fallback to hardcoded values
  useCdn: false, // Disable CDN for real-time updates
  token: process.env.SANITY_WRITE_TOKEN, // Required for mutations
});

// Function to save order data to Sanity
export const saveOrderToSanity = async (orderData: any) => {
  try {
    if (!client.config().token) {
      throw new Error('Sanity token is missing. Ensure SANITY_WRITE_TOKEN is set in your environment variables.');
    }

    // Save the order in the "order" document type
    const result = await client.create({
      _type: 'order',
      ...orderData,
    });

    console.log('Order saved to Sanity:', result);
    return result;
  } catch (error) {
    // Ensure the error is of type Error
    if (error instanceof Error) {
      console.error('Error saving order to Sanity:', error.message);
    } else {
      console.error('Unexpected error saving order to Sanity:', error);
    }
    throw new Error('Failed to save order. Please try again later.');
  }
};
