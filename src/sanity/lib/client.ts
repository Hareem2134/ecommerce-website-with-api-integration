import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, // Fetch from env
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, // Fetch from env
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION, // Fetch from env
  useCdn: false, // Set to false if statically generating pages, using ISR or tag-based revalidation
});
